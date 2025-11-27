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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();

    const [stationRows] = await conn.query(
      `
      SELECT 
        id,
        name,
        isActive,
        consoles,
        createdAt
      FROM stations
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const stations = (
      stationRows as {
        id: number;
        name: string;
        isActive: boolean;
        consoles: unknown;
        createdAt: string;
      }[]
    ).map((row) => ({
      ...row,
      consoles: safeParseJSON(row.consoles),
    }));

    const stationWithNames = await Promise.all(
      stations.map(async (station) => {
        let consolesArray: number[] = [];
        try {
          consolesArray = Array.isArray(station.consoles)
            ? station.consoles
            : JSON.parse(station.consoles);
        } catch {}

        let consolesTitles: string[] = [];
        if (consolesArray.length > 0) {
          const [consoleRows] = await conn.query<RowDataPacket[]>(
            `SELECT name FROM console_type WHERE id IN (?)`,
            [consolesArray]
          );
          consolesTitles = (consoleRows as Array<{ name: string }>).map(
            (g) => g.name
          );
        }

        return {
          ...station,
          consoles: consolesTitles,
          consolesId: consolesArray,
        };
      })
    );

    const [countRows] = (await conn.query(`
      SELECT COUNT(*) AS total FROM stations
    `)) as [Array<{ total: number }>, unknown];
    const total = countRows[0].total;

    conn.release();
    return NextResponse.json(
      {
        success: true,
        message: "Stations récupérées avec succès",
        data: {
          stations: stationWithNames,
          total
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur lors de la récupération des stations :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

function safeParseJSON(value: unknown): unknown[] {
  try {
    if (!value) return [];
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    }
    if (Array.isArray(value)) return value;
    return [];
  } catch {
    return [];
  }
}
