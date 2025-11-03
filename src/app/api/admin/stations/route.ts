import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

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

    const [rows] = await pool.query(
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

    const stations = (rows as { id: number; name: string; consoles: unknown; createdAt: string }[]).map((row) => ({
      ...row,
      consoles: safeParseJSON(row.consoles),
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Stations récupérées avec succès",
        data: stations,
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
