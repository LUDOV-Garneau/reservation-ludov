import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { reservation, consoleType, games, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const admin = verifyToken(token);
    if (!admin?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { userId: userIdParam } = await params;
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
      })
      .from(reservation)
      .innerJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
      .leftJoin(g1, eq(reservation.game1Id, g1.id))
      .leftJoin(g2, eq(reservation.game2Id, g2.id))
      .leftJoin(g3, eq(reservation.game3Id, g3.id))
      .where(eq(reservation.userId, userId))
      .orderBy(sql`TIMESTAMP(${reservation.date}, ${reservation.time}) DESC`);

    const formattedReservations = rows.map((row) => {
      const gamesArr = [row.game1Title, row.game2Title, row.game3Title].filter(Boolean) as string[];
      const dateStr = String(row.date).split("T")[0];
      return {
        id: String(row.id),
        games: gamesArr,
        console: row.consoleName,
        date: dateStr,
        heure: row.time ?? "",
        archived: row.archived === 1,
      };
    });

    return NextResponse.json({ success: true, reservations: formattedReservations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
