// app/api/reservation/games/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface GameRow extends RowDataPacket {
  id: number;
  titre: string;
  picture: string | null;
  available: number;
  biblio_id?: number;
  author?: string;
}

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: false, message: "ids param is required" },
        { status: 400 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid game IDs provided" },
        { status: 400 }
      );
    }

    // On récupère les jeux de la BD
    const [rows] = await pool.query<GameRow[]>(
      `SELECT id, titre, picture, available, biblio_id, author
       FROM games
       WHERE id IN (?)`,
      [ids]
    );

    return NextResponse.json(
      rows.map((g) => ({
        id: g.id,
        titre: g.titre,
        picture: g.picture || "/placeholder_games.jpg",
        available: g.available,
        biblio_id: g.biblio_id,
        author: g.author,
      })),
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur API game details:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
