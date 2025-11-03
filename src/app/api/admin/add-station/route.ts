import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

// IMPORTANT: + Dans l'ajout, avoir une colonne dans la bd pour name ?
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
    const body = await req.json();
    const { name, console } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Le champ nom est requis." },
        { status: 400 }
      );
    }

    if (!console) {
      return NextResponse.json(
        { error: "Le champ console est requis." },
        { status: 400 }
      );
    }

    const now = new Date();

    const conn = await pool.getConnection();
    try {
      await conn.query(
        `
        INSERT INTO stations (name, consoles, lastUpdatedAt, createdAt)
        VALUES (?, ?, ?, ?)
        `,
        [name, console, now, now]
      );

      conn.release();

      return NextResponse.json(
        { success: true, message: "Station ajoutée avec succès." },
        { status: 201 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de l'insertion :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
