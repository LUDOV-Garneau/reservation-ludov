import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
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
    const body = await req.json();
    const { firstname, lastname, email, isAdmin = 0 } = body;

    if (!firstname || !lastname || !email) {
      return NextResponse.json(
        { error: "Champs requis manquants (firstname, lastname, email)." },
        { status: 400 }
      );
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Format de courriel invalide." },
        { status: 400 }
      );
    }

    const now = new Date();

    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if ((existing as RowDataPacket[]).length > 0) {
        conn.release();
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà." },
          { status: 409 }
        );
      }

      await conn.query(
        `
        INSERT INTO users (firstname, lastname, email, password, isAdmin, lastUpdatedAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [firstname, lastname, email, null, isAdmin, now, now]
      );

      conn.release();

      return NextResponse.json(
        { success: true, message: "Utilisateur ajouté avec succès." },
        { status: 201 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de l'insertion :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
