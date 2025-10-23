import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

type Body = {
  reservationId: string;
  game1Id?: number | null;
  game2Id?: number | null;
  game3Id?: number | null;
  newConsoleId?: number;
  accessories?: number[] | number | null;
  coursId?: number | null;
  date?: string | null;
  time?: string | null;
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
    const reservationId = String(body.reservationId);
    const game1Id = body.game1Id !== undefined ? (body.game1Id !== null ? Number(body.game1Id) : null) : undefined;
    const game2Id = body.game2Id !== undefined ? (body.game2Id !== null ? Number(body.game2Id) : null) : undefined;
    const game3Id = body.game3Id !== undefined ? (body.game3Id !== null ? Number(body.game3Id) : null) : undefined;
    const newConsoleId = body.newConsoleId !== undefined ? Number(body.newConsoleId) : undefined;
    const accessories = body.accessories; 
    const coursId = body.coursId;
    const date = body.date;
    const time = body.time;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "reservationId manquant" },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Vérifier la réservation et récupérer l'état actuel
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT 
          console_id, 
          game1_id, 
          game2_id, 
          game3_id,
          date,
          time,
          expireAt
        FROM reservation_hold 
        WHERE id = ? 
        FOR UPDATE`,
        [reservationId]
      );

      if (!rows || rows.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, message: "Réservation introuvable" },
          { status: 404 }
        );
      }

      const reservation = rows[0];

      // Vérifier si la réservation n'a pas expiré
      if (new Date(reservation.expireAt) < new Date()) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, message: "Réservation expirée" },
          { status: 410 }
        );
      }

      const currentConsoleId = reservation.console_id;

      // --- Construction dynamique des updates ---
      const updates: string[] = [];
      const values: unknown[] = [];

      //Check la disponibilité des jeux
      const gameIdsToCheck = [
        { id: game1Id, field: "game1_id" as const },
        { id: game2Id, field: "game2_id" as const },
        { id: game3Id, field: "game3_id" as const },
      ];

      for (const game of gameIdsToCheck) {
        const currentGameId = reservation[game.field];
        
        if (game.id !== undefined && game.id !== null) {
          
          if (currentGameId === game.id) {
            continue;
          }
          
          const [gameCheck] = await conn.query<RowDataPacket[]>(
            `SELECT id 
            FROM games 
            WHERE id = ? 
            AND holding = 0
            FOR UPDATE`,
            [game.id]
          );

          if (!gameCheck || gameCheck.length === 0) {
            await conn.rollback();
            return NextResponse.json(
              { success: false, message: `Jeu ${game.id} indisponible` },
              { status: 400 }
            );
          }

          await conn.query(
            `UPDATE games SET holding = 1 WHERE id = ?`,
            [game.id]
          );

          if (currentGameId !== null) {
            await conn.query(
              `UPDATE games SET holding = 0 WHERE id = ?`,
              [currentGameId]
            );
          }
        } 
        else if (game.id === null) {
          if (currentGameId !== null) {
            await conn.query(
              `UPDATE games SET holding = 0 WHERE id = ?`,
              [currentGameId]
            );
          }
        }
      }

      if (game1Id !== undefined) {
        updates.push("game1_id = ?");
        values.push(game1Id);
      }
      if (game2Id !== undefined) {
        updates.push("game2_id = ?");
        values.push(game2Id);
      }
      if (game3Id !== undefined) {
        updates.push("game3_id = ?");
        values.push(game3Id);
      }

      if (accessories !== undefined) {
        if (Array.isArray(accessories)) {
          updates.push("accessoir_id = ?");
          values.push(accessories.length > 0 ? accessories[0] : null);
        } else {
          updates.push("accessoir_id = ?");
          values.push(accessories);
        }
      }

      // Cours
      if (coursId !== undefined) {
        updates.push("cours = ?");
        values.push(coursId || null);
      }

      // Date et heure
      if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
      }
      if (time !== undefined) {
        updates.push("time = ?");
        values.push(time);
      }

      // --- Changement de console ---
      let finalConsoleId = currentConsoleId;

      if (newConsoleId && newConsoleId !== currentConsoleId) {
        // Vérifier disponibilité de la nouvelle console

        const [unitsNewConsole] = await conn.query<RowDataPacket[]>(
        `
        SELECT cs.id AS consoleStockId
        FROM console_stock cs
        WHERE cs.console_type_id = ?
          AND cs.is_active = 1
          AND cs.holding = 0
        LIMIT 1
        `,
          [newConsoleId]
        );

        const [checkNew] = await conn.query<RowDataPacket[]>(
          `SELECT holding FROM console_stock WHERE id = ? FOR UPDATE`,
          [unitsNewConsole[0].consoleStockId]
        );

        if (!checkNew || checkNew.length === 0 || checkNew[0].holding === 1) {
          await conn.rollback();
          return NextResponse.json(
            { success: false, message: "Nouvelle console indisponible" },
            { status: 400 }
          );
        }

        // Libérer l'ancienne console
        await conn.query(
          `UPDATE console_stock SET holding = 0 WHERE id = ?`,
          [currentConsoleId]
        );

        // Réserver la nouvelle console
        await conn.query(
          `UPDATE console_stock SET holding = 1 WHERE id = ?`,
          [unitsNewConsole[0].consoleStockId]
        );

        updates.push("console_id = ?");
        values.push(unitsNewConsole[0].consoleStockId);
        finalConsoleId = unitsNewConsole[0].consoleStockId;
      }

      // --- Mise à jour en DB seulement si nécessaire ---
      if (updates.length > 0) {
        const sql = `UPDATE reservation_hold SET ${updates.join(", ")} WHERE id = ?`;
        values.push(reservationId);
        await conn.query(sql, values);
      }

      await conn.commit();

      // Récupérer les données mises à jour pour la réponse
      const [updatedRows] = await conn.query<RowDataPacket[]>(
        `SELECT 
          id,
          console_id,
          game1_id,
          game2_id,
          game3_id,
          accessoir_id,
          cours,
          date,
          time,
          expireAt
        FROM reservation_hold 
        WHERE id = ?`,
        [reservationId]
      );

      const updated = updatedRows[0];

      return NextResponse.json({
        success: true,
        reservationId,
        consoleId: finalConsoleId,
        games: [
          updated.game1_id,
          updated.game2_id,
          updated.game3_id
        ].filter(id => id !== null),
        accessories: updated.accessoir_id ? [updated.accessoir_id] : [],
        coursId: updated.cours || null,
        date: updated.date,
        time: updated.time,
        expireAt: updated.expireAt,
      });
    } catch (err) {
      await conn.rollback();
      console.error("Erreur update reservation:", err);
      return NextResponse.json(
        { success: false, message: "Erreur serveur", error: err instanceof Error ? err.message : "Unknown error" },
        { status: 500 }
      );
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("update-hold-reservation error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la mise à jour du hold";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}