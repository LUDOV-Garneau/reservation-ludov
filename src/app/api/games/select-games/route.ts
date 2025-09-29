import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json();
    if (!gameId) {
      return NextResponse.json(
        { message: "ID de jeu manquant" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      "UPDATE games SET available = 0 WHERE id = ? AND available = 1",
      [gameId]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { message: "Jeu non disponible" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Jeu sélectionné avec succès" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
