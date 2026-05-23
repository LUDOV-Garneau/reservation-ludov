import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const weeklyAvailabilities = await db.query.weeklyAvailabilities.findMany();

    if (weeklyAvailabilities.length <= 0) {
      return NextResponse.json({ unavailableDates: null });
    }

    const unavailableDates: { before: string | null; after: string | null; dayOfWeek: number[] } = {
      before: null,
      after: null,
      dayOfWeek: [],
    };

    if (!weeklyAvailabilities[0].alwaysAvailable) {
      unavailableDates.before = weeklyAvailabilities[0].startDate;
      unavailableDates.after = weeklyAvailabilities[0].endDate;
    }

    const dayNameToIndex: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };

    for (const w of weeklyAvailabilities) {
      if (!w.enabled) {
        const dayIndex = dayNameToIndex[w.dayOfWeek.toLowerCase()];
        unavailableDates.dayOfWeek.push(dayIndex);
      }
    }

    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error("Error fetching unavailable dates:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
