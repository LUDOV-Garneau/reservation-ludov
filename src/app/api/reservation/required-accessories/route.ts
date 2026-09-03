import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import db from "@/db";
import { accessoires, games } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const gameIds = searchParams.getAll("gameIds").map(Number).filter((id) => !isNaN(id));

    if (gameIds.length === 0) return NextResponse.json({ required_accessories: [] });

    const rows = await db.select({ requiredAccessories: games.requiredAccessories })
      .from(games)
      .where(inArray(games.id, gameIds));

    const kohaIds: number[] = [];
    rows.forEach((row) => {
      const required = row.requiredAccessories as number[] | null;
      // Tous les accessoires requis comptent, pas seulement le premier.
      if (required) kohaIds.push(...required);
    });

    if (kohaIds.length === 0) return NextResponse.json({ required_accessories: [] });

    // Un accessoire caché (942 $n) ou non fonctionnel (583 $9) ne doit pas
    // être présélectionné, même s'il est requis par le jeu.
    const mapped = await db.select({ id: accessoires.id })
      .from(accessoires)
      .where(and(inArray(accessoires.kohaId, kohaIds), eq(accessoires.hidden, 0)));

    return NextResponse.json({ required_accessories: mapped.map((r) => r.id) });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
