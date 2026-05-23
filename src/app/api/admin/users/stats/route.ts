import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { sql, isNull } from "drizzle-orm";
import { users, reservation } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(users);
    const [{ totalNotBoarded }] = await db.select({ totalNotBoarded: sql<number>`COUNT(*)` }).from(users).where(isNull(users.password));
    const [{ totalWithReservation }] = await db
      .select({ totalWithReservation: sql<number>`COUNT(DISTINCT ${users.id})` })
      .from(users)
      .innerJoin(reservation, sql`${users.id} = ${reservation.userId}`);

    return NextResponse.json({
      success: true,
      totalUser: total,
      totalUserNotBoarded: totalNotBoarded,
      totalUserWithReservation: totalWithReservation,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
