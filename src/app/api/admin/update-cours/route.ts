import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function PUT(req: NextRequest) {
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
    const body = await req.json();
    const { name, coursId, code } = body;

    if (!name || name.trim() === "") {
      console.error("Nom du cours manquant ou vide.");
      return NextResponse.json(
        { error: "Le nom du cours est requis." },
        { status: 400 }
      );
    }

    if (!code || code.trim() === "") {
      console.error("Le code du cours est manquant ou vide.");
      return NextResponse.json(
        { error: "Le code du cours est requis." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    const [cours] = await conn.query(
      `
      SELECT * FROM cours WHERE id = ?
        `,
      [coursId]
    );

    if (!Array.isArray(cours) || cours.length === 0) {
      conn.release();
      return NextResponse.json(
        { error: "Aucun cours trouvé avec cet id." },
        { status: 404 }
      );
    }

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

    try {
      await conn.query(
        `
        UPDATE cours SET nom_cours = ?, code_cours = ?
        WHERE id = ?
        `,
        [name, code, coursId]
      );
      conn.release();

      return NextResponse.json(
        { success: true, message: "Cours modifié avec succès." },
        { status: 200 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de la modification :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de la modification du cours :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}