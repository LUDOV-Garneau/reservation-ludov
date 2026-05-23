import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { stations } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, consoles } = body;

    if (!name || name.trim() === "") return NextResponse.json({ error: "Le champ nom est requis." }, { status: 400 });
    if (!consoles || !Array.isArray(consoles) || consoles.length === 0) {
      return NextResponse.json({ error: "Le champ consoles est requis." }, { status: 400 });
    }

    const existing = await db.query.stations.findFirst({
      columns: { id: true },
      where: (t) => sql`LOWER(${t.name}) = LOWER(${name.trim()})`,
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Une station avec ce nom existe déjà." }, { status: 409 });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db.insert(stations).values({
      name,
      consoles,
      lastUpdatedAt: now,
      createdAt: now,
    });

    return NextResponse.json({ success: true, message: "Station ajoutée avec succès." }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
