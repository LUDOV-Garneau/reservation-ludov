import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date)
    return NextResponse.json({ error: "Missing date param" }, { status: 400 });

  const [reservedRows] = await pool.query(
    "SELECT date as start_time FROM reservations WHERE DATE(date) = ?",
    [date]
  );

  const reservedSlots = (reservedRows as { start_time: Date }[]).map((row) => {
    const startTime = row.start_time.toTimeString().slice(0, 5);
    const endDate = new Date(row.start_time.getTime() + 2 * 60 * 60 * 1000);
    const endTime = endDate.toTimeString().slice(0, 5);
    return { start: startTime, end: endTime };
  });

  const openingHour = 8;
  const closingHour = 18;
  const slots: { start: string; end: string }[] = [];

  for (let hour = openingHour; hour <= closingHour - 2; hour++) {
    const start = `${hour.toString().padStart(2, "0")}:00`;
    const end = `${(hour + 2).toString().padStart(2, "0")}:00`;
    slots.push({ start, end });
  }

  const availableSlots = slots.filter(
    (slot) =>
      !reservedSlots.some((reserved) =>
        overlaps(slot.start, slot.end, reserved.start, reserved.end)
      )
  );

  const availableTimes = availableSlots.map((slot) => slot.start);

  return NextResponse.json({ availableTimes });
}
