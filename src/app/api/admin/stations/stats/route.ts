import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { stations, reservation } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const [activeRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stations)
      .where(eq(stations.isActive, 1));

    const [inactiveRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stations)
      .where(eq(stations.isActive, 0));

    const [mostUsed] = await db
      .select({
        name: stations.name,
        reservationsCount: sql<number>`COUNT(${reservation.id})`,
      })
      .from(stations)
      .leftJoin(
        reservation,
        sql`${reservation.station} = ${stations.id} AND (${reservation.archived} IS NULL OR ${reservation.archived} = 0)`
      )
      .groupBy(stations.id, stations.name)
      .orderBy(sql`COUNT(${reservation.id}) DESC`)
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        totalActiveStations: activeRow?.count ?? null,
        totalInactiveStations: inactiveRow?.count ?? null,
        mostUsedStationName: mostUsed?.name ?? null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
