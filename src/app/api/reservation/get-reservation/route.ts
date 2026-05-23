import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { games, stations, accessoires } from "@/db/schema";
import { inArray, eq, sql } from "drizzle-orm";

interface ReservationRow {
  reservationId: string;
  userId: number;
  consoleStockId: number | null;
  consoleTypeId: number | null;
  game1Id: number | null;
  game2Id: number | null;
  game3Id: number | null;
  stationId: number | null;
  accessoirs: unknown;
  date: string | null;
  time: string | null;
  expireAt: string;
  createdAt: string;
  consoleName: string | null;
  consoleImage: string | null;
  expiresIn: number;
  coursId: number | null;
  code_cours: string | null;
  nom_cours: string | null;
}

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

    const rows = await db.execute<ReservationRow>(
      sql`SELECT
        rh.id AS reservationId,
        rh.user_id AS userId,
        rh.console_id AS consoleStockId,
        cs.console_type_id AS consoleTypeId,
        rh.game1_id AS game1Id,
        rh.game2_id AS game2Id,
        rh.game3_id AS game3Id,
        rh.station_id AS stationId,
        rh.accessoirs,
        rh.date,
        rh.time,
        rh.expireAt,
        rh.createdAt,
        ct.name AS consoleName,
        ct.picture AS consoleImage,
        GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), rh.expireAt)) AS expiresIn,
        co.id AS coursId,
        co.code_cours,
        co.nom_cours
      FROM reservation_hold rh
      LEFT JOIN console_stock cs ON rh.console_id = cs.id
      LEFT JOIN console_type ct ON cs.console_type_id = ct.id
      LEFT JOIN cours co ON rh.cours = co.id
      WHERE rh.id = ${reservationId} AND rh.user_id = ${userId}
      LIMIT 1`
    );

    const r = (rows as ReservationRow[])[0];
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
      jeux = gameRows.map((g) => ({ id: g.id, nom: g.titre, picture: g.picture ?? "", author: g.author ?? "" }));
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

    const cours = r.coursId !== null && r.code_cours && r.nom_cours
      ? { id: r.coursId, code_cours: r.code_cours, nom_cours: r.nom_cours }
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
