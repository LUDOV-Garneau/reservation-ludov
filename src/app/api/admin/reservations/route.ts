import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `
      SELECT 
        r.id,
        r.console,
        r.games,
        r.createdAt,
        r.station,
        r.date,
        r.etudiant_id,
        u.email AS etudiant_email  -- récupère l'email
      FROM reservations r
      LEFT JOIN users u ON r.etudiant_id = u.id
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countRows] = (await pool.query(`
      SELECT COUNT(*) AS total FROM reservations
    `)) as [Array<{ total: number }>, unknown];
    const total = countRows[0].total;

    return NextResponse.json({ rows, total });
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}