import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { specificDates } from "@/db/schema";
import { eq } from "drizzle-orm";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type Exception = { date: string; timeRange: HourRange };

/**
 * Jour calendaire « YYYY-MM-DD » envoyé par le client. Un ancien client peut
 * encore envoyer un ISO complet (« 2026-10-05T04:00:00.000Z ») : on garde le
 * jour tel quel, sans conversion de fuseau, sinon le 5 octobre devenait le 4.
 */
function toYmd(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const ymd = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as Exception[];
    if (!body) {
      return NextResponse.json({ success: false, message: "specificDates object is required." }, { status: 400 });
    }

    const parsedSpecificDates: Exception[] = [];
    for (const sd of body) {
      const date = toYmd(sd.date);
      if (!date) {
        return NextResponse.json({ success: false, message: "Date invalide (format attendu : YYYY-MM-DD)." }, { status: 400 });
      }
      parsedSpecificDates.push({ date, timeRange: sd.timeRange });
    }

    await db.transaction(async (tx) => {
      await tx.delete(specificDates).where(eq(specificDates.isException, 0));
      for (const sd of parsedSpecificDates) {
        await tx.insert(specificDates).values({
          date: sd.date,
          startHour: sd.timeRange.startHour,
          startMinute: sd.timeRange.startMinute,
          endHour: sd.timeRange.endHour,
          endMinute: sd.timeRange.endMinute,
          isException: 0,
        });
      }
    });

    return NextResponse.json({ success: true, message: "Specific dates saved successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    console.error("Erreur:", err);
    return NextResponse.json({
      success: false,
      message: message || "An unknown error occured while saving specific dates.",
    }, { status: 500 });
  }
}
