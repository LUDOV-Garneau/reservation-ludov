import db from "@/db";
import { consoleType, stations } from "@/db/schema";
import { and, inArray, sql } from "drizzle-orm";

/**
 * Accès base partagés par `POST /api/admin/stations` et
 * `PATCH|DELETE /api/admin/stations/[id]`.
 *
 * Ils vivent ici et non dans les routes : un fichier `route.ts` ne doit
 * exporter que ses handlers HTTP.
 */

/** Unicité du nom, insensible à la casse. `exceptId` sert à la modification. */
export async function findStationByName(name: string, exceptId?: number) {
  return db.query.stations.findFirst({
    columns: { id: true },
    where: (t) =>
      and(
        sql`LOWER(${t.name}) = LOWER(${name})`,
        exceptId === undefined ? undefined : sql`${t.id} <> ${exceptId}`,
      ),
  });
}

/**
 * Identifiants qui ne correspondent à aucune plateforme. Sans ce contrôle, une
 * station peut référencer un `console_type` supprimé et n'afficher qu'un trou
 * dans le parcours de réservation.
 */
export async function findUnknownConsoleIds(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];

  const found = await db
    .select({ id: consoleType.id })
    .from(consoleType)
    .where(inArray(consoleType.id, ids));

  const known = new Set(found.map((row) => row.id));
  return ids.filter((id) => !known.has(id));
}

/** Résout les identifiants de plateformes en noms, en une requête pour toute la page. */
export async function withConsoleNames(
  rows: (typeof stations.$inferSelect)[],
) {
  const allIds = [
    ...new Set(
      rows.flatMap((station) =>
        Array.isArray(station.consoles) ? (station.consoles as number[]) : [],
      ),
    ),
  ];

  const nameById = new Map<number, string>();
  if (allIds.length > 0) {
    const consoleRows = await db
      .select({ id: consoleType.id, name: consoleType.name })
      .from(consoleType)
      .where(inArray(consoleType.id, allIds));
    consoleRows.forEach((row) => nameById.set(row.id, row.name));
  }

  return rows.map((station) => {
    const consolesId = Array.isArray(station.consoles)
      ? (station.consoles as number[])
      : [];
    return {
      ...station,
      consoles: consolesId.map((id) => nameById.get(id) ?? "").filter(Boolean),
      consolesId,
      isActive: Boolean(station.isActive),
    };
  });
}

/** Identifiants des plateformes dont le nom contient `search`. */
export async function findConsoleIdsByName(search: string): Promise<number[]> {
  const rows = await db
    .select({ id: consoleType.id })
    .from(consoleType)
    .where(sql`LOWER(${consoleType.name}) LIKE LOWER(${`%${search}%`})`);

  return rows.map((row) => row.id);
}
