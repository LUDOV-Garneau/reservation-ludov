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

    const [stationRows] = await conn.query(
      `
      SELECT 
        id,
        name,
        consoles,
        createdAt
      FROM stations
      ORDER BY createdAt DESC
    `
    );

    const stations = (
      stationRows as {
        id: number;
        name: string;
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
            `SELECT name FROM console_stock WHERE id IN (?)`,
            [consolesArray]
          );
          consolesTitles = (consoleRows as Array<{ name: string }>).map(
            (g) => g.name
          );
        }

        return {
          ...station,
          consoles: consolesTitles,
        };
      })
    );
    conn.release();
    return NextResponse.json(
      {
        success: true,
        message: "Stations récupérées avec succès",
        data: stationWithNames,
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
