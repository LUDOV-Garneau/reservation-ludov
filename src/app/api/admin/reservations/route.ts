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
import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { withAdmin } from "@/lib/withAuth";
import { toLocalYmd } from "@/lib/dates";

/** Tailles de page acceptées (le sélecteur de l'interface propose les mêmes). */
const RESERVATIONS_PAGE_SIZES = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const requestedLimit = parseInt(searchParams.get("limit") || "", 10);
    const limit = (RESERVATIONS_PAGE_SIZES as readonly number[]).includes(requestedLimit)
      ? requestedLimit
      : DEFAULT_PAGE_SIZE;
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    const g1 = alias(games, "g1");
    const g2 = alias(games, "g2");
    const g3 = alias(games, "g3");

    // Recherche côté serveur (usager, plateforme, station, sigle de cours,
    // jeu, id, date) : elle couvre toutes les pages, pas seulement la page
    // affichée.
    const searchPattern = `%${search}%`;
    const searchClause = search
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

    // "Maintenant" fourni par l'application (fuseau applicatif), plutôt que
    // CURDATE()/CURTIME() qui dépendent du fuseau du serveur MySQL.
    const now = new Date();
    const today = toLocalYmd(now);
    const nowTime = now.toTimeString().slice(0, 8);

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
        .where(searchClause)
        .orderBy(desc(reservation.date), desc(reservation.time))
        .limit(limit)
        .offset(offset),
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
        .where(searchClause),
      // Statistiques globales (une requête, annulées exclues des futur/passé).
      db
        .select({
          total: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 THEN 1 ELSE 0 END)`,
          future: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 AND (${reservation.date} > ${today} OR (${reservation.date} = ${today} AND ${reservation.time} >= ${nowTime})) THEN 1 ELSE 0 END)`,
          past: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 AND (${reservation.date} < ${today} OR (${reservation.date} = ${today} AND ${reservation.time} < ${nowTime})) THEN 1 ELSE 0 END)`,
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
      page,
      limit,
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
