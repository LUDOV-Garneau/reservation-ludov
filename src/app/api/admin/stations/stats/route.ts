import { NextResponse } from "next/server";
import db from "@/db";
import { stations, reservation } from "@/db/schema";
import { sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

export const GET = withAdmin(async () => {
  try {
    // Compteurs actifs/inactifs en une seule requête.
    const [counts] = await db
      .select({
        active: sql<number>`SUM(CASE WHEN ${stations.isActive} = 1 THEN 1 ELSE 0 END)`,
        inactive: sql<number>`SUM(CASE WHEN ${stations.isActive} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(stations);

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
        totalActiveStations: Number(counts?.active ?? 0),
        totalInactiveStations: Number(counts?.inactive ?? 0),
        // Le LEFT JOIN garde les stations sans réservation : sans ce garde-fou,
        // la première station (COUNT = 0) serait présentée comme « la plus
        // réservée » alors qu'aucune réservation n'existe.
        mostUsedStationName:
          mostUsed && Number(mostUsed.reservationsCount) > 0
            ? mostUsed.name
            : null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
});
