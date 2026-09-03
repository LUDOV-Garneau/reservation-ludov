import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import {
  reservation,
  reservationHold,
  specificDates,
  hourRanges,
  weeklyAvailabilities,
  games,
  accessoires,
  stations,
  consoleStock,
} from "@/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { toLocalYmd, isFutureSlot } from "@/lib/dates";
import {
  computeValidRanges,
  dayNameFor,
  generateAllTimeSlots,
} from "@/lib/availability";
import {
  evaluateSlot,
  resolveAccessoryFallbacks,
  type SlotConflicts,
} from "@/lib/slotConflicts";

export interface TimeSlotAvailability {
  time: string;
  available: boolean;
  conflicts?: SlotConflicts;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = Number(user.id);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const consoleId = searchParams.get("consoleId");
    const gameIds = searchParams.get("gameIds");
    const accessoryIds = searchParams.get("accessoryIds");
    const reservationId = searchParams.get("reservationId");

    if (!date) return NextResponse.json({ success: false, error: "Missing date parameter" }, { status: 400 });
    if (!consoleId) return NextResponse.json({ success: false, error: "Missing consoleId parameter" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ success: false, error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });

    const now = new Date();
    const todayStr = toLocalYmd(now);
    if (date < todayStr) return NextResponse.json({ success: false, error: "Cannot check availability for past dates" }, { status: 400 });

