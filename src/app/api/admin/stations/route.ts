import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { stations, consoleType } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const stationRows = await db.query.stations.findMany({
      orderBy: (s, { asc }) => [asc(s.id)],
      limit,
      offset,
    });

    const allConsoleIds = new Set<number>();
    for (const station of stationRows) {
      const consolesArr = Array.isArray(station.consoles) ? (station.consoles as number[]) : [];
      consolesArr.forEach((id) => allConsoleIds.add(id));
    }

    const consoleNameMap = new Map<number, string>();
    if (allConsoleIds.size > 0) {
      const consoleRows = await db
        .select({ id: consoleType.id, name: consoleType.name })
        .from(consoleType)
        .where(inArray(consoleType.id, [...allConsoleIds]));
      consoleRows.forEach((c) => consoleNameMap.set(c.id, c.name));
    }

    const stationsWithConsoles = stationRows.map((station) => {
      const consolesId = Array.isArray(station.consoles) ? (station.consoles as number[]) : [];
      const consolesNames = consolesId.map((id) => consoleNameMap.get(id) ?? "").filter(Boolean);
      return {
        ...station,
        consoles: consolesNames,
        consolesId,
      };
    });

    const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(stations);

    return NextResponse.json({
      success: true,
      message: "Stations récupérées avec succès",
      data: { stations: stationsWithConsoles, total },
    }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la récupération des stations :", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
