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
    coursId,
    date,
    time
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

    // Jeux
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

    // Accessoires (support pour plusieurs)
    if (accessories !== undefined) {
      if (Array.isArray(accessories)) {
        // Si tu veux supporter plusieurs accessoires, tu devras adapter ta DB
        // Pour l'instant on prend juste le premier
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

      // Libérer l'ancienne console
      await conn.query(
        `UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`,
        [currentConsoleId]
      );

      // Réserver la nouvelle console
      await conn.query(
        `UPDATE consoles SET nombre = nombre - 1 WHERE id = ?`,
        [newConsoleId]
      );

      updates.push("console_id = ?");
      values.push(newConsoleId);
      finalConsoleId = newConsoleId;
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
}