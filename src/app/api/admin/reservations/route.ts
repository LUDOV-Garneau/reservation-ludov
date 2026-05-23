import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservation, consoleStock, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: reservation.id,
        consoleId: reservation.consoleId,
        consoleName: consoleStock.name,
        date: reservation.date,
        time: reservation.time,
        userId: reservation.userId,
        archived: reservation.archived,
        prenom: users.firstname,
        nom: users.lastname,
      })
      .from(reservation)
      .leftJoin(consoleStock, eq(reservation.consoleId, consoleStock.id))
      .leftJoin(users, eq(reservation.userId, users.id))
      .orderBy(desc(reservation.date), desc(reservation.time))
      .limit(limit)
      .offset(offset);

    const reservations = rows.map((row) => {
      const formattedDate = String(row.date).split("T")[0];
      const formattedTime = typeof row.time === "string" ? row.time.slice(0, 5) : "";
      return {
        id: String(row.id),
        console: row.consoleName ?? "",
        date: formattedDate,
        heure: formattedTime,
        userNom: `${row.prenom} ${row.nom}`,
        archived: Boolean(row.archived),
      };
    });

    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        future: sql<number>`SUM(CASE WHEN ${reservation.date} > CURDATE() OR (${reservation.date} = CURDATE() AND ${reservation.time} >= CURTIME()) THEN 1 ELSE 0 END)`,
        past: sql<number>`SUM(CASE WHEN ${reservation.date} < CURDATE() OR (${reservation.date} = CURDATE() AND ${reservation.time} < CURTIME()) THEN 1 ELSE 0 END)`,
      })
      .from(reservation);

    return NextResponse.json({
      rows: reservations,
      total: stats.total,
      totalReservations: stats.total,
      futureReservations: stats.future,
      pastReservations: stats.past,
    });
  } catch (err) {
    console.error("Erreur lors de la récupération des réservations :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
