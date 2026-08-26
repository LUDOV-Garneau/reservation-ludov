import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { games, stations, accessoires, reservationHold, consoleStock, consoleType, cours as coursTable } from "@/db/schema";
import { and, inArray, eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!user?.id || !Number.isFinite(Number(user.id))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);

    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("id");
    if (!reservationId) {
      return NextResponse.json({ success: false, message: "Reservation ID is required" }, { status: 400 });
    }

    const [r] = await db
      .select({
        reservationId: reservationHold.id,
        userId: reservationHold.userId,
        consoleStockId: reservationHold.consoleId,
        consoleTypeId: consoleStock.consoleTypeId,
        game1Id: reservationHold.game1Id,
        game2Id: reservationHold.game2Id,
        game3Id: reservationHold.game3Id,
        stationId: reservationHold.stationId,
        accessoirs: reservationHold.accessoirs,
        date: reservationHold.date,
        time: reservationHold.time,
        expireAt: reservationHold.expireAt,
        createdAt: reservationHold.createdAt,
        consoleName: consoleType.name,
        consoleImage: consoleType.picture,
        expiresIn: sql<number>`GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), ${reservationHold.expireAt}))`,
        coursId: coursTable.id,
        codeCours: coursTable.codeCours,
        nomCours: coursTable.nomCours,
      })
      .from(reservationHold)
      .leftJoin(consoleStock, eq(reservationHold.consoleId, consoleStock.id))
      .leftJoin(consoleType, eq(consoleStock.consoleTypeId, consoleType.id))
      .leftJoin(coursTable, eq(reservationHold.cours, coursTable.id))
      .where(and(eq(reservationHold.id, reservationId), eq(reservationHold.userId, userId)))
      .limit(1);

    if (!r) {
      return NextResponse.json({ success: false, message: "Réservation non trouvée" }, { status: 404 });
    }
    if (Number(r.expiresIn) <= 0) {
      return NextResponse.json({ success: false, message: "La réservation a expiré" }, { status: 410 });
    }

    const gameIds = [r.game1Id, r.game2Id, r.game3Id].filter((id): id is number => id !== null);
    let jeux: { id: number; nom: string; picture: string; author: string }[] = [];
    if (gameIds.length > 0) {
      const gameRows = await db
        .select({ id: games.id, titre: games.titre, picture: games.picture, author: games.author })
        .from(games)
        .where(inArray(games.id, gameIds));
      // Même ordre que game1/game2/game3, c'est-à-dire l'ordre de sélection
      // affiché à l'étape des jeux.
      const gamesById = new Map(gameRows.map((g) => [Number(g.id), g]));
      jeux = gameIds
        .map((id) => gamesById.get(id))
        .filter((g): g is (typeof gameRows)[number] => g !== undefined)
        .map((g) => ({ id: g.id, nom: g.titre, picture: g.picture ?? "", author: g.author ?? "" }));
    }

    let station: { id: number; nom: string } | null = null;
    if (r.stationId !== null) {
      const stationRow = await db.query.stations.findFirst({
        columns: { id: true, name: true },
        where: eq(stations.id, r.stationId),
      });
      if (stationRow) station = { id: stationRow.id, nom: stationRow.name ?? "" };
    }

    let accessories: { id: number; nom: string }[] = [];
    const accIds: number[] = Array.isArray(r.accessoirs)
      ? (r.accessoirs as number[]).filter((x) => typeof x === "number")
      : [];
    if (accIds.length > 0) {
      const accRows = await db
        .select({ id: accessoires.id, name: accessoires.name })
        .from(accessoires)
        .where(inArray(accessoires.id, accIds));
      accessories = accRows.map((a) => ({ id: a.id, nom: a.name }));
    }

    const consoleInfo = r.consoleStockId
      ? { id: r.consoleStockId, nom: r.consoleName ?? "Console", image: r.consoleImage }
      : null;

    const cours = r.coursId !== null && r.codeCours && r.nomCours
      ? { id: r.coursId, code_cours: r.codeCours, nom_cours: r.nomCours }
      : null;

    return NextResponse.json({
      success: true,
      reservationId: r.reservationId,
      userId: r.userId,
      console: consoleInfo,
      jeux,
      accessoires: accessories,
      station,
      cours,
      date: r.date,
      time: r.time,
      expireAt: r.expireAt,
      expiresIn: Number(r.expiresIn),
    });
  } catch (err) {
    console.error("GET reservation error:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
