import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(
      `
      SELECT
        id,
        console_type_id,
        name,
        picture
      FROM console_stock
      WHERE is_active = 1 AND holding = 0
      ORDER BY name ASC
      `
    );

    conn.release();

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du fetch consoleStock :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}