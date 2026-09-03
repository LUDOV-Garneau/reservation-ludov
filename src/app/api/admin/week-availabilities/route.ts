import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db, { insertedId } from "@/db";
import { weeklyAvailabilities, specificDates, hourRanges } from "@/db/schema";
import { eq } from "drizzle-orm";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type WeekDay = { label: string; enabled: boolean; hoursRanges: HourRange[] };
/**
 * Les dates circulent en « YYYY-MM-DD » (jour calendaire local), jamais en
 * objets Date sérialisés : un ISO UTC relu dans le fuseau du navigateur
 * affichait la veille (le 5 octobre devenait le 4).
 */
type Exception = { date: string; timeRange: HourRange };
type AvailabilityState = {
  weekly: Record<string, WeekDay>;
  dateRange: { alwaysApplies: boolean; range: { startDate: string | null; endDate: string | null } | null };
  exceptions: { enabled: boolean; dates: Exception[] };
};

/** « YYYY-MM-DD » ; un ISO complet d'un ancien client est tronqué au jour. */
function toYmd(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ymd = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

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
        range: { startDate: weeklyRows[0].startDate ?? null, endDate: weeklyRows[0].endDate ?? null },
      };
    }

    fetchedAvailability.exceptions.enabled = specificRows.some((sr) => sr.isException == 1);

    for (const sr of specificRows) {
      const entry: Exception = {
        date: sr.date,
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

    const exceptionDates: Exception[] = [];
    for (const ex of body.exceptions.dates as { date: unknown; timeRange: HourRange }[]) {
      const date = toYmd(ex.date);
      if (!date) {
        return NextResponse.json({ success: false, message: "Date d'exception invalide (format attendu : YYYY-MM-DD)." }, { status: 400 });
      }
      exceptionDates.push({ date, timeRange: ex.timeRange });
    }

    const parsedAvailability: AvailabilityState = {
      ...body,
      dateRange: {
        alwaysApplies: Boolean(body.dateRange.alwaysApplies),
        range: body.dateRange.range
          ? {
              startDate: toYmd(body.dateRange.range.startDate),
              endDate: toYmd(body.dateRange.range.endDate),
            }
          : null,
      },
      exceptions: { enabled: Boolean(body.exceptions.enabled), dates: exceptionDates },
    };

    if (!parsedAvailability.dateRange.alwaysApplies && !parsedAvailability.dateRange.range?.startDate) {
      return NextResponse.json({ success: false, message: "Une période de validité est requise." }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(weeklyAvailabilities);
      await tx.delete(specificDates).where(eq(specificDates.isException, 1));

      for (const [day, { enabled, hoursRanges: ranges }] of Object.entries(parsedAvailability.weekly)) {
        const startDate = parsedAvailability.dateRange.alwaysApplies ? null : parsedAvailability.dateRange.range?.startDate ?? null;
        const endDate = parsedAvailability.dateRange.alwaysApplies ? null : parsedAvailability.dateRange.range?.endDate ?? null;
        const alwaysAvailable = parsedAvailability.dateRange.alwaysApplies ? 1 : 0;

        const inserted = await tx.insert(weeklyAvailabilities).values({ startDate, endDate, dayOfWeek: day, enabled: enabled ? 1 : 0, alwaysAvailable });
        const weeklyId = insertedId(inserted);
        if (!weeklyId) {
          throw new Error(`Identifiant manquant après l'insertion de la disponibilité (${day}).`);
        }

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
            date: exception.date,
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
