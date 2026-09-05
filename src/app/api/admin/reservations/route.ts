import { NextResponse } from "next/server";
import db from "@/db";
import {
  reservation,
  consoleType,
  users,
  stations,
  games,
  cours,
  accessoires,
} from "@/db/schema";
import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { withAdmin } from "@/lib/withAuth";
import {
  parseReservationsQuery,
  splitLocalNow,
  type ReservationsQuery,
} from "@/lib/reservationsQuery";

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = parseReservationsQuery(searchParams);

    const g1 = alias(games, "g1");
    const g2 = alias(games, "g2");
    const g3 = alias(games, "g3");

    // "Maintenant" fourni par l'application (fuseau applicatif), plutôt que
    // CURDATE()/CURTIME() qui dépendent du fuseau du serveur MySQL.
    const { today, nowTime } = splitLocalNow();

    // Instant du créneau et frontière passé/futur, réutilisés par le filtre de
    // statut, les tris et les statistiques.
    const slotAt = sql`TIMESTAMP(${reservation.date}, ${reservation.time})`;
    const nowAt = sql`TIMESTAMP(${today}, ${nowTime})`;
    const isPast = sql`(${slotAt} < ${nowAt})`;

    // Recherche côté serveur (usager, plateforme, station, sigle de cours,
    // jeu, id, date) : elle couvre toutes les pages, pas seulement la page
    // affichée.
    const searchPattern = `%${query.search}%`;
    const searchClause = query.search
      ? or(
          sql`LOWER(CONCAT(${users.firstname}, ' ', ${users.lastname})) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${consoleType.name}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${stations.name}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${cours.codeCours}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${g1.titre}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${g2.titre}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${g3.titre}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${reservation.id}) LIKE LOWER(${searchPattern})`,
          sql`DATE_FORMAT(${reservation.date}, '%Y-%m-%d') LIKE ${searchPattern}`,
        )
      : undefined;

    const statusClause = buildStatusClause(query.status, isPast);

    const whereClause = and(
      searchClause,
      query.from ? sql`${reservation.date} >= ${query.from}` : undefined,
      query.to ? sql`${reservation.date} <= ${query.to}` : undefined,
      statusClause,
      // Intervalle inversé : aucune ligne ne peut y tomber. On le dit à SQL
      // plutôt que de court-circuiter, pour garder un seul chemin de code.
      query.isEmptyRange ? sql`1 = 0` : undefined,
    );

    const orderBy = buildOrderBy(query, slotAt, isPast);

    const [rows, [filteredCount], [stats]] = await Promise.all([
      db
        .select({
          id: reservation.id,
          consoleName: consoleType.name,
          stationName: stations.name,
          coursCode: cours.codeCours,
          coursName: cours.nomCours,
          game1Title: g1.titre,
          game2Title: g2.titre,
          game3Title: g3.titre,
          accessoryIds: reservation.accessoryIds,
          date: sql<string>`DATE_FORMAT(${reservation.date}, '%Y-%m-%d')`,
          time: sql<string>`TIME_FORMAT(${reservation.time}, '%H:%i')`,
          userId: reservation.userId,
          archived: reservation.archived,
          prenom: users.firstname,
          nom: users.lastname,
        })
        .from(reservation)
        .leftJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
        .leftJoin(users, eq(reservation.userId, users.id))
        .leftJoin(stations, eq(reservation.station, stations.id))
        .leftJoin(cours, eq(reservation.coursId, cours.id))
        .leftJoin(g1, eq(reservation.game1Id, g1.id))
        .leftJoin(g2, eq(reservation.game2Id, g2.id))
        .leftJoin(g3, eq(reservation.game3Id, g3.id))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(query.limit)
        .offset(query.offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(reservation)
        .leftJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
        .leftJoin(users, eq(reservation.userId, users.id))
        .leftJoin(stations, eq(reservation.station, stations.id))
        .leftJoin(cours, eq(reservation.coursId, cours.id))
        .leftJoin(g1, eq(reservation.game1Id, g1.id))
        .leftJoin(g2, eq(reservation.game2Id, g2.id))
        .leftJoin(g3, eq(reservation.game3Id, g3.id))
        .where(whereClause),
      // Statistiques globales : elles ne suivent pas les filtres, c'est un
      // tableau de bord. Le décompte du filtre courant, lui, est `total`.
      db
        .select({
          total: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 THEN 1 ELSE 0 END)`,
          future: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 AND NOT ${isPast} THEN 1 ELSE 0 END)`,
          past: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 AND ${isPast} THEN 1 ELSE 0 END)`,
          cancelled: sql<number>`SUM(CASE WHEN ${reservation.archived} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(reservation),
    ]);

    // Noms d'accessoires résolus en une seule requête pour toute la page.
    const allAccessoryIds = [
      ...new Set(
        rows.flatMap((row) =>
          Array.isArray(row.accessoryIds) ? (row.accessoryIds as number[]) : [],
        ),
      ),
    ];
    const accessoryRows =
      allAccessoryIds.length > 0
        ? await db
            .select({ id: accessoires.id, name: accessoires.name })
            .from(accessoires)
            .where(inArray(accessoires.id, allAccessoryIds))
        : [];
    const accessoryNameById = new Map(accessoryRows.map((a) => [a.id, a.name]));

    const reservations = rows.map((row) => {
      const accessoryIds = Array.isArray(row.accessoryIds)
        ? (row.accessoryIds as number[])
        : [];
      return {
        id: String(row.id),
        console: row.consoleName ?? "",
        station: row.stationName ?? "",
        games: [row.game1Title, row.game2Title, row.game3Title].filter(
          (title): title is string => Boolean(title),
        ),
        accessories: accessoryIds
          .map((id) => accessoryNameById.get(id))
          .filter((name): name is string => Boolean(name)),
        coursCode: row.coursCode ?? "",
        coursName: row.coursName ?? "",
        date: row.date ?? "",
        heure: row.time ?? "",
        userNom: `${row.prenom ?? ""} ${row.nom ?? ""}`.trim(),
        archived: Boolean(row.archived),
      };
    });

    return NextResponse.json({
      rows: reservations,
      total: Number(filteredCount.total ?? 0),
      page: query.page,
      limit: query.limit,
      totalReservations: Number(stats.total ?? 0),
      futureReservations: Number(stats.future ?? 0),
      pastReservations: Number(stats.past ?? 0),
      cancelledReservations: Number(stats.cancelled ?? 0),
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});

/** « À venir » et « passée » excluent les annulées : une annulée n'est plus un créneau. */
function buildStatusClause(
  status: ReservationsQuery["status"],
  isPast: SQL,
): SQL | undefined {
  if (status === "cancelled") return sql`${reservation.archived} = 1`;
  // Parenthésé : `and()` juxtapose les clauses sans les grouper, et un futur
  // `or()` au même niveau capturerait la moitié de celle-ci.
  if (status === "upcoming")
    return sql`(${reservation.archived} = 0 AND NOT ${isPast})`;
  if (status === "past")
    return sql`(${reservation.archived} = 0 AND ${isPast})`;
  return undefined;
}

/**
 * Tri par défaut « schedule » : le prochain créneau en tête, puis les créneaux
 * écoulés du plus récent au plus ancien — l'ordre dans lequel l'équipe lit la
 * liste. Les autres clés retombent sur cet ordre comme départage.
 */
function buildOrderBy(
  query: ReservationsQuery,
  slotAt: SQL,
  isPast: SQL,
): SQL[] {
  const asc = query.dir === "asc";
  const dir = (ascending: boolean) =>
    ascending === asc ? sql`ASC` : sql`DESC`;

  const schedule: SQL[] = [
    sql`${isPast} ${dir(true)}`,
    sql`CASE WHEN NOT ${isPast} THEN ${slotAt} END ${dir(true)}`,
    sql`CASE WHEN ${isPast} THEN ${slotAt} END ${dir(false)}`,
  ];

  if (query.sort === "schedule") return schedule;

  const key: Record<Exclude<ReservationsQuery["sort"], "schedule">, SQL> = {
    user: sql`CONCAT(COALESCE(${users.firstname}, ''), ' ', COALESCE(${users.lastname}, ''))`,
    console: sql`COALESCE(${consoleType.name}, '')`,
    // Un rang plutôt que le libellé : l'ordre utile est à venir, puis passées,
    // puis annulées — pas l'ordre alphabétique des trois mots.
    status: sql`CASE WHEN ${reservation.archived} = 1 THEN 2 WHEN ${isPast} THEN 1 ELSE 0 END`,
  };

  // Les valeurs égales gardent l'ordre chronologique, sinon la pagination
  // remonterait deux fois la même ligne d'une page à l'autre.
  return [sql`${key[query.sort]} ${dir(true)}`, ...schedule];
}
