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

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      // token invalide/expiré
    }
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    let body: Partial<Body> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Body JSON invalide" },
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

      await connection.query(
        `DELETE FROM reservation_hold WHERE expireAt <= CURRENT_TIMESTAMP`
      );

      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT id AS holdId, console_id AS consoleStockId, expireAt AS expiresAt
         FROM reservation_hold
         WHERE user_id = ? AND expireAt > CURRENT_TIMESTAMP
         LIMIT 1`,
        [userId]
      );
      if (existing.length > 0) {
        await connection.commit();
        return NextResponse.json(
          { success: true, ...existing[0] },
          { status: 200 }
        );
      }

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
              AND h.expireAt > CURRENT_TIMESTAMP
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

      await connection.query(
        `
        INSERT INTO reservation_hold (id, user_id, console_id, expireAt, createdAt)
        VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE), NOW())
        `,
        [reservationId, userId, consoleStockId, minutes]
      );

      const [created] = await connection.query<RowDataPacket[]>(
        `SELECT id AS holdId, console_id AS consoleStockId, expireAt AS expiresAt
         FROM reservation_hold WHERE id = ?`,
        [reservationId]
      );

      await connection.query(
        `UPDATE console_stock SET holding = 1 WHERE id = ?`,
        [consoleStockId]
      )

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          reservationId,
          ...created[0],
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
