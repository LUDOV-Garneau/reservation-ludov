import { NextResponse } from "next/server";
import db from "@/db";
import {
  reservation,
  consoleType,
  games,
  users,
  accessoires,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { withAdmin } from "@/lib/withAuth";

export const GET = withAdmin<{ userId: string }>(async (_req, _admin, params) => {
  try {
    const userIdParam = params.userId;
    const userId = Number(userIdParam);
    if (!userIdParam || Number.isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Bad Request: Invalid userId" }, { status: 400 });
    }

    const userExists = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.id, userId),
    });

    if (!userExists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const g1 = alias(games, "g1");
    const g2 = alias(games, "g2");
    const g3 = alias(games, "g3");

    const rows = await db
      .select({
        id: reservation.id,
        date: sql<string>`DATE(${reservation.date})`,
        time: sql<string>`TIME_FORMAT(${reservation.time}, '%H:%i')`,
        consoleName: consoleType.name,
        game1Title: g1.titre,
        game2Title: g2.titre,
        game3Title: g3.titre,
        archived: reservation.archived,
        accessoryIds: reservation.accessoryIds,
      })
      .from(reservation)
      .innerJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
      .leftJoin(g1, eq(reservation.game1Id, g1.id))
      .leftJoin(g2, eq(reservation.game2Id, g2.id))
      .leftJoin(g3, eq(reservation.game3Id, g3.id))
      .where(eq(reservation.userId, userId))
      .orderBy(sql`TIMESTAMP(${reservation.date}, ${reservation.time}) DESC`);

    // Résolution des noms d'accessoires en une seule requête pour toutes les
    // réservations.
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
    const accessoryNameById = new Map(
      accessoryRows.map((a) => [a.id, a.name] as const),
    );

    const formattedReservations = rows.map((row) => {
      const gamesArr = [row.game1Title, row.game2Title, row.game3Title].filter(Boolean) as string[];
      const dateStr = String(row.date).split("T")[0];
      const accessoryIds = Array.isArray(row.accessoryIds)
        ? (row.accessoryIds as number[])
        : [];
      return {
        id: String(row.id),
        games: gamesArr,
        console: row.consoleName,
        date: dateStr,
        heure: row.time ?? "",
        archived: row.archived === 1,
        accessories: accessoryIds
          .map((id) => accessoryNameById.get(id))
          .filter((name): name is string => Boolean(name)),
      };
    });

    return NextResponse.json({ success: true, reservations: formattedReservations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});
