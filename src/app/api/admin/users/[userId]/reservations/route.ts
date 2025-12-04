import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

type ReservationRow = RowDataPacket & {
  id: number;
  date: Date | string;
  time: string;
  console_name: string;
  game1_title: string | null;
  game2_title: string | null;
  game3_title: string | null;
  archived: number;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = verifyToken(token);
    if (!admin?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userId: userIdParam } = await params;
    const userId = Number(userIdParam);

    if (!userIdParam || Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Bad Request: Invalid userId" },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();

    try {
      const [userExists] = await conn.query(
        "SELECT id FROM users WHERE id = ?",
        [userId]
      );

      if (Array.isArray(userExists) && userExists.length === 0) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const [rows] = await conn.query<ReservationRow[]>(
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
        WHERE r.user_id = ?
        ORDER BY TIMESTAMP(r.date, r.time) DESC
        `,
        [userId]
      );

      const formattedReservations = rows.map((row) => {
        const games = [
          row.game1_title,
          row.game2_title,
          row.game3_title,
        ].filter(Boolean) as string[];

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
          games,
          console: row.console_name,
          date: formattedDate,
          heure: row.time.slice(0, 5),
          archived: row.archived === 1,
        };
      });

      return NextResponse.json(
        {
          success: true,
          reservations: formattedReservations,
        },
        { status: 200 }
      );
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
