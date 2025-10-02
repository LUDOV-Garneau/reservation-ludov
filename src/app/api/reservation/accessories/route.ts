import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = verifyToken(token);

  try {
    const [reservationHoldRows] = await pool.query(
      "SELECT console_id FROM reservation_hold WHERE user_id = ? ORDER BY createdAt DESC LIMIT 1",
      [user?.id]
    );
    const lastConsole = reservationHoldRows as { console_id: number }[];

    if (lastConsole.length === 0) {
      return NextResponse.json(
        { error: "No recent reservation hold found for user" },
        { status: 404 }
      );
    }

    const consoleId = lastConsole[0].console_id;

    const [accessoriesRows] = await pool.query(
      `SELECT id, name, console_id 
       FROM accessoires 
       WHERE JSON_CONTAINS(console_id, CAST(? AS JSON))`,
      [consoleId]
    );

    const accessories = (
      accessoriesRows as {
        id: number;
        name: string;
        console_id: number[] | string;
      }[]
    ).map((a) => ({
      id: a.id,
      name: a.name,
      console_id:
        typeof a.console_id === "string"
          ? JSON.parse(a.console_id)
          : a.console_id,
    }));

    if (accessories.length === 0) {
      return NextResponse.json(
        { error: "No accessories found for the user's console" },
        { status: 404 }
      );
    }

    return NextResponse.json(accessories);
  } catch (error) {
    console.error("Error fetching accessories:", error);
    return NextResponse.json(
      { error: "Failed to fetch accessories" },
      { status: 500 }
    );
  }
}
