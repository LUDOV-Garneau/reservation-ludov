import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { inArray } from "drizzle-orm";
import { games } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: false, message: "ids param is required" }, { status: 400 });
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: "No valid game IDs provided" }, { status: 400 });
    }

    const rows = await db.select({
      id: games.id,
      titre: games.titre,
      picture: games.picture,
      biblio_id: games.biblioId,
      author: games.author,
    })
    .from(games)
    .where(inArray(games.id, ids));

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("Erreur API game details:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
