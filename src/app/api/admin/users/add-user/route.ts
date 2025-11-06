import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

type Body = {
  firstname: string;
  lastname: string;
  email: string;
  isAdmin?: number;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch (error) {
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

    let body: Partial<Body> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const firstname = body.firstname?.trim();
    const lastname = body.lastname?.trim();
    const email = body.email?.trim();
    const isAdmin = body.isAdmin === 1 ? 1 : 0;

    if (!firstname || !lastname || !email) {
      return NextResponse.json(
        { error: "Prénom, nom de famille et email sont requis." },
        { status: 400 }
      );
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
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
      console.error("Erreur lors de l'ajout de l'utilisateur :", err);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur lors du traitement de la requête :", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
