import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

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
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Missing date parameter" },
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

    const [reservedRows] = await pool.query<RowDataPacket[]>(
      `SELECT date, time 
       FROM reservation 
       WHERE date = ?`,
      [date]
    );

    const reservedSlots = reservedRows.map((row) => {
      const startTime = row.time;
      const [hours, minutes] = startTime.split(":").map(Number);
      const endMinutes = hours * 60 + minutes + 120;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}:00`;
      
      return { start: startTime, end: endTime };
    });

    const openingHour = 8;
    const closingHour = 18;
    const slots: { start: string; end: string }[] = [];

    for (let hour = openingHour; hour <= closingHour - 2; hour++) {
      const start = `${hour.toString().padStart(2, "0")}:00:00`;
      const end = `${(hour + 2).toString().padStart(2, "0")}:00:00`;
      slots.push({ start, end });
    }

    let availableSlots = slots.filter(
      (slot) =>
        !reservedSlots.some((reserved) =>
          overlaps(slot.start, slot.end, reserved.start, reserved.end)
        )
    );

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    if (date === todayStr) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      availableSlots = availableSlots.filter((slot) => {
        const [slotHour, slotMinute] = slot.start.split(":").map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;
        
        return slotTimeInMinutes > currentTimeInMinutes + 30;
      });
    }

    const availableTimes = availableSlots.map((slot) => slot.start);

    return NextResponse.json({
      success: true,
      date,
      availableTimes,
      totalSlots: slots.length,
      reservedCount: reservedSlots.length,
      availableCount: availableSlots.length,
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