    const requestedConsoleId = parseInt(consoleId, 10);
    const requestedGameIds = gameIds ? gameIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id)) : [];
    const requestedAccessoryIds = accessoryIds ? accessoryIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id)) : [];

    // La plateforme vient du hold de l'usager (l'unité retenue peut avoir
    // changé depuis que le client a mémorisé consoleId), sinon de l'unité.
    const hold = await db.query.reservationHold.findFirst({
      columns: { consoleTypeId: true },
      where: and(
        eq(reservationHold.userId, userId),
        reservationId
          ? eq(reservationHold.id, reservationId)
          : eq(reservationHold.consoleId, requestedConsoleId),
        sql`${reservationHold.expireAt} > NOW()`,
      ),
    });
    let requestedConsoleTypeId = hold?.consoleTypeId ?? null;
    if (requestedConsoleTypeId == null) {
      const unit = await db.query.consoleStock.findFirst({
        columns: { consoleTypeId: true },
        where: eq(consoleStock.id, requestedConsoleId),
      });
      requestedConsoleTypeId = unit?.consoleTypeId ?? null;
    }
    if (requestedConsoleTypeId == null) {
      return NextResponse.json({ success: false, error: "Unknown console" }, { status: 400 });
    }

    const dayName = dayNameFor(date);

    const [reservations, holds, specificHoursRows, weeklyHoursRows, userReservations, unitRows, stationRows] = await Promise.all([
      db.select({
        time: reservation.time,
        consoleId: reservation.consoleId,
        game1Id: reservation.game1Id,
        game2Id: reservation.game2Id,
        game3Id: reservation.game3Id,
        accessoryIds: reservation.accessoryIds,
        stationId: reservation.station,
      }).from(reservation).where(and(eq(reservation.date, date), eq(reservation.archived, 0))),

      db.select({ time: reservationHold.time, stationId: reservationHold.stationId })
        .from(reservationHold)
        .where(and(
          eq(reservationHold.date, date),
          sql`${reservationHold.expireAt} > NOW()`,
          reservationId ? sql`${reservationHold.id} != ${reservationId}` : undefined
        )),

      db.select({ startHour: specificDates.startHour, startMinute: specificDates.startMinute, endHour: specificDates.endHour, endMinute: specificDates.endMinute, isException: specificDates.isException })
        .from(specificDates)
        .where(eq(specificDates.date, date)),

      db.select({ startHour: hourRanges.startHour, startMinute: hourRanges.startMinute, endHour: hourRanges.endHour, endMinute: hourRanges.endMinute })
        .from(hourRanges)
        .innerJoin(weeklyAvailabilities, eq(hourRanges.weeklyId, weeklyAvailabilities.weeklyId))
        .where(and(
          eq(weeklyAvailabilities.dayOfWeek, dayName),
          eq(weeklyAvailabilities.enabled, 1),
          or(eq(weeklyAvailabilities.alwaysAvailable, 1), and(sql`${date} >= ${weeklyAvailabilities.startDate}`, sql`${date} <= ${weeklyAvailabilities.endDate}`))
        )),

      db.select({ consoleTypeId: reservation.consoleTypeId, time: reservation.time })
        .from(reservation)
        .where(and(eq(reservation.userId, userId), eq(reservation.date, date), eq(reservation.archived, 0))),

      db.select({ id: consoleStock.id })
        .from(consoleStock)
        .where(and(eq(consoleStock.consoleTypeId, requestedConsoleTypeId), eq(consoleStock.isActive, 1))),

      db.select({ stationId: stations.id })
        .from(stations)
        .where(and(
          eq(stations.isActive, 1),
          sql`JSON_CONTAINS(${stations.consoles}, JSON_ARRAY(${requestedConsoleTypeId}))`,
        )),
    ]);

    const specificHours = specificHoursRows.map((r) => ({ ...r, isException: Boolean(r.isException) }));

    // Une seule réservation par plateforme et par jour : la même règle est
    // rejouée à l'écriture (voir checkSlotBookable).
    const alreadyBookedSameConsoleType = userReservations.some(
      (r) => Number(r.consoleTypeId) === Number(requestedConsoleTypeId),
    );

    const validRanges = alreadyBookedSameConsoleType
      ? []
      : computeValidRanges(weeklyHoursRows, specificHours);

    const requiredAccessoryMap: Record<number, number[]> = {};
    if (requestedGameIds.length > 0) {
      const requiredRows = await db.select({ id: games.id, requiredAccessories: games.requiredAccessories }).from(games).where(inArray(games.id, requestedGameIds));
      requiredRows.forEach((row) => {
        // Tous les accessoires requis comptent, pas seulement le premier.
        requiredAccessoryMap[row.id] = (row.requiredAccessories as number[] | null) || [];
      });
    }

    const allRequiredKoha = Object.values(requiredAccessoryMap).flat();
    const requiredAccessoryIdMap: Record<number, number[]> = {};
    if (allRequiredKoha.length > 0) {
      // Les substituts possibles excluent les accessoires cachés ou non
      // fonctionnels (583 $9) : ils ne doivent jamais être attribués.
      const accRows = await db.select({ id: accessoires.id, kohaId: accessoires.kohaId }).from(accessoires).where(and(inArray(accessoires.kohaId, allRequiredKoha), eq(accessoires.hidden, 0)));
      const kohaToId: Record<number, number> = {};
      accRows.forEach((r) => (kohaToId[r.kohaId] = r.id));
      for (const gameId of Object.keys(requiredAccessoryMap)) {
        requiredAccessoryIdMap[Number(gameId)] = requiredAccessoryMap[Number(gameId)].map((k) => kohaToId[k]).filter(Boolean);
      }
    }

    const allSlots = generateAllTimeSlots(validRanges);
    const consoleUnitIds = unitRows.map((u) => u.id);
    const stationIds = stationRows.map((s) => s.stationId);
    const userReservationTimes = userReservations.map((r) => r.time);

    const availability: TimeSlotAvailability[] = allSlots.map((time) => {
      const fallback = resolveAccessoryFallbacks(time, reservations, requestedAccessoryIds, requiredAccessoryIdMap);
      if (!fallback.valid) return { time, available: false, conflicts: { accessories: [-1] } };
      return {
        time,
        ...evaluateSlot({
          time,
          reservations,
          holds,
          userReservationTimes,
          consoleUnitIds,
          requestedGameIds,
          requestedAccessoryIds,
          stationIds,
        }),
      };
    });

    let finalAvailability = availability;
    if (date === todayStr) {
      finalAvailability = availability.map((slot) =>
        !isFutureSlot(date, slot.time, now)
          ? { ...slot, available: false, conflicts: { ...slot.conflicts, past: true } }
          : slot
      );
    }

    const availableCount = finalAvailability.filter((s) => s.available).length;

    return NextResponse.json({
      success: true,
      date,
      requestedItems: { consoleId: requestedConsoleId, gameIds: requestedGameIds, accessoryIds: requestedAccessoryIds },
      availability: finalAvailability,
      stats: { totalSlots: allSlots.length, availableSlots: availableCount, unavailableSlots: allSlots.length - availableCount },
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ success: false, error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
