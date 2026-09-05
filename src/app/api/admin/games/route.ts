import { NextResponse } from "next/server";
import db from "@/db";
import { consoleType, games, stations } from "@/db/schema";
import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { parseIds } from "@/lib/parseIds";

const MAX_PAGE_SIZE = 100;

/** Identifiant positif, ou null si le paramètre est absent ou non numérique. */
function parseId(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Types de console rattachés à une station. `stations.consoles` est un JSON
 * contenant des ids de console_type (voir /api/admin/stations). Un tableau
 * vide est une réponse valide : la station n'a aucune console, donc aucun jeu.
 */
async function consoleTypeIdsForStation(stationId: number): Promise<number[]> {
  const station = await db.query.stations.findFirst({
    columns: { consoles: true },
    where: eq(stations.id, stationId),
  });
  // Même lecture que partout ailleurs. La colonne vient de notre propre
  // écriture, désormais validée, mais rien ne garantit les lignes antérieures.
  return parseIds(station?.consoles);
}

/**
 * Liste admin de TOUS les jeux (contrairement à /api/reservation/games qui est
 * limitée à une console), avec recherche par titre, filtres (image, type de
 * console, station) et pagination serveur.
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)),
    );
    const search = (searchParams.get("search") || "").trim();
    const hasImage = searchParams.get("hasImage") || "all"; // all | yes | no
    const consoleTypeId = parseId(searchParams.get("consoleTypeId"));
    const stationId = parseId(searchParams.get("stationId"));
    const offset = (page - 1) * pageSize;

    // Filtre station : résolu en ids de types de console. Une station sans
    // console ne doit renvoyer aucun jeu — surtout pas le catalogue entier,
    // ce que produirait un inArray sur un tableau vide.
    let stationConsoleTypeIds: number[] | null = null;
    if (stationId !== null) {
      stationConsoleTypeIds = await consoleTypeIdsForStation(stationId);
      if (stationConsoleTypeIds.length === 0) {
        return NextResponse.json({
          success: true,
          games: [],
          total: 0,
          page,
          pageSize,
        });
      }
    }

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
    if (consoleTypeId !== null) {
      conditions.push(eq(games.consoleTypeId, consoleTypeId));
    }
    if (stationConsoleTypeIds !== null) {
      conditions.push(inArray(games.consoleTypeId, stationConsoleTypeIds));
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
          consoleTypeId: games.consoleTypeId,
          // Nom réel du type de console ; `platform` est du texte libre hérité
          // et sert de repli quand le jeu n'est rattaché à aucun type.
          consoleName: consoleType.name,
        })
        .from(games)
        .leftJoin(consoleType, eq(games.consoleTypeId, consoleType.id))
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
