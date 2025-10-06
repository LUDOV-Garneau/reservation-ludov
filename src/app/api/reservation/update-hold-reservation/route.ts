import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const { 
    reservationId, 
    game1Id, 
    game2Id, 
    game3Id, 
    newConsoleId, 
    accessories, 
    coursId 
  } = await req.json();

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

    // --- Construction dynamique des updates ---
    const updates: string[] = [];
    const values: unknown[] = [];

    if (game1Id !== undefined) {
      updates.push("game1_id = ?");
      values.push(game1Id); // null explicite seulement si tu veux reset
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
      updates.push("accessoir_id = ?");
      values.push(accessories?.[0] || null);
    }
    if (coursId !== undefined) {
      updates.push("cours = ?");
      values.push(coursId || null);
    }

    // --- Changement de console ---
    if (newConsoleId && newConsoleId !== currentConsoleId) {
      await conn.query(
        `UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`,
        [currentConsoleId]
      );

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

      updates.push("console_id = ?");
      values.push(newConsoleId);
    }

    // --- Mise à jour en DB seulement si nécessaire ---
    if (updates.length > 0) {
      const sql = `UPDATE reservation_hold SET ${updates.join(", ")} WHERE id = ?`;
      values.push(reservationId);
      await conn.query(sql, values);
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      reservationId,
      consoleId: newConsoleId || currentConsoleId,
      accessories: accessories || [],
      coursId: coursId || null,
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
