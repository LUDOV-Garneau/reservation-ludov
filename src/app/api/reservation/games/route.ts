import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface GameRow extends RowDataPacket {
  id: number;
  titre: string;
  author: string | null;
  picture: string | null;
  available: number;
  biblio_id: number | null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    let query: string;
    let queryParams: (string | number)[];
    let countQuery: string;
    let countParams: (string | number)[];

    if (search) {
      query = `
        SELECT DISTINCT
          id, titre, author, picture, available, biblio_id
        FROM games
        WHERE LOWER(titre) LIKE LOWER(?)
          AND available > 0
        ORDER BY 
          CASE 
            WHEN LOWER(titre) LIKE LOWER(?) THEN 1
            WHEN LOWER(titre) LIKE LOWER(?) THEN 2
            ELSE 3
          END,
          titre ASC
        LIMIT ? OFFSET ?
      `;
      const searchPattern = `%${search}%`;
      const exactPattern = `${search}%`;
      queryParams = [searchPattern, exactPattern, searchPattern, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE LOWER(titre) LIKE LOWER(?)
          AND available > 0
      `;
      countParams = [searchPattern];
    } else {
      query = `
        SELECT DISTINCT
          id, titre, author, picture, available, biblio_id
        FROM games
        WHERE available > 0
        ORDER BY titre ASC
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE available > 0
      `;
      countParams = [];
    }

    const [gamesRows] = await pool.query<GameRow[]>(query, queryParams);
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);

    const totalCount = (countRows[0] as { total: number })?.total || 0;

    const formattedGames = gamesRows.map((game) => ({
      id: game.id,
      titre: game.titre || "Jeu sans nom",
      author: game.author || "",
      picture: game.picture || "/placeholder_games.jpg",
      available: Number(game.available) || 0,
      biblio_id: game.biblio_id,
    }));

    const hasMore = page * limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      games: formattedGames,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
      },
      hasMore, // 👈 champ racine requis par ton lazy loader
    });
  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des jeux",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
