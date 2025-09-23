import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || typeof payload === "string") {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }

  try {
    const userId = payload.id;
    const [rows] = await pool.query(
      "SELECT id, email, name FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json(user, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
