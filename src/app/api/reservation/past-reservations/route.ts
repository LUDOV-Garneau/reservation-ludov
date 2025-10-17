// app/api/reservations/past/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";

type ReservationRow = RowDataPacket & {
  id: number;
  createdAt: Date | string;
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
    const now = new Date();

    const [rows] = await pool.query<ReservationRow[]>(
      `
      SELECT 
        rh.id,
        rh.createdAt,
        c.name AS console_name,
        g1.titre AS game1_title,
        g2.titre AS game2_title,
        g3.titre AS game3_title
      FROM reservation_hold rh
      JOIN consoles c ON c.id = rh.console_id
      LEFT JOIN games g1 ON g1.id = rh.game1_id
      LEFT JOIN games g2 ON g2.id = rh.game2_id
      LEFT JOIN games g3 ON g3.id = rh.game3_id
      WHERE rh.user_id = ? AND rh.createdAt < ?
      ORDER BY rh.createdAt DESC
      `,
      [userId, now]
    );

    if (!rows.length) {
      return NextResponse.json([]);
    }

    const reservations = rows.map((row) => {
      const dateString = row.createdAt instanceof Date
        ? row.createdAt.toISOString().replace("T", " ").substring(0, 19)
        : String(row.createdAt ?? "");

      const [datePart, timePart] = dateString.split(" ");
      const heure = (timePart ?? "").slice(0, 5);

      const games = [
        row.game1_title,
        row.game2_title,
        row.game3_title
      ].filter(Boolean) as string[];

      return {
        id: row.id.toString(),
        games,
        console: row.console_name,
        date: datePart ?? "",
        heure: heure ?? "",
      };
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("🔴 ERREUR PAST RÉSERVATIONS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique." },
      { status: 500 }
    );
  }
}