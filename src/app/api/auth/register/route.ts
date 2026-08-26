import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "@/lib/sendEmail";
import db from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ message: "Le courriel est requis." }, { status: 400 });

    const row = await db.query.users.findFirst({
      columns: { id: true },
      where: (t) => and(eq(t.email, email), isNull(t.password)),
    });

    if (!row) return NextResponse.json({ message: "Courriel invalide." }, { status: 401 });
    return NextResponse.json({ message: "Courriel valide." }, { status: 200 });
  } catch (error) {
    console.error("ERREUR INSCRIPTION:", error);
    return NextResponse.json({ message: "Une erreur s'est produite." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Le courriel et le mot de passe sont requis." }, { status: 400 });
    }

    const row = await db.query.users.findFirst({
      columns: { password: true, preferredLocale: true },
      where: (t) => eq(t.email, email),
    });

    const hasPassword = row?.password != null && row.password !== "";
    if (hasPassword) {
      return NextResponse.json({ message: "Cet utilisateur est déjà enregistré." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ password: passwordHash }).where(eq(users.email, email));

    const response = await sendWelcomeEmail({
      to: email,
      locale: row?.preferredLocale,
    });
    if (response.rejected.length > 0) throw new Error();

    return NextResponse.json({ message: "Mot de passe créé avec succès!" }, { status: 201 });
  } catch (error) {
    console.error("ERREUR INSCRIPTION:", error);
    return NextResponse.json({ message: "Une erreur s'est produite." }, { status: 500 });
  }
}
