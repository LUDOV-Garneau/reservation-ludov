import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";

type Body = {
  consoleTypeId: number;
  minutes?: number;
};

interface HoldRow extends RowDataPacket {
  holdId: string;
  consoleStockId: number;
  expiresAt: Date | string;
  expiresIn: number; // secondes
}

export async function POST(req: Request) {
  try {
    // cookies() est synchrone
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;

    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Body
    let body: Partial<Body> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const consoleTypeId = Number(body.consoleTypeId);
    const minutes = Math.max(1, Number(body.minutes ?? 15));
    if (!Number.isFinite(consoleTypeId) || consoleTypeId <= 0) {
      return NextResponse.json(
        { success: false, message: "consoleTypeId requis" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Nettoyage des holds expirés
      await connection.query(
        `DELETE FROM reservation_hold WHERE expireAt <= NOW()`
      );

      // Si l'utilisateur a déjà un hold actif, on le renvoie DIRECT avec expiresIn
      const [existing] = await connection.query<HoldRow[]>(
        `
        SELECT
          id AS holdId,
          console_id AS consoleStockId,
          expireAt AS expiresAt,
          GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expireAt)) AS expiresIn
        FROM reservation_hold
        WHERE user_id = ?
          AND expireAt > NOW()
        LIMIT 1
        `,
        [userId]
      );
      if (existing.length > 0) {
        await connection.commit();
        return NextResponse.json(
          {
            success: true,
            reservationId: existing[0].holdId, // alias pratique côté front
            holdId: existing[0].holdId,
            consoleStockId: existing[0].consoleStockId,
            expiresAt: new Date(existing[0].expiresAt).toISOString(),
            expiresIn: Number(existing[0].expiresIn), // <<< TTL serveur
            message: "Hold existant récupéré",
          },
          { status: 200 }
        );
      }

      // Choisir une unité dispo
      const [units] = await connection.query<RowDataPacket[]>(
        `
        SELECT cs.id AS consoleStockId
        FROM console_stock cs
        WHERE cs.console_type_id = ?
          AND cs.is_active = 1
          AND cs.holding = 0
          AND NOT EXISTS (
            SELECT 1 FROM reservation_hold h
            WHERE h.console_id = cs.id
              AND h.expireAt > NOW()
          )
        LIMIT 1
        FOR UPDATE
        `,
        [consoleTypeId]
      );

      if (units.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: "Aucune unité disponible pour ce type." },
          { status: 409 }
        );
      }

      const consoleStockId = Number(units[0].consoleStockId);
      const reservationId = `HOLD-${crypto.randomUUID()}`;

      // Création du hold (expireAt basé sur NOW() serveur)
      await connection.query(
        `
        INSERT INTO reservation_hold
          (id, user_id, console_id, console_type_id, expireAt, createdAt)
        VALUES
          (?,  ?,       ?,         ?,               DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
        `,
        [reservationId, userId, consoleStockId, consoleTypeId, minutes]
      );

      // Relire d'un coup: infos + TTL serveur
      const [created] = await connection.query<HoldRow[]>(
        `
        SELECT
          id AS holdId,
          console_id AS consoleStockId,
          expireAt AS expiresAt,
          GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expireAt)) AS expiresIn
        FROM reservation_hold
        WHERE id = ?
        LIMIT 1
        `,
        [reservationId]
      );

      // Marquer l'unité en "holding"
      await connection.query(`UPDATE console_stock SET holding = 1 WHERE id = ?`, [
        consoleStockId,
      ]);

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          reservationId,                      // pour cohérence front
          holdId: created[0].holdId,
          consoleStockId: created[0].consoleStockId,
          expiresAt: new Date(created[0].expiresAt).toISOString(),
          expiresIn: Number(created[0].expiresIn), // <<< TTL serveur
          message: "Réservation temporaire créée avec succès",
        },
        { status: 201 }
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("create-hold-reservation error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création du hold";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
