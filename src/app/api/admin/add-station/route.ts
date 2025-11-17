import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

interface StationRequestBody {
  name: string;
  consoles: number[];
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
    const body: StationRequestBody = await req.json();
    const { name, consoles } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Le champ nom est requis." }, { status: 400 });
    }

    if (!consoles || !Array.isArray(consoles) || consoles.length === 0) {
      return NextResponse.json({ error: "Le champ consoles est requis." }, { status: 400 });
    }

    const consolesJson = JSON.stringify(consoles);
    const now = new Date();

    const conn = await pool.getConnection();
    try {

      const [existingStation] = await conn.query(
        `SELECT id FROM stations WHERE LOWER(name) = LOWER(?)`,
      [name.trim()]
      );
      console.log("Existing station check result:", existingStation);
      if (Array.isArray(existingStation) && existingStation.length > 0) {
        conn.release();
        return NextResponse.json(
          { success: false, message: "Une station avec ce nom existe déjà." },
          { status: 409 }
        );
      }

      await conn.query(
        `
        INSERT INTO stations (name, consoles, lastUpdatedAt, createdAt)
        VALUES (?, ?, ?, ?)
        `,
        [name, consolesJson, now, now]
      );
      conn.release();

      return NextResponse.json(
        { success: true, message: "Station ajoutée avec succès." },
        { status: 201 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de l'insertion SQL :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}