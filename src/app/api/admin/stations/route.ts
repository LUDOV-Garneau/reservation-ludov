import { NextResponse } from "next/server";
import db from "@/db";
import { stations } from "@/db/schema";
import { and, asc, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { toLocalDatetime } from "@/lib/dates";
import { parseStationsQuery, type StationsQuery } from "@/lib/stationsQuery";
import {
  readStationPayload,
  STATION_PAYLOAD_MESSAGES,
} from "@/lib/stationUpdate";
import {
  findConsoleIdsByName,
  findStationByName,
  findUnknownConsoleIds,
  withConsoleNames,
} from "@/lib/stationsDb";

/**
 * Liste des stations de l'admin.
 *
 * Recherche, filtre de statut, tri et pagination sont appliqués ici : un filtre
 * porte sur toute la table et non sur la page affichée.
 *
 * La forme du corps (`data.stations`, `data.total`) est celle d'avant, pour que
 * GamesImagesManager — seul autre appelant — n'ait rien à réapprendre au-delà
 * du paramètre `all`.
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = parseStationsQuery(searchParams);

    const whereClause = await buildWhereClause(query);

    const listQuery = db
      .select()
      .from(stations)
      .where(whereClause)
      .orderBy(...buildOrderBy(query))
      .$dynamic();

    const rows = await (query.all
      ? listQuery
      : listQuery.limit(query.limit).offset(query.offset));

    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(stations)
      .where(whereClause);

    return NextResponse.json(
      {
        success: true,
        message: "Stations récupérées avec succès",
        data: { stations: await withConsoleNames(rows), total: Number(total) },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Erreur lors de la récupération des stations :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 },
    );
  }
});

/** Création d'une station. Elle naît active : la colonne a 1 pour défaut. */
export const POST = withAdmin(async (req) => {
  try {
    const parsed = readStationPayload(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: STATION_PAYLOAD_MESSAGES[parsed.error] },
        { status: 400 },
      );
    }

    const { name, consoles } = parsed.value;

    if (await findStationByName(name)) {
      return NextResponse.json(
        { success: false, error: "Une station avec ce nom existe déjà." },
        { status: 409 },
      );
    }

    const unknown = await findUnknownConsoleIds(consoles);
    if (unknown.length > 0) {
      return NextResponse.json(
        { success: false, error: `Plateforme inconnue : ${unknown.join(", ")}.` },
        { status: 400 },
      );
    }

    // Heure locale : la colonne est relue en heure locale partout ailleurs.
    const now = toLocalDatetime();
    await db
      .insert(stations)
      .values({ name, consoles, createdAt: now, lastUpdatedAt: now });

    return NextResponse.json(
      { success: true, message: "Station ajoutée avec succès." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 },
    );
  }
});

/**
 * `consoles` est une colonne `json` d'identifiants : chercher « PlayStation »
 * suppose de traduire d'abord le mot en identifiants de plateformes, puis de
 * demander à MySQL si le tableau en contient un — d'où `JSON_OVERLAPS`.
 */
async function buildWhereClause(query: StationsQuery): Promise<SQL | undefined> {
  const statusClause =
    query.status === "active"
      ? eq(stations.isActive, 1)
      : query.status === "inactive"
        ? eq(stations.isActive, 0)
        : undefined;

  if (query.search === "") return statusClause;

  const consoleIds = await findConsoleIdsByName(query.search);
  const pattern = `%${query.search}%`;

  return and(
    statusClause,
    or(
      sql`LOWER(${stations.name}) LIKE LOWER(${pattern})`,
      consoleIds.length > 0
        ? sql`JSON_OVERLAPS(${stations.consoles}, CAST(${JSON.stringify(consoleIds)} AS JSON))`
        : undefined,
    ),
  );
}

function buildOrderBy(query: StationsQuery): SQL[] {
  const direction = query.dir === "asc" ? asc : desc;

  const key = {
    name: sql`COALESCE(${stations.name}, '')`,
    created: sql`${stations.createdAt}`,
    // Une station se juge d'abord au nombre de plateformes qu'elle propose.
    platforms: sql`JSON_LENGTH(${stations.consoles})`,
    status: sql`${stations.isActive}`,
  }[query.sort];

  // `id` en départage : sans lui, deux stations homonymes peuvent changer de
  // place d'une page à l'autre et l'une des deux ne s'afficher jamais.
  return [direction(key), asc(stations.id)];
}
