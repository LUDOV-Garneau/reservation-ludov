import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservation, consoleType, stations, games } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(user.id);
    const g1 = alias(games, "g1");
    const g2 = alias(games, "g2");
    const g3 = alias(games, "g3");

    const rows = await db
      .select({
        id: reservation.id,
        date: sql<string>`DATE(${reservation.date})`,
        station: reservation.station,
        time: reservation.time,
        consoleName: consoleType.name,
        game1Title: g1.titre,
        game2Title: g2.titre,
        game3Title: g3.titre,
        archived: reservation.archived,
        stationName: stations.name,
      })
      .from(reservation)
      .innerJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
      .leftJoin(stations, eq(reservation.station, stations.id))
      .leftJoin(g1, eq(reservation.game1Id, g1.id))
      .leftJoin(g2, eq(reservation.game2Id, g2.id))
      .leftJoin(g3, eq(reservation.game3Id, g3.id))
      .where(and(
        eq(reservation.userId, userId),
        or(
          sql`TIMESTAMP(${reservation.date}, ${reservation.time}) < NOW()`,
          eq(reservation.archived, 1)
        )
      ))
      .orderBy(sql`TIMESTAMP(${reservation.date}, ${reservation.time}) DESC`);

    if (!rows.length) return NextResponse.json([]);

    const reservations = rows.map((row) => {
      const gamesArr = [row.game1Title, row.game2Title, row.game3Title].filter(Boolean) as string[];
      const dateStr = String(row.date).split("T")[0];
      return {
        id: String(row.id),
        archived: Boolean(row.archived),
        games: gamesArr,
        station: row.stationName,
        console: row.consoleName,
        date: dateStr,
        heure: row.time.slice(0, 5),
      };
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching past reservations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
