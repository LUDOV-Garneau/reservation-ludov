import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;

    try {
      const token = sessionCookie?.value;
      if(token) user = verifyToken(token);
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
    if (!user?.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        email,
        createdAt,
        firstname AS firstName,
        lastname AS lastName,
        isAdmin As isAdmin
      FROM users
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const [countRows] = (await pool.query(`
      SELECT COUNT(*) AS total FROM users
    `)) as [Array<{ total: number }>, unknown];
    const total = countRows[0].total;

    return NextResponse.json({ rows, total });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
