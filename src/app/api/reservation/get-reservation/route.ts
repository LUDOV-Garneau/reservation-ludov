import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

// ---------------- Types DB ----------------
interface ReservationRow extends RowDataPacket {
  reservationId: number;
  userId: number;
  consoleStockId: number | null;
  consoleTypeId: number | null;
  game1Id: number | null;
  game2Id: number | null;
  game3Id: number | null;
  stationId: number | null;
  accessoirs: string | null;
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

interface GameRow extends RowDataPacket {
  id: number;
  titre: string;
  picture: string;
  author: string;
}

interface StationRow extends RowDataPacket {
  id: number;
  name: string;
}

interface AccessoireRow extends RowDataPacket {
  id: number;
  name: string;
}

// ---------------- API Types ----------------

interface JwtSession {
  id: number;
  email: string;
}

interface Jeu {
  id: number;
  nom: string;
  picture: string;
  author: string;
}

interface ConsoleInfo {
  id: number;
  nom: string;
  image: string | null;
}

interface CoursInfo {
  id: number;
  code_cours: string;
  nom_cours: string;
}

interface Accessoire {
  id: number;
  nom: string;
}

interface Station {
  id: number;
  nom: string;
}

// --------------------------------------------------

export async function GET(req: Request) {
  try {
    // ------- Auth -------
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!user?.id || !Number.isFinite(Number(user.id))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = Number(user.id);

    // ------- Params -------
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("id");

    if (!reservationId) {
      return NextResponse.json({ success: false, message: "Reservation ID is required" }, { status: 400 });
    }

    // ------- Fetch reservation -------
    const [rows] = await pool.query<ReservationRow[]>(
      `
      SELECT 
        rh.id AS reservationId,
        rh.user_id AS userId,
        rh.console_id AS consoleStockId,
        cs.console_type_id AS consoleTypeId,
        rh.game1_id AS game1Id,
        rh.game2_id AS game2Id,
        rh.game3_id AS game3Id,
        rh.station_id AS stationId,
        rh.accessoirs AS accessoirs,
        rh.date,
        rh.time,
        rh.expireAt,
        rh.createdAt,
        ct.name AS consoleName,
        ct.picture AS consoleImage,
        GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), rh.expireAt)) AS expiresIn,
        co.id AS coursId,
        co.code_cours AS code_cours,
        co.nom_cours AS nom_cours
      FROM reservation_hold rh
      LEFT JOIN console_stock cs ON rh.console_id = cs.id
      LEFT JOIN console_type ct ON cs.console_type_id = ct.id
      LEFT JOIN cours co ON rh.cours = co.id
      WHERE rh.id = ? AND rh.user_id = ?
      LIMIT 1
      `,
      [reservationId, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: "Réservation non trouvée" }, { status: 404 });
    }

    const r = rows[0];

    if (r.expiresIn <= 0) {
      return NextResponse.json({ success: false, message: "La réservation a expiré" }, { status: 410 });
    }

    // ------- Load games -------
    const gameIds = [r.game1Id, r.game2Id, r.game3Id].filter((id): id is number => id !== null);
    let jeux: Jeu[] = [];

    if (gameIds.length > 0) {
      const [gameRows] = await pool.query<GameRow[]>(
        `SELECT id, titre, picture, author FROM games WHERE id IN (${gameIds.map(() => "?").join(",")})`,
        gameIds
      );

      jeux = gameRows.map((g) => ({
        id: g.id,
        nom: g.titre,
        picture: g.picture,
        author: g.author,
      }));
    }

    // ------- Station -------
    let station: Station | null = null;
    if (r.stationId !== null) {
      const [stationRows] = await pool.query<StationRow[]>(
        `SELECT id, name FROM stations WHERE id = ?`,
        [r.stationId]
      );

      if (stationRows.length > 0) {
        station = { id: stationRows[0].id, nom: stationRows[0].name };
      }
    }

    // ------- Accessoires -------
    let accessories: Accessoire[] = [];
    let accIds: number[] = [];

    if (r.accessoirs) {
      try {
        const parsed = JSON.parse(r.accessoirs);
        if (Array.isArray(parsed)) {
          accIds = parsed.filter((item) => typeof item === "number");
        }
      } catch (_) {
        accIds = [];
      }
    }

    if (accIds.length > 0) {
      const [accRows] = await pool.query<AccessoireRow[]>(
        `SELECT id, name FROM accessoires WHERE id IN (${accIds.map(() => "?").join(",")})`,
        accIds
      );

      accessories = accRows.map((a) => ({ id: a.id, nom: a.name }));
    }

    // ------- Response -------
    const consoleInfo: ConsoleInfo | null = r.consoleStockId
      ? { id: r.consoleStockId, nom: r.consoleName ?? "Console", image: r.consoleImage }
      : null;

    const cours: CoursInfo | null =
      r.coursId !== null && r.code_cours && r.nom_cours
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
      expiresIn: r.expiresIn, // ← timer front
    });
  } catch (err) {
    console.error("GET reservation error:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
