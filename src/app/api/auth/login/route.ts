import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";
import { readSession } from "@/lib/session";
import db from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await readSession(request.cookies.get("SESSION")?.value);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, locale } = await request.json();

    const user = await db.query.users.findFirst({
      columns: {
        id: true,
        email: true,
        password: true,
        firstname: true,
        isAdmin: true,
        sessionVersion: true,
      },
      where: (t) => and(eq(t.email, email), isNotNull(t.password)),
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    // Mémorise la langue de l'interface au moment de la connexion : elle sert
    // de langue pour les courriels transactionnels.
    const preferredLocale =
      locale === "en" || locale === "fr" ? locale : undefined;
    await db
      .update(users)
      .set({ lastLogin: sql`NOW()`, ...(preferredLocale && { preferredLocale }) })
      .where(eq(users.id, user.id));

    const token = signToken({
      id: user.id,
      name: user.firstname,
      email: user.email,
      isAdmin: user.isAdmin,
      // Périme ce jeton dès la prochaine réinitialisation de mot de passe.
      sv: user.sessionVersion,
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
