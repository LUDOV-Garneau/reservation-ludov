import { NextResponse, NextRequest } from "next/server"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"

interface ReservationRow extends RowDataPacket {
  id: number;
  console_id: number | null;
  console_name: string | null;
  game1_title: string | null;
  game2_title: string | null;
  game3_title: string | null;
  station: number | null;
  station_name: string | null;
  date: string | Date;
  time: string;
  user_id: number | null;
  user_email: string | null;
  createdAt: string | Date;
}

interface ReservationStatsRow extends RowDataPacket {
  total: number;
  future: number;
  past: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const offset = (page - 1) * limit

    const [rows] = await pool.query<ReservationRow[]>(
      `
      SELECT 
        r.id,
        r.console_id,
        cs.name AS console_name,
        r.game1_id,
        g1.titre AS game1_title,
        r.game2_id,
        g2.titre AS game2_title,
        r.game3_id,
        g3.titre AS game3_title,
        r.station,
        r.date,
        r.time,
        r.user_id,
        u.email AS user_email,
        r.createdAt
      FROM reservation r
      LEFT JOIN console_stock cs ON r.console_id = cs.id
      LEFT JOIN games g1 ON r.game1_id = g1.id
      LEFT JOIN games g2 ON r.game2_id = g2.id
      LEFT JOIN games g3 ON r.game3_id = g3.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    )

    const reservations = rows.map((row) => {
      const games = [
        row.game1_title,
        row.game2_title,
        row.game3_title,
      ].filter(Boolean) as string[]

      const formattedDate =
        row.date instanceof Date
          ? `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}-${String(row.date.getDate()).padStart(2, "0")}`
          : String(row.date).split("T")[0]

      const formattedTime =
        typeof row.time === "string" ? row.time.slice(0, 5) : ""

      return {
        id: String(row.id),
        games,
        console: row.console_name ?? "",
        date: formattedDate,
        heure: formattedTime,
        station: row.station,
        userEmail: row.user_email,
      }
    })

    const [statsRows] = await pool.query<ReservationStatsRow[]>(
      `
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE
            WHEN r.date > CURDATE()
              OR (r.date = CURDATE() AND r.time >= CURTIME())
            THEN 1 ELSE 0
          END
        ) AS future,
        SUM(
          CASE
            WHEN r.date < CURDATE()
              OR (r.date = CURDATE() AND r.time < CURTIME())
            THEN 1 ELSE 0
          END
        ) AS past
      FROM reservation r
      `
    )

    const stats = statsRows[0]

    return NextResponse.json({
      rows: reservations,
      total: stats.total,           
      totalReservations: stats.total, 
      futureReservations: stats.future,  
      pastReservations: stats.past,       
    })
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations :", err)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
