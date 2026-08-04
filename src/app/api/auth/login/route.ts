import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signToken, verifyToken } from "@/lib/jwt";
import db from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await db.query.users.findFirst({
      columns: { id: true, email: true, password: true, firstname: true, isAdmin: true },
      where: (t) => and(eq(t.email, email), isNotNull(t.password)),
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    await db.update(users).set({ lastLogin: sql`NOW()` }).where(eq(users.id, user.id));

    const token = signToken({
      id: user.id,
      name: user.firstname,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({ message: "Utilisateur connecté avec succès!" });
    response.cookies.set({
      name: "SESSION",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Une erreur s'est produite." }, { status: 500 });
  }
}
