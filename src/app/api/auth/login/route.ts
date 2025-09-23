import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";
import type { User } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, name FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = rows[0] as User;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
