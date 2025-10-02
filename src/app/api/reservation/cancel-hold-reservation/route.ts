import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(req: Request) {
  try {
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "reservationId manquant" },
        { status: 400 }
      );
    }

    // Récupérer l’ancienne console pour la libérer
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT console_id FROM reservation_hold WHERE id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Réservation introuvable" },
        { status: 404 }
      );
    }

    const consoleId = rows[0].console_id as number | null;

    // Supprimer la réservation
    await pool.query<ResultSetHeader>(`DELETE FROM reservation_hold WHERE id = ?`, [
      reservationId,
    ]);

    // Libérer la console si elle existe
    if (consoleId) {
      await pool.query(`UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`, [
        consoleId,
      ]);
    }

    return NextResponse.json({
      success: true,
      reservationId,
      releasedConsoleId: consoleId,
    });
  } catch (err) {
    console.error("Erreur cancel reservation:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
