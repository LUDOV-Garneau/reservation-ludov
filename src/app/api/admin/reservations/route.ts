import { NextResponse } from "next/server";
import db from "@/db";
import { reservation, consoleStock, users } from "@/db/schema";
import { desc, eq, or, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { toLocalYmd } from "@/lib/dates";

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    // Recherche côté serveur (nom d'utilisateur, plateforme, id, date) :
    // la recherche couvre toutes les pages, pas seulement la page affichée.
    const searchPattern = `%${search}%`;
    const searchClause = search
      ? or(
          sql`LOWER(CONCAT(${users.firstname}, ' ', ${users.lastname})) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${consoleStock.name}) LIKE LOWER(${searchPattern})`,
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
          consoleId: reservation.consoleId,
          consoleName: consoleStock.name,
          date: sql<string>`DATE_FORMAT(${reservation.date}, '%Y-%m-%d')`,
          time: sql<string>`TIME_FORMAT(${reservation.time}, '%H:%i')`,
          userId: reservation.userId,
          archived: reservation.archived,
          prenom: users.firstname,
          nom: users.lastname,
        })
        .from(reservation)
        .leftJoin(consoleStock, eq(reservation.consoleId, consoleStock.id))
        .leftJoin(users, eq(reservation.userId, users.id))
        .where(searchClause)
        .orderBy(desc(reservation.date), desc(reservation.time))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(reservation)
        .leftJoin(consoleStock, eq(reservation.consoleId, consoleStock.id))
        .leftJoin(users, eq(reservation.userId, users.id))
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

    const reservations = rows.map((row) => {
      return {
        id: String(row.id),
        console: row.consoleName ?? "",
        date: row.date ?? "",
        heure: row.time ?? "",
        userNom: `${row.prenom} ${row.nom}`,
        archived: Boolean(row.archived),
      };
    });

    return NextResponse.json({
      rows: reservations,
      total: Number(filteredCount.total ?? 0),
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
