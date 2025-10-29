import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ReservationRow extends RowDataPacket {
  time: string;
  console_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string;
}

interface TimeSlotAvailability {
  time: string;
  available: boolean;
  conflicts?: {
    console?: boolean;
    games?: number[];
    accessories?: number[];
  };
}

function generateAllTimeSlots(): string[] {
  const OPENING_HOUR = 8;
  const CLOSING_HOUR = 18;
  const SESSION_DURATION = 2;

  const slots: string[] = [];

  for (let hour = OPENING_HOUR; hour <= CLOSING_HOUR - SESSION_DURATION; hour++) {
    const timeString = `${hour.toString().padStart(2, "0")}:00:00`;
    slots.push(timeString);
  }

  return slots;
}

function checkSlotAvailability(
  time: string,
  reservations: ReservationRow[],
  requestedConsoleId: number,
  requestedGameIds: number[],
  requestedAccessoryIds: number[]
): { available: boolean; conflicts?: unknown } {
  const conflicts: { console?: boolean; games?: number[]; accessories?: number[] } = {};
  let hasConflict = false;

  const reservationsAtThisTime = reservations.filter((res) => res.time === time);

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
      } else if (typeof res.accessoirs === 'string') {
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

  return {
    available: !hasConflict,
    ...(hasConflict && { conflicts }),
  };
}

function isSlotInFuture(time: string, currentHour: number): boolean {
  const [slotHour] = time.split(":").map(Number);
  return slotHour > currentHour;
}

export async function GET(request: NextRequest) {
  try {
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
      ? gameIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      : [];
    const requestedAccessoryIds = accessoryIds
      ? accessoryIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      : [];

    const [reservations] = await pool.query<ReservationRow[]>(
      `SELECT time, console_id, game1_id, game2_id, game3_id, accessory_ids 
       FROM reservation 
       WHERE date = ? AND archived = 0`,
      [date]
    );

    const allSlots = generateAllTimeSlots();

    const availability: TimeSlotAvailability[] = allSlots.map((time) => {
      const check = checkSlotAvailability(
        time,
        reservations,
        requestedConsoleId,
        requestedGameIds,
        requestedAccessoryIds
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

    const availableCount = finalAvailability.filter((slot) => slot.available).length;

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