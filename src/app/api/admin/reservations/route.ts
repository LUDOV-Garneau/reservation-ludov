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
        r.console AS console_id,
        r.games,
        r.createdAt,
        r.station,
        r.date,
        r.etudiant_id,
        u.email AS etudiant_email
      FROM reservations r
      LEFT JOIN users u ON r.etudiant_id = u.id
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const reservationsWithNames = await Promise.all(
      (rows as any[]).map(async (resv) => {
        let gamesArray: number[] = [];
        try {
          gamesArray = Array.isArray(resv.games) ? resv.games : JSON.parse(resv.games);
        } catch {}

        const gamesTitles = gamesArray.length > 0
          ? ((await pool.query(`SELECT titre FROM games WHERE id IN (?)`, [gamesArray]))[0] as any[]).map(g => g.titre)
          : [];

        let consoleName = "";
        if (resv.console_id) {
          const [consoleRows] = await pool.query(
            `SELECT name FROM console_stock WHERE id = ?`,
            [resv.console_id]
          );
          consoleName = (consoleRows as any[])[0]?.name || "";
        }

        return {
          ...resv,
          games: gamesTitles,
          console: consoleName,
        };
      })
    );

    const [countRows] = (await pool.query(`SELECT COUNT(*) AS total FROM reservations`)) as [
      Array<{ total: number }>,
      unknown
    ];
    const total = countRows[0].total;

    return NextResponse.json({ rows: reservationsWithNames, total });
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}