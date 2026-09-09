import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservationHold, consoleStock, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "@/lib/logger";

export async function POST(req: Request) {
  const log = createLogger("RESERVATION:cancel-hold");
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      log.warn("auth.rejected", { reason: "invalid_token" });
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    if (!user?.id) {
      log.warn("auth.rejected", { reason: "no_session" });
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      log.warn("request.rejected", { reason: "invalid_user_id" });
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }
    log.bind({ userId });

    const { reservationId } = await req.json();
    if (!reservationId) {
      log.warn("request.rejected", { reason: "missing_reservation_id" });
      return NextResponse.json({ success: false, message: "reservationId manquant" }, { status: 400 });
    }
    log.bind({ holdId: String(reservationId) });

    const hold = await db.query.reservationHold.findFirst({
      where: eq(reservationHold.id, String(reservationId)),
    });

    if (!hold) {
      // Cas courant et bénin : le hold a déjà expiré ou été confirmé.
      log.warn("hold.not_found");
      return NextResponse.json({ success: false, message: "Réservation introuvable" }, { status: 404 });
    }

    if (!user.isAdmin && hold.userId !== userId) {
      log.warn("hold.forbidden", { ownerId: hold.userId });
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

    // Le hold relâche sa console et ses jeux : si ces lignes manquent alors
    // qu'une unité reste bloquée, c'est ici qu'il faut regarder.
    log.info("hold.cancelled", {
      releasedConsoleStockId: consoleId,
      releasedGames: [hold.game1Id, hold.game2Id, hold.game3Id].filter((id) => id != null),
      byAdmin: Boolean(user.isAdmin) && hold.userId !== userId,
      ms: log.elapsedMs(),
    });

    return NextResponse.json({ success: true, reservationId, releasedConsoleId: consoleId });
  } catch (err) {
    log.error("request.failed", err, { ms: log.elapsedMs() });
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
