import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const { reservationId, game1Id, game2Id, game3Id, newConsoleId } = await req.json();

  if (!reservationId) {
    return NextResponse.json(
      { success: false, message: "reservationId manquant" },
      { status: 400 }
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Vérifier la réservation
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT console_id FROM reservation_hold WHERE id = ? FOR UPDATE`,
      [reservationId]
    );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      return NextResponse.json(
        { success: false, message: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const currentConsoleId = rows[0].console_id;

    // Si l'utilisateur veut changer de console
    if (newConsoleId && newConsoleId !== currentConsoleId) {
      // Libérer l'ancienne
      await conn.query(
        `UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`,
        [currentConsoleId]
      );

      // Réserver la nouvelle (vérifier dispo)
      const [checkNew] = await conn.query<RowDataPacket[]>(
        `SELECT nombre FROM consoles WHERE id = ? FOR UPDATE`,
        [newConsoleId]
      );

      if (!checkNew || checkNew.length === 0 || checkNew[0].nombre <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, message: "Nouvelle console indisponible" },
          { status: 400 }
        );
      }

      await conn.query(
        `UPDATE consoles SET nombre = nombre - 1 WHERE id = ?`,
        [newConsoleId]
      );

      // Mise à jour de la réservation avec la nouvelle console
      await conn.query(
        `UPDATE reservation_hold 
         SET console_id = ?, game1_id = ?, game2_id = ?, game3_id = ?
         WHERE id = ?`,
        [newConsoleId, game1Id || null, game2Id || null, game3Id || null, reservationId]
      );
    } else {
      // Mise à jour simple (jeux uniquement)
      await conn.query(
        `UPDATE reservation_hold 
         SET game1_id = ?, game2_id = ?, game3_id = ?
         WHERE id = ?`,
        [game1Id || null, game2Id || null, game3Id || null, reservationId]
      );
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      reservationId,
      consoleId: newConsoleId || currentConsoleId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Erreur update reservation:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
