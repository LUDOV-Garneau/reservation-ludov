import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type Exception = { date: Date; timeRange: HourRange };

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Exception[];

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message: "specificDates object is required.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedSpecificDates: Exception[] = body.map((sd) => ({
      date: new Date(sd.date),
      timeRange: sd.timeRange,
    }));

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "DELETE FROM specific_dates WHERE is_exception = 0"
      );

      for (const specificDate of parsedSpecificDates) {
        await connection.query(
          `INSERT INTO specific_dates 
          (date, start_hour, start_minute, end_hour, end_minute, is_exception)
          VALUES (?, ?, ?, ?, ?, 0)`,
          [
            specificDate.date.toISOString().slice(0, 10),
            specificDate.timeRange.startHour,
            specificDate.timeRange.startMinute,
            specificDate.timeRange.endHour,
            specificDate.timeRange.endMinute,
          ]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Specific dates saved successfully.",
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    let message = "Unknown Error";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("Erreur:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          message || "An unknown error occured while saving specific dates.",
      },
      { status: 500 }
    );
  }
}
