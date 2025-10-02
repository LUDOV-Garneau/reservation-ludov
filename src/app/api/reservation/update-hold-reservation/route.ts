import { NextResponse } from "next/server";
import pool from "@/lib/db"; // ton utilitaire MySQL

export async function POST(req: Request) {
  const { reservationId } = await req.json();

  if (!reservationId) {
    return NextResponse.json(
      { success: false, message: "reservationId manquant" },
      { status: 400 }
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Récupérer la console
    const [rows]: any = await conn.query(
      `SELECT console_id FROM reservation_hold WHERE id = ? FOR UPDATE`,
      [reservationId]
    );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      return NextResponse.json({ success: false, message: "Réservation introuvable" }, { status: 404 });
    }

    const consoleId = rows[0].console_id;

    // Supprimer la réservation
    await conn.query(`DELETE FROM reservation_hold WHERE id = ?`, [reservationId]);

    // Libérer la console
    await conn.query(
      `UPDATE consoles SET nombre = nombre + 1 WHERE id = ?`,
      [consoleId]
    );

    await conn.commit();

    return NextResponse.json({ success: true, reservationId, releasedConsoleId: consoleId });
  } catch (err) {
    await conn.rollback();
    console.error("Erreur cancel reservation:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  } finally {
    conn.release();
  }

}
