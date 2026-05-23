import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import db from "@/db";
import { reservationHold } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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

    const rows = await db.execute<{ id: number; name: string }>(
      sql`SELECT id, name FROM accessoires WHERE consoles IS NOT NULL AND hidden = 0 AND JSON_VALID(consoles) AND JSON_CONTAINS(consoles, CAST(${consoleTypeId} AS JSON), '$')`
    );

    const accessories = rows as { id: number; name: string }[];

    if (accessories.length === 0) {
      return NextResponse.json({ success: false, data: [], message: "No accessories found for the user's console" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: accessories });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ success: false, data: [], message: "Internal server error" }, { status: 500 });
  }
}
