import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import db from "@/db";
import { accessoires, reservationHold } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const hold = await db.query.reservationHold.findFirst({
      columns: { consoleTypeId: true },
      where: eq(reservationHold.userId, userId),
      orderBy: (rh, { desc }) => [desc(rh.createdAt)],
    });

    const consoleTypeId = Number(hold?.consoleTypeId);
    if (!Number.isFinite(consoleTypeId)) {
      return NextResponse.json({ success: false, data: [], message: "No recent reservation hold found for user" }, { status: 404 });
    }

    const data = await db.select({ id: accessoires.id, name: accessoires.name })
      .from(accessoires)
      .where(and(
        isNotNull(accessoires.consoles),
        eq(accessoires.hidden, 0),
        sql`JSON_VALID(${accessoires.consoles})`,
        sql`JSON_CONTAINS(${accessoires.consoles}, CAST(${consoleTypeId} AS JSON), '$')`,
      ));

    if (data.length === 0) {
      return NextResponse.json({ success: false, data: [], message: "No accessories found for the user's console" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ success: false, data: [], message: "Internal server error" }, { status: 500 });
  }
}
