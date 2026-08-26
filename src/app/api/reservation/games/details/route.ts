import { NextResponse } from "next/server";
import db from "@/db";
import { inArray } from "drizzle-orm";
import { games } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (req) => {
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

    // L'ordre demandé fait foi : il correspond à l'ordre de sélection du
    // joueur, qui est enregistré tel quel dans game1/game2/game3 du hold.
    const byId = new Map(rows.map((row) => [Number(row.id), row]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row !== undefined);

    return NextResponse.json(ordered, { status: 200 });
  } catch (err) {
    console.error("Erreur API game details:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
});
