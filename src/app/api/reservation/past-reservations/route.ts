// app/api/reservations/past/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";

type ReservationRow = RowDataPacket & {
  id: number;
  archived: boolean;
  date: string | Date;
  time: string;
  console_name: string;
  game1_title: string | null;
  game2_title: string | null;
  game3_title: string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;

    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch (error) {
      console.error("Token verification error:", error);
    }

    if (!user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = Number(user.id);
    // const userId = 1;

    const [rows] = await pool.query<ReservationRow[]>(
      `
      SELECT 
        r.id,
        DATE(r.date) AS date,
        r.time,
        c.name AS console_name,
        g1.titre AS game1_title,
        g2.titre AS game2_title,
        g3.titre AS game3_title,
        r.archived
      FROM reservation r
      JOIN console_type c ON c.id = r.console_type_id
      LEFT JOIN games g1 ON g1.id = r.game1_id
      LEFT JOIN games g2 ON g2.id = r.game2_id
      LEFT JOIN games g3 ON g3.id = r.game3_id
      WHERE r.user_id = ?  AND TIMESTAMP(r.date, r.time) < UTC_TIMESTAMP() OR
      r.archived = 1
      ORDER BY TIMESTAMP(r.date, r.time) DESC`,
      [userId]
    );

    if (!rows.length) {
      return NextResponse.json([]);
    }
    const reservations = rows.map((row) => {
      const games = [row.game1_title, row.game2_title, row.game3_title].filter(
        Boolean
      ) as string[];

      let formattedDate: string;
      if (row.date instanceof Date) {
        const year = row.date.getFullYear();
        const month = String(row.date.getMonth() + 1).padStart(2, "0");
        const day = String(row.date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = String(row.date).split("T")[0];
      }

      return {
        id: String(row.id),
        archived: Boolean(row.archived),
        games,
        console: row.console_name,
        date: formattedDate,
        heure: row.time.slice(0, 5),
      };
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching past reservations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
