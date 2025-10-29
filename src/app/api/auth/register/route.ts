import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";

type ValidEmailRow = RowDataPacket & { validEmail: number };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          message: "Le courriel est requis.",
        },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<ValidEmailRow[]>(
      "SELECT COUNT(*) as valid_email FROM users WHERE email = ? AND password IS NULL",
      [email]
    );

    if (rows[0].valid_email == 0) {
      return NextResponse.json(
        { message: "Courriel invalide." },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { message: "Courriel valide." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("🔴 ERREUR INSCRIPTION:", error);
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 }
    );
  }
}

type PwdRow = RowDataPacket & { hasPassword: boolean };

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Le courriel et le mot de passe sont requis.",
        },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<PwdRow[]>(
      "SELECT password != '' AS has_password FROM users WHERE email = ?",
      [email]
    );

    const hasPassword = rows[0]?.has_password === 1;
    if (hasPassword) {
      return NextResponse.json(
        { message: "Cet utilisateur est déjà enregistré." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);

    return NextResponse.json(
      { message: "Mot de passe créé avec succès!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("🔴 ERREUR INSCRIPTION:", error);
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 }
    );
  }
}
