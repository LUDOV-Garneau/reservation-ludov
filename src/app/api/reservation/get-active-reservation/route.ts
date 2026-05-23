import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { consoleStock, games, reservationHold } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { inArray } from "drizzle-orm";

interface ReservationRow {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string | null;
  expireAt: string;
  createdAt: string;
  date: string | null;
  time: string | null;
  cours: number | null;
  ct_id: number;
  ct_name: string;
  ct_picture: string | null;
  expiresIn: number;
}

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

    const rows = await db.execute<ReservationRow>(
      sql`SELECT
        r.*,
        ct.id   AS ct_id,
        ct.name AS ct_name,
        ct.picture AS ct_picture,
        GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), r.expireAt)) AS expiresIn
      FROM reservation_hold r
      JOIN console_stock cs ON r.console_id = cs.id
      JOIN console_type ct  ON cs.console_type_id = ct.id
      WHERE r.id = ${reservationId} AND r.user_id = ${Number(user.id)}
      LIMIT 1`
    );

    const reservation = (rows as ReservationRow[])[0];
    if (!reservation) {
      return NextResponse.json({ success: false, status: "not_found", message: "Reservation not found or unauthorized" }, { status: 404 });
    }

    if (Number(reservation.expiresIn) <= 0) {
      await db.transaction(async (tx) => {
        await tx.update(consoleStock).set({ holding: 0 }).where(eq(consoleStock.id, reservation.console_id));

        const gameIds = [reservation.game1_id, reservation.game2_id, reservation.game3_id].filter((id): id is number => id !== null);
        if (gameIds.length > 0) {
          await tx.update(games).set({ holding: 0 }).where(inArray(games.id, gameIds));
        }
        await tx.delete(reservationHold).where(eq(reservationHold.id, reservationId));
      });

      return NextResponse.json({ success: false, status: "expired", message: "Reservation has expired" }, { status: 410 });
    }

    const gameIds = [reservation.game1_id, reservation.game2_id, reservation.game3_id].filter((id): id is number => id !== null);

    let accessories: number[] = [];
    if (reservation.accessoirs) {
      try {
        accessories = typeof reservation.accessoirs === "string"
          ? JSON.parse(reservation.accessoirs)
          : Array.isArray(reservation.accessoirs) ? reservation.accessoirs : [];
        if (!Array.isArray(accessories)) accessories = [];
      } catch {
        accessories = [];
      }
    }

    let currentStep = 1;
    if (reservation.console_id) currentStep = 2;
    if (gameIds.length > 0) currentStep = 3;
    if (accessories.length > 0) currentStep = 4;
    if (reservation.date && reservation.time) currentStep = 5;
    if (reservation.cours !== null) currentStep = 6;
    if (reservation.console_id && reservation.cours !== null && gameIds.length === 0) currentStep = 3;

    const expiresAtIso = new Date(reservation.expireAt).toISOString();
    const expiresIn = Math.max(0, Number(reservation.expiresIn));

    return NextResponse.json({
      success: true,
      status: "active",
      reservationId: reservation.id,
      userId: reservation.user_id,
      console: { id: reservation.ct_id, name: reservation.ct_name, picture: reservation.ct_picture },
      consoleStockId: reservation.console_id,
      consoleTypeId: reservation.console_type_id,
      games: gameIds,
      accessories,
      selectedDate: reservation.date,
      selectedTime: reservation.time,
      cours: reservation.cours,
      expiresAt: expiresAtIso,
      createdAt: new Date(reservation.createdAt).toISOString(),
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
