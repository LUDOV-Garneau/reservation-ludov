import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservation, reservationHold, specificDates, hourRanges, weeklyAvailabilities, games, accessoires, stations } from "@/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { toLocalYmd, isFutureSlot } from "@/lib/dates";
import {
  computeValidRanges,
  dayNameFor,
  generateAllTimeSlots,
} from "@/lib/availability";

export interface TimeSlotAvailability {
  time: string;
  available: boolean;
  conflicts?: { console?: boolean; games?: number[]; accessories?: number[]; station?: boolean };
}

function checkSlotAvailability(
  time: string,
  reservations: { time: string; consoleId: number; game1Id: number | null; game2Id: number | null; game3Id: number | null; accessoryIds: unknown; stationId: number | null }[],
  holds: { time: string | null; stationId: number | null }[],
  requestedConsoleId: number,
  requestedGameIds: number[],
  requestedAccessoryIds: number[],
  requestedStationIds: number[]
): { available: boolean; conflicts?: unknown } {
  const conflicts: { console?: boolean; games?: number[]; accessories?: number[]; station?: boolean } = {};
  let hasConflict = false;
  const atTime = reservations.filter((r) => r.time === time);

  if (atTime.some((r) => r.consoleId === requestedConsoleId)) { conflicts.console = true; hasConflict = true; }

  const conflictingGames: number[] = [];
  for (const res of atTime) {
    const reserved = [res.game1Id, res.game2Id, res.game3Id].filter((id): id is number => id !== null);
    for (const gid of requestedGameIds) { if (reserved.includes(gid)) conflictingGames.push(gid); }
  }
  if (conflictingGames.length > 0) { conflicts.games = [...new Set(conflictingGames)]; hasConflict = true; }

  const conflictingAcc: number[] = [];
  for (const res of atTime) {
    let reserved: number[] = [];
    try { reserved = Array.isArray(res.accessoryIds) ? (res.accessoryIds as number[]) : (res.accessoryIds ? JSON.parse(res.accessoryIds as string) : []); } catch { reserved = []; }
    for (const aid of requestedAccessoryIds) { if (reserved.includes(aid)) conflictingAcc.push(aid); }
  }
  if (conflictingAcc.length > 0) { conflicts.accessories = [...new Set(conflictingAcc)]; hasConflict = true; }

  const holdsAtTime = holds.filter((h) => h.time === time);
  const conflictingStations: number[] = [];
  for (const s of requestedStationIds) {
    if (atTime.some((r) => r.stationId === s) || holdsAtTime.some((h) => h.stationId === s)) conflictingStations.push(s);
  }
  if (conflictingStations.length === requestedStationIds.length) { conflicts.station = true; hasConflict = true; }

  return { available: !hasConflict, ...(hasConflict && { conflicts }) };
}

function resolveAccessoryFallbacks(
  time: string,
  atTime: { accessoryIds: unknown }[],
  selectedAccessoryIds: number[],
  requiredAccessoryIdMap: Record<number, number[]>
): { valid: boolean; finalAccessoryIds: number[] } {
  const finalAccessories = [...selectedAccessoryIds];
  for (const gameId of Object.keys(requiredAccessoryIdMap)) {
    const candidates = requiredAccessoryIdMap[Number(gameId)];
    if (!candidates || candidates.length === 0) continue;
    const mandatory = candidates[0];
    if (finalAccessories.includes(mandatory)) continue;
    let availableFound = false;
    for (const candidate of candidates) {
      const unavailable = atTime.some((res) => {
        let reserved: number[] = [];
        try { reserved = Array.isArray(res.accessoryIds) ? (res.accessoryIds as number[]) : (res.accessoryIds ? JSON.parse(res.accessoryIds as string) : []); } catch { reserved = []; }
        return reserved.includes(candidate);
      });
      if (!unavailable) { finalAccessories.push(candidate); availableFound = true; break; }
    }
    if (!availableFound) return { valid: false, finalAccessoryIds: [] };
  }
  return { valid: true, finalAccessoryIds: finalAccessories };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

    const consoleTypeRow = await db.query.reservationHold.findFirst({
      columns: { consoleTypeId: true },
      where: and(eq(reservationHold.userId, Number(user.id)), eq(reservationHold.consoleId, requestedConsoleId)),
    });
    const requestedConsoleTypeId = consoleTypeRow?.consoleTypeId;

    const dayName = dayNameFor(date);

    const [reservations, holds, specificHoursRows, weeklyHoursRows, userReservations] = await Promise.all([
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

      db.select({ consoleTypeId: reservation.consoleTypeId })
        .from(reservation)
        .where(and(eq(reservation.userId, Number(user.id)), eq(reservation.date, date), eq(reservation.archived, 0))),
    ]);

    const specificHours = specificHoursRows.map((r) => ({ ...r, isException: Boolean(r.isException) }));

    // Une seule réservation par plateforme et par jour : la même règle est
    // rejouée à l'écriture (voir checkSlotBookable).
    const alreadyBookedSameConsoleType =
      requestedConsoleTypeId != null &&
      userReservations.some((r) => Number(r.consoleTypeId) === Number(requestedConsoleTypeId));

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
      const accRows = await db.select({ id: accessoires.id, kohaId: accessoires.kohaId }).from(accessoires).where(inArray(accessoires.kohaId, allRequiredKoha));
      const kohaToId: Record<number, number> = {};
      accRows.forEach((r) => (kohaToId[r.kohaId] = r.id));
      for (const gameId of Object.keys(requiredAccessoryMap)) {
        requiredAccessoryIdMap[Number(gameId)] = requiredAccessoryMap[Number(gameId)].map((k) => kohaToId[k]).filter(Boolean);
      }
    }

    const stationRows = await db.select({ stationId: stations.id })
      .from(stations)
      .where(and(
        eq(stations.isActive, 1),
        sql`JSON_CONTAINS(${stations.consoles}, JSON_ARRAY(${requestedConsoleTypeId}))`,
      ));

    const allSlots = generateAllTimeSlots(validRanges);

    const availability: TimeSlotAvailability[] = allSlots.map((time) => {
      const atTime = reservations.filter((r) => r.time === time);
      const fallback = resolveAccessoryFallbacks(time, atTime, requestedAccessoryIds, requiredAccessoryIdMap);
      if (!fallback.valid) return { time, available: false, conflicts: { accessories: [-1] } };
      const check = checkSlotAvailability(time, reservations, holds, requestedConsoleId, requestedGameIds, requestedAccessoryIds, stationRows.map((s) => s.stationId));
      return { time, available: check.available, ...(check.conflicts ? { conflicts: check.conflicts } : {}) };
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
