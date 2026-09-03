import { NextResponse } from "next/server";
import db from "@/db";
import { games } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search") || "";
    const consoleId = parseInt(searchParams.get("consoleId") || "0", 10);
    const offset = (page - 1) * limit;

    if (consoleId === 0) {
      return NextResponse.json({
        success: true,
        games: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
        hasMore: false,
      });
    }

    let gamesRows: { id: number; titre: string; author: string | null; picture: string | null; platform: string | null; biblioId: number }[];
    let totalCount: number;

    if (search) {
      const searchPattern = `%${search}%`;
      const exactPattern = `${search}%`;

      gamesRows = await db
        .selectDistinct({
          id: games.id,
          titre: games.titre,
          author: games.author,
          picture: games.picture,
          platform: games.platform,
          biblioId: games.biblioId,
        })
        .from(games)
        .where(and(
          sql`LOWER(${games.titre}) LIKE LOWER(${searchPattern})`,
          eq(games.consoleTypeId, consoleId),
          eq(games.holding, 0), eq(games.isActive, 1),
        ))
        .orderBy(
          sql`CASE WHEN LOWER(${games.titre}) LIKE LOWER(${exactPattern}) THEN 1 WHEN LOWER(${games.titre}) LIKE LOWER(${searchPattern}) THEN 2 ELSE 3 END`,
          asc(games.titre),
        )
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(games)
        .where(and(
          sql`LOWER(${games.titre}) LIKE LOWER(${searchPattern})`,
          eq(games.consoleTypeId, consoleId),
          eq(games.holding, 0), eq(games.isActive, 1)
        ));
      totalCount = countRow.total;
    } else {
      gamesRows = await db
        .select({
          id: games.id,
          titre: games.titre,
          author: games.author,
          picture: games.picture,
          platform: games.platform,
          biblioId: games.biblioId,
        })
        .from(games)
        .where(and(eq(games.consoleTypeId, consoleId), eq(games.holding, 0), eq(games.isActive, 1)))
        .orderBy(asc(games.titre))
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(games)
        .where(and(eq(games.consoleTypeId, consoleId), eq(games.holding, 0), eq(games.isActive, 1)));
      totalCount = countRow.total;
    }

    const formattedGames = gamesRows.map((game) => ({
      id: game.id,
      titre: game.titre || "Jeu sans nom",
      author: game.author || "",
      picture: game.picture,
      available: 0,
      biblio_id: game.biblioId,
      platform: game.platform || "Unknown",
    }));

    const hasMore = page * limit < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      games: formattedGames,
      pagination: { page, limit, total: totalCount, totalPages, hasMore },
      hasMore,
    });
  } catch (err) {
    console.error("Erreur SQL:", err);
    return NextResponse.json({
      success: false,
      message: "Erreur lors de la récupération des jeux",
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
});
