import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { consoleStock, consoleType, games, reservationHold } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const reservationId = request.nextUrl.searchParams.get("id");
    if (!reservationId) {
      return NextResponse.json({ success: false, message: "reservationId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    if (!user?.id) return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 });

    const [row] = await db
      .select({
        id: reservationHold.id,
        userId: reservationHold.userId,
        consoleId: reservationHold.consoleId,
        consoleTypeId: reservationHold.consoleTypeId,
        game1Id: reservationHold.game1Id,
        game2Id: reservationHold.game2Id,
        game3Id: reservationHold.game3Id,
        accessoirs: reservationHold.accessoirs,
        expireAt: reservationHold.expireAt,
        createdAt: reservationHold.createdAt,
        date: reservationHold.date,
        time: reservationHold.time,
        cours: reservationHold.cours,
        ctId: consoleType.id,
        ctName: consoleType.name,
        ctPicture: consoleType.picture,
        expiresIn: sql<number>`GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), ${reservationHold.expireAt}))`,
      })
      .from(reservationHold)
      .innerJoin(consoleStock, eq(reservationHold.consoleId, consoleStock.id))
      .innerJoin(consoleType, eq(consoleStock.consoleTypeId, consoleType.id))
      .where(and(eq(reservationHold.id, reservationId), eq(reservationHold.userId, Number(user.id))))
      .limit(1);

    if (!row) {
      return NextResponse.json({ success: false, status: "not_found", message: "Reservation not found or unauthorized" }, { status: 404 });
    }

    if (Number(row.expiresIn) <= 0) {
      await db.transaction(async (tx) => {
        await tx.update(consoleStock).set({ holding: 0 }).where(eq(consoleStock.id, row.consoleId));

        const gameIds = [row.game1Id, row.game2Id, row.game3Id].filter((id): id is number => id !== null);
        if (gameIds.length > 0) {
          await tx.update(games).set({ holding: 0 }).where(inArray(games.id, gameIds));
        }
        await tx.delete(reservationHold).where(eq(reservationHold.id, reservationId));
      });

      return NextResponse.json({ success: false, status: "expired", message: "Reservation has expired" }, { status: 410 });
    }

    const gameIds = [row.game1Id, row.game2Id, row.game3Id].filter((id): id is number => id !== null);

    let accessories: number[] = [];
    if (row.accessoirs) {
      try {
        accessories = typeof row.accessoirs === "string"
          ? JSON.parse(row.accessoirs)
          : Array.isArray(row.accessoirs) ? row.accessoirs as number[] : [];
        if (!Array.isArray(accessories)) accessories = [];
      } catch {
        accessories = [];
      }
    }

    let currentStep = 1;
    if (row.consoleId) currentStep = 2;
    if (gameIds.length > 0) currentStep = 3;
    if (accessories.length > 0) currentStep = 4;
    if (row.date && row.time) currentStep = 5;
    if (row.cours !== null) currentStep = 6;
    if (row.consoleId && row.cours !== null && gameIds.length === 0) currentStep = 3;

    const expiresAtIso = new Date(row.expireAt).toISOString();
    const expiresIn = Math.max(0, Number(row.expiresIn));

    return NextResponse.json({
      success: true,
      status: "active",
      reservationId: row.id,
      userId: row.userId,
      console: { id: row.ctId, name: row.ctName, picture: row.ctPicture },
      consoleStockId: row.consoleId,
      consoleTypeId: row.consoleTypeId,
      games: gameIds,
      accessories,
      selectedDate: row.date,
      selectedTime: row.time,
      cours: row.cours,
      expiresAt: expiresAtIso,
      createdAt: new Date(row.createdAt).toISOString(),
      currentStep,
      timeRemaining: expiresIn,
      expiresIn,
    });
  } catch (err) {
    console.error("Error fetching active reservation:", err);
    return NextResponse.json({
      success: false,
      message: "Error fetching reservation",
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
