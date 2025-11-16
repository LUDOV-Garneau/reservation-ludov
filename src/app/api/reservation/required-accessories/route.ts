import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

type GameRow = RowDataPacket & {
  required_accessories: number[];
};

type AccessoriesRow = RowDataPacket & {
  id: number;
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

    const requiredAccessories: number[] = [];
    rows.forEach((accessoriesArray) => {
      if (accessoriesArray.required_accessories.length > 0) {
        requiredAccessories.push(accessoriesArray.required_accessories[0]);
      }
    });

    return NextResponse.json({ required_accessories: requiredAccessories });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
