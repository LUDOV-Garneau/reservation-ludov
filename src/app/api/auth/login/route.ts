import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { signToken, verifyToken } from "@/lib/jwt";
import type { User } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const [rows] = await pool.query(
      "SELECT id, email, password as password_hash, firstname as name, isAdmin FROM users WHERE email = ? AND password IS NOT NULL LIMIT 1",
      [email]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { message: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const user = rows[0] as User;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      message: "Utilisateur connecté avec succès!",
    });

    response.cookies.set({
      name: "SESSION",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV == "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 }
    );
  }
}
