import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { weeklyAvailabilities, specificDates, hourRanges } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type WeekDay = { label: string; enabled: boolean; hoursRanges: HourRange[] };
type Exception = { date: Date; timeRange: HourRange };
type AvailabilityState = {
  weekly: Record<string, WeekDay>;
  dateRange: { alwaysApplies: boolean; range: { startDate: Date | null; endDate: Date | null } | null };
  exceptions: { enabled: boolean; dates: Exception[] };
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const [weeklyRows, specificRows, hoursRows] = await Promise.all([
      db.query.weeklyAvailabilities.findMany(),
      db.query.specificDates.findMany(),
      db.query.hourRanges.findMany(),
    ]);

    const fetchedAvailability: AvailabilityState = {
      weekly: {},
      dateRange: { alwaysApplies: false, range: null },
      exceptions: { enabled: false, dates: [] },
    };
    const fetchedSpecificDates: Exception[] = [];

    if (weeklyRows.length <= 0) {
      fetchedAvailability.dateRange = { alwaysApplies: false, range: null };
    } else if (weeklyRows[0].alwaysAvailable) {
      fetchedAvailability.dateRange = { alwaysApplies: true, range: null };
    } else {
      fetchedAvailability.dateRange = {
        alwaysApplies: false,
        range: { startDate: weeklyRows[0].startDate ? new Date(weeklyRows[0].startDate) : null, endDate: weeklyRows[0].endDate ? new Date(weeklyRows[0].endDate) : null },
      };
    }

    fetchedAvailability.exceptions.enabled = specificRows.some((sr) => sr.isException == 1);

    for (const sr of specificRows) {
      const entry: Exception = {
        date: new Date(sr.date),
        timeRange: { id: sr.id, startHour: sr.startHour, startMinute: sr.startMinute, endHour: sr.endHour, endMinute: sr.endMinute },
      };
      if (sr.isException) {
        fetchedAvailability.exceptions.dates.push(entry);
      } else {
        fetchedSpecificDates.push(entry);
      }
    }

    for (const wr of weeklyRows) {
      fetchedAvailability.weekly[wr.dayOfWeek] = {
        label: wr.dayOfWeek,
        enabled: Boolean(wr.enabled),
        hoursRanges: hoursRows
          .filter((hr) => hr.weeklyId === wr.weeklyId)
          .map((hr) => ({ id: hr.rangeId, startHour: hr.startHour, startMinute: hr.startMinute, endHour: hr.endHour, endMinute: hr.endMinute })),
      };
    }

    return NextResponse.json({ availability: fetchedAvailability, specificDates: fetchedSpecificDates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    console.error("Erreur:", err);
    return NextResponse.json({ success: false, message: message || "An unknown error occured while fetching availabilities." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await request.json();
    if (!body.weekly || !body.dateRange || !body.exceptions) {
      return NextResponse.json({ success: false, message: "availabilities object is required." }, { status: 400 });
    }

    const parsedAvailability: AvailabilityState = {
      ...body,
      dateRange: {
        alwaysApplies: body.dateRange.alwaysApplies,
        range: body.dateRange.range
          ? {
              startDate: body.dateRange.range.startDate ? new Date(body.dateRange.range.startDate) : null,
              endDate: body.dateRange.range.endDate ? new Date(body.dateRange.range.endDate) : null,
            }
          : null,
      },
      exceptions: {
        enabled: body.exceptions.enabled,
        dates: body.exceptions.dates.map((ex: Exception) => ({ date: new Date(ex.date), timeRange: ex.timeRange })),
      },
    };

    await db.transaction(async (tx) => {
      await tx.delete(weeklyAvailabilities);
      await tx.delete(specificDates).where(eq(specificDates.isException, 1));

      for (const [day, { enabled, hoursRanges: ranges }] of Object.entries(parsedAvailability.weekly)) {
        const startDate = parsedAvailability.dateRange.alwaysApplies ? null : parsedAvailability.dateRange.range?.startDate?.toISOString().slice(0, 10) ?? null;
        const endDate = parsedAvailability.dateRange.alwaysApplies ? null : parsedAvailability.dateRange.range?.endDate?.toISOString().slice(0, 10) ?? null;
        const alwaysAvailable = parsedAvailability.dateRange.alwaysApplies ? 1 : 0;

        const [{ weeklyId: insertedId }] = await tx.insert(weeklyAvailabilities).values({ startDate, endDate, dayOfWeek: day, enabled: enabled ? 1 : 0, alwaysAvailable }).$returningId();
        const weeklyId = Number(insertedId);

        if (enabled) {
          for (const hr of ranges) {
            await tx.insert(hourRanges).values({
              weeklyId,
              startHour: hr.startHour,
              startMinute: hr.startMinute,
              endHour: hr.endHour,
              endMinute: hr.endMinute,
            });
          }
        }
      }

      if (parsedAvailability.exceptions.enabled) {
        for (const exception of parsedAvailability.exceptions.dates) {
          await tx.insert(specificDates).values({
            date: exception.date.toISOString().slice(0, 10),
            startHour: exception.timeRange.startHour,
            startMinute: exception.timeRange.startMinute,
            endHour: exception.timeRange.endHour,
            endMinute: exception.timeRange.endMinute,
            isException: 1,
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Availabilities saved successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    console.error("Erreur SQL:", err);
    return NextResponse.json({ success: false, message: message || "An unknown error occured while saving availabilities." }, { status: 500 });
  }
}
