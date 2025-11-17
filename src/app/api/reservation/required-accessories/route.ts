import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

type GameRow = RowDataPacket & {
  required_accessories: number[];
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gameIds = searchParams.getAll("gameIds");

    const [rows] = await pool.query<GameRow[]>(
      `SELECT required_accessories FROM games WHERE id IN (?)`,
      [gameIds]
    );

    const kohaIds: number[] = [];
    rows.forEach((row) => {
      if (row.required_accessories?.length > 0) {
        kohaIds.push(row.required_accessories[0]);
      }
    });

    if (kohaIds.length === 0) {
      return NextResponse.json({ required_accessories: [] });
    }

    const [mapped] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM accessoires WHERE koha_id IN (?)`,
      [kohaIds]
    );

    const accessoryIds = mapped.map((row) => row.id);

    return NextResponse.json({
      required_accessories: accessoryIds,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
