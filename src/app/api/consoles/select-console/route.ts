import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { consoleId } = await request.json();
    if (!consoleId) {
      return NextResponse.json(
        { message: "ID de console manquant" },
        { status: 400 }
      );
    }
    const [result] = await pool.query(
      "UPDATE consoles SET available = 0 WHERE id = ? AND available = 0",
      [consoleId]
    );
    const updateResult = result as { affectedRows: number };
    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { message: "Console non disponible" },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Console sélectionnée avec succès" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
