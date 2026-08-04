import { NextResponse } from "next/server";
import db from "@/db";
import { consoleCatalog } from "@/db/schema";
import { gt } from "drizzle-orm";

export interface ConsoleCatalogItem {
  id: number;
  name: string;
  picture: string;
  active_units: number;
  total_units: number;
}

export async function GET() {
  try {
    const consoles = await db
      .select({
        id: consoleCatalog.consoleTypeId,
        name: consoleCatalog.name,
        picture: consoleCatalog.picture,
        active_units: consoleCatalog.activeUnits,
        total_units: consoleCatalog.totalUnits,
      })
      .from(consoleCatalog)
      .where(gt(consoleCatalog.activeUnits, "0"))
      .orderBy(consoleCatalog.name);

    return NextResponse.json(consoles);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
