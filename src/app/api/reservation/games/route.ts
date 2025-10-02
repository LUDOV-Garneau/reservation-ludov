import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    let query: string;
    let queryParams: any[];
    let countQuery: string;
    let countParams: any[];

    if (search) {
      // Requête avec recherche
      query = `
        SELECT 
          id,
          titre,
          author,
          picture,
          available,
          biblio_id
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
      
      // Requête pour compter le total avec recherche
      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE LOWER(titre) LIKE LOWER(?)
          AND available > 0
      `;
      countParams = [searchPattern];
    } else {
      // Requête sans recherche - tous les jeux disponibles
      query = `
        SELECT 
          id,
          titre,
          author,
          picture,
          available,
          biblio_id
        FROM games
        WHERE available > 0
        ORDER BY titre ASC
        LIMIT ? OFFSET ?
      `;
      queryParams = [limit, offset];
      
      // Requête pour compter le total sans recherche
      countQuery = `
        SELECT COUNT(*) as total
        FROM games
        WHERE available > 0
      `;
      countParams = [];
    }

    // Exécuter les requêtes en parallèle
    const [gamesResult, countResult]: any = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const games = gamesResult[0];
    const totalCount = countResult[0][0]?.total || 0;

    // Formater les données
    const formattedGames = games.map((game: any) => ({
      id: game.id,
      titre: game.titre || "Jeu sans nom",
      author: game.author || "",
      picture: game.picture || "/placeholder_games.jpg",
      available: Number(game.available) || 0,
      biblio_id: game.biblio_id
    }));

    // Calculer si il y a plus de pages
    const hasMore = (page * limit) < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      games: formattedGames,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      },
      hasMore // Pour compatibilité avec le frontend
    });

  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      { 
        success: false,
        message: "Erreur lors de la récupération des jeux",
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}