import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

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
  dateRange: {
    alwaysApplies: boolean;
    range: { startDate: Date | null; endDate: Date | null } | null;
  };
  exceptions: { enabled: boolean; dates: Exception[] };
};

type WeeklyRows = RowDataPacket & {
  weekly_id: number;
  start_date: Date;
  end_date: Date;
  day_of_week: string;
  enabled: boolean;
  always_available: boolean;
};
type SpecificRows = RowDataPacket & {
  id: number;
  date: Date;
  start_hour: string;
  start_minute: string;
  end_hour: string;
  end_minute: string;
  is_exception: boolean;
};
type HoursRows = RowDataPacket & {
  id: number;
  weekly_id: number;
  start_hour: string;
  start_minute: string;
  end_hour: string;
  end_minute: string;
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

    const [weeklyRows] = await pool.query<WeeklyRows[]>(
      "SELECT * FROM weekly_availabilities"
    );
    const [specificRows] = await pool.query<SpecificRows[]>(
      "SELECT * FROM specific_dates"
    );
    const [hoursRows] = await pool.query<HoursRows[]>(
      "SELECT * FROM hour_ranges"
    );

    const fetchedAvailability: AvailabilityState = {
      weekly: {},
      dateRange: {
        alwaysApplies: false,
        range: null,
      },
      exceptions: { enabled: false, dates: [] },
    };
    const fetchedSpecificDates: Exception[] = [];

    if (weeklyRows.length <= 0) {
      fetchedAvailability.dateRange = {
        alwaysApplies: false,
        range: null,
      };
    } else if (weeklyRows[0].always_available) {
      fetchedAvailability.dateRange = {
        alwaysApplies: true,
        range: null,
      };
    } else {
      fetchedAvailability.dateRange = {
        alwaysApplies: false,
        range: {
          startDate: weeklyRows[0].start_date,
          endDate: weeklyRows[0].end_date,
        },
      };
    }

    fetchedAvailability.exceptions.enabled =
      specificRows.filter((sr) => sr.is_exception == true).length > 0;

    for (const specificRow of specificRows) {
      if (specificRow.is_exception) {
        fetchedAvailability.exceptions.dates.push({
          date: specificRow.date,
          timeRange: {
            id: specificRow.id,
            startHour: specificRow.start_hour,
            startMinute: specificRow.start_minute,
            endHour: specificRow.end_hour,
            endMinute: specificRow.end_minute,
          },
        });
      } else {
        fetchedSpecificDates.push({
          date: specificRow.date,
          timeRange: {
            id: specificRow.id,
            startHour: specificRow.start_hour,
            startMinute: specificRow.start_minute,
            endHour: specificRow.end_hour,
            endMinute: specificRow.end_minute,
          },
        });
      }
    }

    for (const weeklyRow of weeklyRows) {
      fetchedAvailability.weekly[weeklyRow.day_of_week] = {
        label: weeklyRow.day_of_week,
        enabled: weeklyRow.enabled,
        hoursRanges: [],
      };
      for (const hoursRow of hoursRows.filter(
        (hr) => weeklyRow.weekly_id === hr.weekly_id
      )) {
        fetchedAvailability.weekly[weeklyRow.day_of_week].hoursRanges.push({
          id: hoursRow.range_id,
          startHour: hoursRow.start_hour,
          startMinute: hoursRow.start_minute,
          endHour: hoursRow.end_hour,
          endMinute: hoursRow.end_minute,
        });
      }
    }

    return NextResponse.json({
      availability: fetchedAvailability,
      specificDates: fetchedSpecificDates,
    });
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
          message || "An unknown error occured while fetching availabilities.",
      },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    if (!body.weekly || !body.dateRange || !body.exceptions) {
      return NextResponse.json(
        {
          success: false,
          message: "availabilities object is required.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedAvailability: AvailabilityState = {
      ...body,
      dateRange: {
        alwaysApplies: body.dateRange.alwaysApplies,
        range: body.dateRange.range
          ? {
              startDate: body.dateRange.range.startDate
                ? new Date(body.dateRange.range.startDate)
                : null,
              endDate: body.dateRange.range.endDate
                ? new Date(body.dateRange.range.endDate)
                : null,
            }
          : null,
      },
      exceptions: {
        enabled: body.exceptions.enabled,
        dates: body.exceptions.dates.map((ex: Exception) => ({
          date: new Date(ex.date),
          timeRange: ex.timeRange,
        })),
      },
    };

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("DELETE FROM weekly_availabilities");
      await connection.query(
        "DELETE FROM specific_dates WHERE is_exception = 1"
      );

      for (const [day, { enabled, hoursRanges }] of Object.entries(
        parsedAvailability.weekly
      )) {
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO weekly_availabilities 
          (start_date, end_date, day_of_week, enabled, always_available)
          VALUES (?, ?, ?, ?, ?)`,
          [
            parsedAvailability.dateRange.alwaysApplies
              ? null
              : parsedAvailability.dateRange.range?.startDate
                  ?.toISOString()
                  .slice(0, 10),
            parsedAvailability.dateRange.alwaysApplies
              ? null
              : parsedAvailability.dateRange.range?.endDate
                  ?.toISOString()
                  .slice(0, 10),
            day,
            enabled,
            parsedAvailability.dateRange.alwaysApplies ? 1 : 0,
          ]
        );
        const weeklyId = result.insertId;
        if (enabled) {
          for (const hourRange of hoursRanges) {
            await connection.query(
              `INSERT INTO hour_ranges 
            (weekly_id, start_hour, start_minute, end_hour, end_minute)
            VALUES (?, ?, ?, ?, ?)`,
              [
                weeklyId,
                hourRange.startHour,
                hourRange.startMinute,
                hourRange.endHour,
                hourRange.endMinute,
              ]
            );
          }
        }
      }

      if (parsedAvailability.exceptions.enabled) {
        for (const exception of parsedAvailability.exceptions.dates) {
          await connection.query(
            `INSERT INTO specific_dates 
            (date, start_hour, start_minute, end_hour, end_minute, is_exception)
            VALUES (?, ?, ?, ?, ?, 1)`,
            [
              exception.date.toISOString().slice(0, 10),
              exception.timeRange.startHour,
              exception.timeRange.startMinute,
              exception.timeRange.endHour,
              exception.timeRange.endMinute,
            ]
          );
        }
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Availabilities saved successfully.",
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
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          message || "An unknown error occured while saving availabilities.",
      },
      { status: 500 }
    );
  }
}
