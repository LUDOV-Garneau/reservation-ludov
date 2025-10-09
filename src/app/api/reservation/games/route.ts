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
  platform: string | null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search") || "";
    const consoleId = parseInt(searchParams.get("consoleId") || "0", 10);

    console.log("Fetching games with params:", { page, limit, search, consoleId });

    const offset = (page - 1) * limit;

    let query: string;
    let queryParams: (string | number)[];
    let countQuery: string;
    let countParams: (string | number)[];

    if (consoleId === 0) {
      return NextResponse.json({
        success: true,
        games: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        hasMore: false,
      });
    }

    if (search) {
      query = `
        SELECT DISTINCT
          id, titre, author, picture, platform, available, biblio_id
        FROM games
        WHERE LOWER(titre) LIKE LOWER(?)
          AND available > 0 
          AND console_koha_id = ?
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
      queryParams = [searchPattern, consoleId, exactPattern, searchPattern, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE LOWER(titre) LIKE LOWER(?)
          AND available > 0
          AND console_koha_id = ?
      `;
      countParams = [searchPattern, consoleId];
    } else {
      query = `
        SELECT DISTINCT
          id, titre, author, picture, platform, available, biblio_id
        FROM games
        WHERE available > 0 AND console_koha_id = ?
        ORDER BY titre ASC
        LIMIT ? OFFSET ?
      `;
      queryParams = [consoleId, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE available > 0 AND console_koha_id = ?
      `;
      countParams = [consoleId];
    }

    const [gamesRows] = await pool.query<GameRow[]>(query, queryParams);
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);

    const totalCount = (countRows[0] as { total: number })?.total || 0;

    const formattedGames = gamesRows.map((game) => ({
      id: game.id,
      titre: game.titre || "Jeu sans nom",
      author: game.author || "",
      picture: game.picture,
      available: Number(game.available) || 0,
      biblio_id: game.biblio_id,
      platform: game.platform || "Unknown",
    }));

    const hasMore = page * limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    console.log("Query result:", { 
      totalCount, 
      gamesReturned: formattedGames.length, 
      hasMore,
      page 
    });

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
      hasMore,
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