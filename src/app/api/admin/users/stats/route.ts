import db from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { users, reservation } from "@/db/schema";
import { withAdmin } from "@/lib/withAuth";

export const GET = withAdmin(async () => {
  try {
    // Une seule requête : agrégats conditionnels + sous-requête scalaire.
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        totalNotBoarded: sql<number>`SUM(CASE WHEN ${users.password} IS NULL THEN 1 ELSE 0 END)`,
        totalWithReservation: sql<number>`(SELECT COUNT(DISTINCT ${reservation.userId}) FROM ${reservation})`,
      })
      .from(users);

    return NextResponse.json({
      success: true,
      totalUser: Number(stats.total ?? 0),
      totalUserNotBoarded: Number(stats.totalNotBoarded ?? 0),
      totalUserWithReservation: Number(stats.totalWithReservation ?? 0),
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
});
