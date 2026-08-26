import { NextResponse } from "next/server";
import db from "@/db";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async () => {
  try {
    const weeklyAvailabilities = await db.query.weeklyAvailabilities.findMany();

    if (weeklyAvailabilities.length <= 0) {
      return NextResponse.json({ unavailableDates: null });
    }

    const unavailableDates: { before: string | null; after: string | null; dayOfWeek: number[] } = {
      before: null,
      after: null,
      dayOfWeek: [],
    };

    // La fenêtre d'ouverture doit couvrir toutes les lignes, pas seulement la
    // première (l'ordre de findMany n'est pas garanti).
    const rangeRows = weeklyAvailabilities.filter((w) => !w.alwaysAvailable);
    if (rangeRows.length > 0) {
      const starts = rangeRows
        .map((w) => w.startDate)
        .filter((d): d is string => d != null);
      const ends = rangeRows
        .map((w) => w.endDate)
        .filter((d): d is string => d != null);
      // Les chaînes "YYYY-MM-DD" se comparent lexicographiquement.
      unavailableDates.before = starts.length
        ? starts.reduce((a, b) => (a < b ? a : b))
        : null;
      unavailableDates.after = ends.length
        ? ends.reduce((a, b) => (a > b ? a : b))
        : null;
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
});
