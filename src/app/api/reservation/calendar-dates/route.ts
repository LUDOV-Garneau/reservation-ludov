import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

interface WeeklyAvailabilitiesRow extends RowDataPacket {
  weekly_id: number;
  start_date: Date;
  end_date: Date;
  day_of_week: string;
  enabled: boolean;
  always_available: boolean;
}

type UnavailableDates = {
  before: Date | null;
  after: Date | null;
  dayOfWeek: number[];
};

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

    const [weeklyAvailabilities] = await pool.query<WeeklyAvailabilitiesRow[]>(
      "SELECT * FROM weekly_availabilities"
    );

    if (weeklyAvailabilities.length <= 0) {
      return NextResponse.json({
        unavailableDates: null,
      });
    }

    const unavailableDates: UnavailableDates = {
      before: null,
      after: null,
      dayOfWeek: [],
    };

    if (!weeklyAvailabilities[0].always_available) {
      unavailableDates.before = weeklyAvailabilities[0].start_date;
      unavailableDates.after = weeklyAvailabilities[0].end_date;
    }

    const dayNameToIndex: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    for (const weekAvailability of weeklyAvailabilities) {
      if (!weekAvailability.enabled) {
        const dayIndex =
          dayNameToIndex[weekAvailability.day_of_week.toLowerCase()];
        unavailableDates.dayOfWeek.push(dayIndex);
      }
    }

    return NextResponse.json({
      unavailableDates: unavailableDates,
    });
  } catch (error) {
    console.error("Error fetching unavailable dates:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
