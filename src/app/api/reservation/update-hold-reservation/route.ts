import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const { reservationId, game1Id, game2Id, game3Id, newConsoleId, accessories } = await req.json();

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

    // Vérifier si la console doit être changée
    if (newConsoleId && newConsoleId !== currentConsoleId) {
      // Libérer l'ancienne
      await conn.query(
        `UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`,
        [currentConsoleId]
      );

      // Vérifier la dispo de la nouvelle
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

      // Décrémenter le stock de la nouvelle console
      await conn.query(
        `UPDATE consoles SET nombre = nombre - 1 WHERE id = ?`,
        [newConsoleId]
      );

      // Mettre à jour la réservation
      await conn.query(
        `UPDATE reservation_hold 
         SET console_id = ?, game1_id = ?, game2_id = ?, game3_id = ?, accessoir_id = ?
         WHERE id = ?`,
        [
          newConsoleId,
          game1Id || null,
          game2Id || null,
          game3Id || null,
          accessories?.[0] || null, // 1 accessoire max
          reservationId,
        ]
      );
    } else {
      // Mise à jour simple (jeux + accessoire)
      await conn.query(
        `UPDATE reservation_hold 
         SET game1_id = ?, game2_id = ?, game3_id = ?, accessoir_id = ?
         WHERE id = ?`,
        [
          game1Id || null,
          game2Id || null,
          game3Id || null,
          accessories?.[0] || null, // 1 accessoire max
          reservationId,
        ]
      );
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      reservationId,
      consoleId: newConsoleId || currentConsoleId,
      accessories: accessories || [],
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
