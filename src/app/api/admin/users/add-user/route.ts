import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

type Body = {
  firstname?: string;
  lastname?: string;
  email?: string;
  isAdmin?: number | boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let conn = null;

  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user?.isAdmin) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 }
        );
    }

    if (!user?.id) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    let body: Body = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Body JSON invalide." },
        { status: 400 }
      );
    }

    const firstnameRaw = typeof body.firstname === "string" ? body.firstname : "";
    const lastnameRaw = typeof body.lastname === "string" ? body.lastname : "";
    const emailRaw = typeof body.email === "string" ? body.email : "";

    const firstname = firstnameRaw.trim();
    const lastname = lastnameRaw.trim();
    const email = emailRaw.trim().toLowerCase();

    const isAdmin =
      body.isAdmin === 1 || body.isAdmin === true ? 1 : 0;

    if (!firstname || !lastname || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Prénom, nom de famille et email sont requis.",
        },
        { status: 400 }
      );
    }

    if (firstname.length < 2 || firstname.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le prénom doit contenir entre 2 et 50 caractères.",
        },
        { status: 400 }
      );
    }

    if (lastname.length < 2 || lastname.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom doit contenir entre 2 et 50 caractères.",
        },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format d'email invalide." },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "L'adresse email est trop longue (max. 255 caractères).",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    conn = await pool.getConnection();

    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if ((existing as RowDataPacket[]).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Un utilisateur avec cet email existe déjà.",
        },
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

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur ajouté avec succès.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors du traitement de la requête :", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    if (conn) {
      conn.release();
    }
  }
}
