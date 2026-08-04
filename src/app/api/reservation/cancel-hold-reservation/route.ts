import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservationHold, consoleStock, games } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const { reservationId } = await req.json();
    if (!reservationId) {
      return NextResponse.json({ success: false, message: "reservationId manquant" }, { status: 400 });
    }

    const hold = await db.query.reservationHold.findFirst({
      where: eq(reservationHold.id, String(reservationId)),
    });

    if (!hold) {
      return NextResponse.json({ success: false, message: "Réservation introuvable" }, { status: 404 });
    }

    if (!user.isAdmin && hold.userId !== userId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const consoleId = hold.consoleId as number | null;

    await db.delete(reservationHold).where(eq(reservationHold.id, String(reservationId)));

    if (consoleId) {
      await db.update(consoleStock).set({ holding: 0 }).where(eq(consoleStock.id, consoleId));
    }

    for (const gameId of [hold.game1Id, hold.game2Id, hold.game3Id]) {
      if (gameId) {
        await db.update(games).set({ holding: 0 }).where(eq(games.id, gameId));
      }
    }

    return NextResponse.json({ success: true, reservationId, releasedConsoleId: consoleId });
  } catch (err) {
    console.error("Erreur cancel reservation:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
