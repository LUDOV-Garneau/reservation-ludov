import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

interface CoursRequestBody {
  name: string;
  code: string;
}

export async function POST(req: NextRequest) {
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

  try {
    const body: CoursRequestBody = await req.json();
    const { name, code } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Le champ nom est requis." }, { status: 400 });
    }

    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "Le champ code est requis." }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {

      const [existingCours] = await conn.query(
        `SELECT id FROM cours WHERE LOWER(nom_cours) = LOWER(?)`,
      [name.trim()]
      );
      if (Array.isArray(existingCours) && existingCours.length > 0) {
        conn.release();
        return NextResponse.json(
          { success: false, message: "Un cours avec ce nom existe déjà." },
          { status: 409 }
        );
      }

      await conn.query(
        `
        INSERT INTO cours (nom_cours, code_cours)
        VALUES (?, ?)
        `,
        [name, code]
      );
      conn.release();

      return NextResponse.json(
        { success: true, message: "Cours ajouté avec succès." },
        { status: 201 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de l'insertion SQL :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du cours :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}