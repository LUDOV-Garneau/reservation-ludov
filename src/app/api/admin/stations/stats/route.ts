import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2/promise";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    const conn = await pool.getConnection();

    // Fetch count stations active
    const [activeStationsRows] = await conn.query(
      `
        SELECT COUNT(*) AS activeCount
        FROM stations
      `
    );
    const activeStationsCount = (activeStationsRows as RowDataPacket[])[0]
      .activeCount;

    // Fetch station créée récemment
    const [recentStationRows] = await conn.query(
      `
        SELECT *
        FROM stations
        ORDER BY createdAt DESC
        LIMIT 1
      `
    );
    const recentStation = (recentStationRows as RowDataPacket[])[0];

    // Fetch station avec le plus de reservation
    const [mostUsedStation] = await conn.query(
      `
        SELECT s.id, s.name, COUNT(r.id) AS reservationsCount
        FROM stations s
        LEFT JOIN reservations r ON r.station = s.id AND (r.archived IS NULL OR r.archived = 0)
        GROUP BY s.id, s.name
        ORDER BY reservationsCount DESC
        LIMIT 1
      `
    );

    const mostUsed = (mostUsedStation as RowDataPacket[])[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          activeStationsCount,
          recentStation,
          mostUsed
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
