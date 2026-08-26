import { NextResponse } from "next/server";
import db from "@/db";
import { games } from "@/db/schema";
import { and, asc, isNotNull, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

/**
 * Liste admin de TOUS les jeux (contrairement à /api/reservation/games qui est
 * limitée à une console), avec recherche par titre, filtre avec/sans image et
 * pagination serveur.
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)),
    );
    const search = (searchParams.get("search") || "").trim();
    const hasImage = searchParams.get("hasImage") || "all"; // all | yes | no
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(
        sql`LOWER(${games.titre}) LIKE LOWER(${`%${search}%`})`,
      );
    }
    if (hasImage === "yes") {
      conditions.push(and(isNotNull(games.picture), sql`${games.picture} != ''`));
    } else if (hasImage === "no") {
      conditions.push(sql`(${games.picture} IS NULL OR ${games.picture} = '')`);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: games.id,
          titre: games.titre,
          author: games.author,
          platform: games.platform,
          picture: games.picture,
          biblioId: games.biblioId,
        })
        .from(games)
        .where(whereClause)
        .orderBy(asc(games.titre))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(games)
        .where(whereClause),
    ]);

    return NextResponse.json({
      success: true,
      games: rows,
      total: countRow.total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Erreur liste jeux admin:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des jeux." },
      { status: 500 },
    );
  }
});
