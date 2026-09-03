import { NextResponse } from "next/server";
import db from "@/db";
import { consoleStock, consoleType, stations } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { withAuth } from "@/lib/withAuth";

export interface ConsoleCatalogItem {
  id: number;
  name: string;
  picture: string;
  active_units: number;
  total_units: number;
}

/**
 * Plateformes proposées à l'étape 1 du parcours.
 *
 * Une plateforme n'est réservable que si une station ACTIVE la prend en
 * charge : sans station, le parcours laisse choisir jeux et accessoires puis
 * n'offre aucun créneau. (La vue `console_catalog` ignore l'état des stations,
 * d'où la requête directe.)
 */
export const GET = withAuth(async () => {
  try {
    const consoles = await db
      .select({
        id: consoleType.id,
        name: consoleType.name,
        picture: consoleType.picture,
        active_units: sql<number>`SUM(CASE WHEN ${consoleStock.isActive} = 1 AND ${consoleStock.holding} = 0 THEN 1 ELSE 0 END)`,
        total_units: sql<number>`COUNT(${consoleStock.id})`,
      })
      .from(consoleType)
      .leftJoin(consoleStock, eq(consoleStock.consoleTypeId, consoleType.id))
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${stations} s
          WHERE s.isActive = 1
            AND JSON_CONTAINS(s.consoles, CAST(${consoleType.id} AS JSON), '$')
        )`,
      )
      .groupBy(consoleType.id, consoleType.name, consoleType.picture)
      .having(sql`SUM(CASE WHEN ${consoleStock.isActive} = 1 AND ${consoleStock.holding} = 0 THEN 1 ELSE 0 END) > 0`)
      .orderBy(asc(consoleType.name));

    return NextResponse.json(
      consoles.map((c) => ({
        ...c,
        active_units: Number(c.active_units ?? 0),
        total_units: Number(c.total_units ?? 0),
      })),
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
