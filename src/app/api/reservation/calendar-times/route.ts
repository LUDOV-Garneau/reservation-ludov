import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

type ReservationRow = RowDataPacket & {
  time: string;
  console_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string;
  stationId: number;
}

interface ReservationHoldRow extends RowDataPacket {
  time: string;
  stationId: number;
}

interface StationRow extends RowDataPacket {
  station_id: number;
}

type WeeklyHoursRow = RowDataPacket & {
  start_hour: string;
  start_minute: string;
  end_hour: string;
  end_minute: string;
};

type UserReservationRow = RowDataPacket & {
  console_type_id: number;
};

type ConsoleTypeRow = RowDataPacket & {
  console_type_id: number;
};

type GameRow = RowDataPacket & {
  required_accessories: number[];
};

type SpecificHoursRow = WeeklyHoursRow & { is_exception: boolean };

type Range = { start: number; end: number };

interface TimeSlotAvailability {
  time: string;
  available: boolean;
  conflicts?: {
    console?: boolean;
    games?: number[];
    accessories?: number[];
    station?: boolean;
  };
}

function toMinutes(h: string, m: string) {
  return parseInt(h) * 60 + parseInt(m);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function subtractRange(base: Range[], toRemove: Range): Range[] {
  const result: Range[] = [];
  for (const r of base) {
    if (toRemove.end <= r.start || toRemove.start >= r.end) {
      result.push(r);
      continue;
    }
    if (toRemove.start > r.start) {
      result.push({ start: r.start, end: toRemove.start });
    }
    if (toRemove.end < r.end) {
      result.push({ start: toRemove.end, end: r.end });
    }
  }
  return result;
}

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Range[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else if (current.start === last.end) {
      last.end = current.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function computeValidRanges(
  weeklyHours: WeeklyHoursRow[],
  specificHours: SpecificHoursRow[],
  userReservations: UserReservationRow[],
  consoleTypeId: number | null
) {
  if (consoleTypeId) {
    for (const { console_type_id } of userReservations) {
      if (consoleTypeId == console_type_id) {
        return [];
      }
    }
  }

  let validRanges: Range[] = weeklyHours.map((r) => ({
    start: toMinutes(r.start_hour, r.start_minute),
    end: toMinutes(r.end_hour, r.end_minute),
  }));

  for (const r of specificHours) {
    const range = {
      start: toMinutes(r.start_hour, r.start_minute),
      end: toMinutes(r.end_hour, r.end_minute),
    };

    if (r.is_exception === true) {
      validRanges = subtractRange(validRanges, range);
    } else {
      validRanges.push(range);
    }
  }

  return mergeRanges(validRanges);
}

function generateAllTimeSlots(): string[] {
  const OPENING_HOUR = 9;
  const CLOSING_HOUR = 17;
  const SESSION_DURATION = 2;

  const slots: string[] = [];

  for (
    let hour = OPENING_HOUR;
    hour <= CLOSING_HOUR - SESSION_DURATION;
    hour++
  ) {
    const timeString = `${hour.toString().padStart(2, "0")}:00:00`;
    slots.push(timeString);
  }

  return slots;
}

function checkSlotAvailability(
  time: string,
  reservations: ReservationRow[],
  holds: { time: string; stationId: number }[],
  requestedConsoleId: number,
  requestedGameIds: number[],
  requestedAccessoryIds: number[],
  requestedStationIds: number[]
): { available: boolean; conflicts?: unknown } {
  const conflicts: {
    console?: boolean;
    games?: number[];
    accessories?: number[];
    station?: boolean;
  } = {};
  let hasConflict = false;

  const reservationsAtThisTime = reservations.filter(
    (res) => res.time === time
  );

  const consoleConflict = reservationsAtThisTime.some(
    (res) => res.console_id === requestedConsoleId
  );
  if (consoleConflict) {
    conflicts.console = true;
    hasConflict = true;
  }

  const conflictingGames: number[] = [];
  for (const res of reservationsAtThisTime) {
    const reservedGames = [res.game1_id, res.game2_id, res.game3_id].filter(
      (id): id is number => id !== null
    );

    for (const requestedGameId of requestedGameIds) {
      if (reservedGames.includes(requestedGameId)) {
        conflictingGames.push(requestedGameId);
      }
    }
  }
  if (conflictingGames.length > 0) {
    conflicts.games = [...new Set(conflictingGames)];
    hasConflict = true;
  }

  const conflictingAccessories: number[] = [];
  for (const res of reservationsAtThisTime) {
    let reservedAccessories: number[] = [];

    if (res.accessoirs) {
      if (Array.isArray(res.accessoirs)) {
        reservedAccessories = res.accessoirs;
      } else if (typeof res.accessoirs === "string") {
        try {
          reservedAccessories = JSON.parse(res.accessoirs);
        } catch {
          console.warn("Could not parse accessoirs for reservation");
        }
      }
    }

    for (const requestedAccessoryId of requestedAccessoryIds) {
      if (reservedAccessories.includes(requestedAccessoryId)) {
        conflictingAccessories.push(requestedAccessoryId);
      }
    }
  }
  if (conflictingAccessories.length > 0) {
    conflicts.accessories = [...new Set(conflictingAccessories)];
    hasConflict = true;
  }

  const conflictingStations: number[] = [];

  for (const station of requestedStationIds) {
    if (reservationsAtThisTime.some((res) => res.stationId === station)) {
      conflictingStations.push(station);
    }
  }

  const holdsAtThisTime = holds.filter((h) => h.time === time);

  for (const station of requestedStationIds) {
    if (holdsAtThisTime.some((h) => h.stationId === station)) {
      conflictingStations.push(station);
    }
  }

  if (conflictingStations.length === requestedStationIds.length) {
    conflicts.station = true;
    hasConflict = true;
  }

  return {
    available: !hasConflict,
    ...(hasConflict && { conflicts }),
  };
}

function isSlotInFuture(time: string, currentHour: number): boolean {
  const [slotHour] = time.split(":").map(Number);
  return slotHour > currentHour;
}

function resolveAccessoryFallbacks(
  time: string,
  reservationsAtThisTime: ReservationRow[],
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
      const unavailable = reservationsAtThisTime.some((res) => {
        let reserved = [];

        try {
          reserved =
            typeof res.accessory_ids === "string"
              ? JSON.parse(res.accessory_ids)
              : res.accessory_ids || [];
        } catch {
          reserved = [];
        }

        return reserved.includes(candidate);
      });

      if (!unavailable) {
        finalAccessories.push(candidate);
        availableFound = true;
        break;
      }
    }

    if (!availableFound) {
      return { valid: false, finalAccessoryIds: [] };
    }
  }

  return { valid: true, finalAccessoryIds: finalAccessories };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const consoleId = searchParams.get("consoleId");
    const gameIds = searchParams.get("gameIds");
    const accessoryIds = searchParams.get("accessoryIds");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Missing date parameter" },
        { status: 400 }
      );
    }

    if (!consoleId) {
      return NextResponse.json(
        { success: false, error: "Missing consoleId parameter" },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (date < todayStr) {
      return NextResponse.json(
        { success: false, error: "Cannot check availability for past dates" },
        { status: 400 }
      );
    }

    const requestedConsoleId = parseInt(consoleId, 10);
    const requestedGameIds = gameIds
      ? gameIds
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : [];
    const requestedAccessoryIds = accessoryIds
      ? accessoryIds
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : [];

    const [consoleType] = await pool.query<ConsoleTypeRow[]>(
      `SELECT console_type_id
       FROM reservation_hold
       WHERE user_id = ?
        AND console_id = ?
       LIMIT 1`,
      [user.id, consoleId]
    );

    const [reservations] = await pool.query<ReservationRow[]>(
      `SELECT time, console_id, game1_id, game2_id, game3_id, accessory_ids, station AS stationId
       FROM reservation 
       WHERE date = ? AND archived = 0`,
      [date]
    );

    const [holds] = await pool.query<ReservationHoldRow[]>(
      `
      SELECT time, station_id AS stationId
      FROM reservation_hold
      WHERE date = ?
      AND expireAt > NOW()
      `,
      [date]
    );

    const [specificHours] = await pool.query<SpecificHoursRow[]>(
      `SELECT start_hour, start_minute, end_hour, end_minute, is_exception FROM specific_dates WHERE date = ?`,
      [date]
    );

    const dayNames = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayName = dayNames[new Date(date).getDay()];

    const [weeklyHours] = await pool.query<WeeklyHoursRow[]>(
      `
        SELECT h.start_hour, h.start_minute, h.end_hour, h.end_minute
        FROM hour_ranges h
        INNER JOIN weekly_availabilities w
          ON h.weekly_id = w.weekly_id
        WHERE w.day_of_week = ?
          AND w.enabled = 1
          AND (w.always_available = 1 OR (? >= w.start_date AND ? <= w.end_date))
      `,
      [dayName, date, date]
    );

    const [userReservations] = await pool.query<UserReservationRow[]>(
      `
        SELECT console_type_id
        FROM reservation
        WHERE user_id = ?
          AND date = ?
          AND archived = 0
      `,
      [user.id, date]
    );

    const validRanges = computeValidRanges(
      weeklyHours,
      specificHours,
      userReservations,
      consoleType[0]?.console_type_id || null
    );

    const [requiredRows] = await pool.query<GameRow[]>(
      `SELECT required_accessories FROM games WHERE id IN (?)`,
      [requestedGameIds]
    );

    const requiredAccessoryMap: Record<number, number[]> = {};

    requiredRows.forEach((row, index) => {
      const gameId = requestedGameIds[index];
      const kohaList = row.required_accessories || [];

      if (kohaList.length > 0) {
        requiredAccessoryMap[gameId] = [kohaList[0]];
      } else {
        requiredAccessoryMap[gameId] = [];
      }
    });

    const allRequiredKoha = Object.values(requiredAccessoryMap).flat();

    const requiredAccessoryIdMap: Record<number, number[]> = {};

    if (allRequiredKoha.length > 0) {
      const [accRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, koha_id FROM accessoires WHERE koha_id IN (?)`,
        [allRequiredKoha]
      );

      const kohaToId: Record<number, number> = {};
      accRows.forEach((r) => (kohaToId[r.koha_id] = r.id));

      for (const gameId of Object.keys(requiredAccessoryMap)) {
        const kohaArray = requiredAccessoryMap[Number(gameId)];
        requiredAccessoryIdMap[Number(gameId)] = kohaArray
          .map((k) => kohaToId[k])
          .filter(Boolean);
      }
    }

    const SESSION_DURATION_HOURS = 2;
    const SESSION_DURATION_MINUTES = SESSION_DURATION_HOURS * 60;

    const reservationRanges = reservations.map((r) => {
      const start = timeToMinutes(r.time);
      return {
        start,
        end: start + SESSION_DURATION_MINUTES,
      };
    });

    const allSlots = generateAllTimeSlots().filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const slotStart = hour * 60 + minute;
      const slotEnd = slotStart + SESSION_DURATION_MINUTES;

      const fitsOpenHours = validRanges.some(
        (r) => slotStart >= r.start && slotEnd <= r.end
      );
      if (!fitsOpenHours) return false;

      const overlaps = reservationRanges.some(
        (res) => !(slotEnd <= res.start || slotStart >= res.end)
      );
      if (overlaps) return false;

      return true;
    });

    const [stationIds] = await pool.query<StationRow[]>(
      `SELECT id AS station_id
       FROM stations
       WHERE isActive = 1 AND JSON_CONTAINS(consoles, JSON_ARRAY(?))
      `,
      [requestedConsoleId]
    );

    const availability: TimeSlotAvailability[] = allSlots.map((time) => {
      const reservationsAtTime = reservations.filter((r) => r.time === time);

      const fallback = resolveAccessoryFallbacks(
        time,
        reservationsAtTime,
        requestedAccessoryIds,
        requiredAccessoryIdMap
      );

      if (!fallback.valid) {
        return {
          time,
          available: false,
          conflicts: { accessories: [-1] },
        };
      }

      const check = checkSlotAvailability(
        time,
        reservations,
        holds,
        requestedConsoleId,
        requestedGameIds,
        requestedAccessoryIds,
        stationIds.map((s) => s.station_id)
      );

      return {
        time,
        available: check.available,
        ...(check.conflicts ? { conflicts: check.conflicts } : {}),
      };
    });

    let finalAvailability = availability;
    if (date === todayStr) {
      const currentHour = now.getHours();

      finalAvailability = availability.map((slot) => {
        if (!isSlotInFuture(slot.time, currentHour)) {
          return {
            ...slot,
            available: false,
            conflicts: { ...slot.conflicts, past: true },
          };
        }
        return slot;
      });
    }

    const availableCount = finalAvailability.filter(
      (slot) => slot.available
    ).length;

    return NextResponse.json({
      success: true,
      date,
      requestedItems: {
        consoleId: requestedConsoleId,
        gameIds: requestedGameIds,
        accessoryIds: requestedAccessoryIds,
      },
      availability: finalAvailability,
      stats: {
        totalSlots: allSlots.length,
        availableSlots: availableCount,
        unavailableSlots: allSlots.length - availableCount,
      },
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
