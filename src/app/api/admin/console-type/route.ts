import { NextResponse } from "next/server";
import db from "@/db";
import { consoleStock, games, stations } from "@/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

/**
 * Liste des plateformes (`console_type`).
 *
 * La forme du corps — un tableau de `{id, name, picture}` — est celle
 * qu'attendent les formulaires de station et les filtres de l'onglet Jeux.
 * Les agrégats de l'onglet Plateformes ne sont calculés que sur `?stats=1`,
 * pour que ces trois appelants ne paient pas les jointures.
 */
export const GET = withAdmin(async (req) => {
  try {
    const withStats = new URL(req.url).searchParams.get("stats") === "1";

    const rows = await db.query.consoleType.findMany({
      columns: { id: true, name: true, picture: true, description: withStats },
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    if (!withStats) return NextResponse.json(rows, { status: 200 });

    const [stockRows, gameRows, activeStations] = await Promise.all([
      db
        .select({
          consoleTypeId: consoleStock.consoleTypeId,
          total: sql<number>`COUNT(*)`,
          // Mêmes critères que le parcours de réservation : un exemplaire
          // désactivé ou sorti du LUDOV n'est pas réservable.
          active: sql<number>`SUM(${consoleStock.isActive} = 1 AND ${consoleStock.holding} = 0)`,
        })
        .from(consoleStock)
        .groupBy(consoleStock.consoleTypeId),
      db
        .select({
          consoleTypeId: games.consoleTypeId,
          total: sql<number>`COUNT(*)`,
        })
        .from(games)
        .where(isNotNull(games.consoleTypeId))
        .groupBy(games.consoleTypeId),
      // `stations.consoles` est une colonne JSON : le compte se fait en
      // mémoire, sur quelques dizaines de lignes, plutôt qu'avec un
      // JSON_CONTAINS par plateforme.
      db
        .select({ consoles: stations.consoles })
        .from(stations)
        .where(eq(stations.isActive, 1)),
    ]);

    const units = new Map(
      stockRows.map((row) => [
        row.consoleTypeId,
        { total: Number(row.total), active: Number(row.active) },
      ]),
    );
    const gameCounts = new Map(
      gameRows.map((row) => [row.consoleTypeId, Number(row.total)]),
    );

    const stationCounts = new Map<number, number>();
    for (const station of activeStations) {
      const consoles = Array.isArray(station.consoles) ? station.consoles : [];
      // Une station listée deux fois sur la même plateforme ne doit la compter
      // qu'une fois.
      for (const id of new Set(consoles.map(Number))) {
        if (!Number.isInteger(id)) continue;
        stationCounts.set(id, (stationCounts.get(id) ?? 0) + 1);
      }
    }

    const platforms = rows.map((row) => ({
      ...row,
      unitsTotal: units.get(row.id)?.total ?? 0,
      unitsActive: units.get(row.id)?.active ?? 0,
      gamesCount: gameCounts.get(row.id) ?? 0,
      stationsCount: stationCounts.get(row.id) ?? 0,
    }));

    return NextResponse.json(platforms, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du fetch consoleType :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
});
