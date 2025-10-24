import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Cours } from "@/types/cours";

// ---------------------
// Interfaces DB
// ---------------------
interface ReservationRow extends RowDataPacket {
  reservationId: number;
  userId: number;
  consoleId: number | null;
  game1Id: number | null;
  game2Id: number | null;
  game3Id: number | null;
  stationId: number | null;
  accessoirs: number[] | null;
  date: Date | null;
  time: string | null;
  cours: number | null;
  expireAt: string;
  createdAt: string;
  consoleName: string | null;
  consoleImage: string | null;
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

// ---------------------
// Interfaces API
// ---------------------
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

interface Accessoire {
  id: number;
  nom: string;
}

interface Station {
  id: number;
  nom: string;
}

interface ReservationResponse {
  success: boolean;
  reservationId: number;
  jeux: Jeu[];
  console: ConsoleInfo | null;
  accessoires: Accessoire[];
  station: Station | null;
  cours: Cours;
  date: Date | null;
  time: string | null;
  expireAt: string;
  userId: number;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("id");

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation ID is required",
        },
        { status: 400 }
      );
    }

    // ---------------------
    // Récupération réservation
    // ---------------------
    const [reservations] = await pool.query<ReservationRow[]>(
      `SELECT 
        rh.id as reservationId,
        rh.user_id as userId,
        rh.console_id as consoleId,
        rh.game1_id as game1Id,
        rh.game2_id as game2Id,
        rh.game3_id as game3Id,
        rh.station_id as stationId,
        rh.accessoirs as accessoirs,
        rh.date,
        rh.time,
        rh.expireAt,
        rh.createdAt,
        c.name as consoleName,
        c.picture as consoleImage
      FROM reservation_hold rh
      LEFT JOIN console_stock c ON rh.console_id = c.id
      WHERE rh.id = ?`,
      [reservationId]
    );

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Réservation non trouvée",
        },
        { status: 404 }
      );
    }

    const reservation = reservations[0];

    // ---------------------
    // Jeux
    // ---------------------
    const gameIds = [reservation.game1Id, reservation.game2Id, reservation.game3Id].filter(
      (id): id is number => id !== null
    );

    let jeux: Jeu[] = [];
    if (gameIds.length > 0) {
      const [games] = await pool.query<GameRow[]>(
        `SELECT id, titre, picture, author FROM games 
         WHERE id IN (${gameIds.map(() => "?").join(",")})`,
        gameIds
      );

      jeux = games.map((g) => ({
        id: g.id,
        nom: g.titre,
        picture: g.picture,
        author: g.author,
      }));
    }

    // ---------------------
    // Station
    // ---------------------
    let station: Station | null = null;
    if (reservation.stationId) {
      const [stations] = await pool.query<StationRow[]>(
        `SELECT id, name FROM stations WHERE id = ?`,
        [reservation.stationId]
      );
      if (stations.length > 0) {
        station = {
          id: stations[0].id,
          nom: stations[0].name,
        };
      }
    }

    // ---------------------
    // Accessoires
    // ---------------------
    const accessoires: Accessoire[] = [];
    if (reservation.accessoirs && reservation.accessoirs.length > 0) {
      for (const accessoirId of reservation.accessoirs) {
        const [accessoiresData] = await pool.query<AccessoireRow[]>(
          `SELECT id, name FROM accessoires WHERE id = ?`,
          [accessoirId]
        );
        if (accessoiresData.length > 0) {
          accessoires.push({
            id: accessoiresData[0].id,
            nom: accessoiresData[0].name,
          });
        }
      }
    }

    // ---------------------
    // Format date
    // ---------------------
    const dateReservation = reservation.date ? new Date(reservation.date) : null;
    const heureFormatted = dateReservation
      ? dateReservation.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
      : null;

    // Vérifier l'expiration de la réservation
    if (reservation.expireAt && new Date(reservation.expireAt) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "La réservation a expiré"
        },
        { status: 410 }
      );
    }
    // ---------------------
    // Réponse finale
    // ---------------------
    const response: ReservationResponse = {
      success: true,
      reservationId: reservation.reservationId,
      jeux,
      console: reservation.consoleId
        ? {
            id: reservation.consoleId,
            nom: reservation.consoleName || "Console",
            image: reservation.consoleImage,
          }
        : null,
      accessoires,
      station,
      cours: reservation.cours
        ? {
            id: reservation.cours,
            nom_cours: reservation.coursNom,
            code_cours: reservation.coursCode,
          }
        : { id: 0, nom_cours: "", code_cours: "" },
      date: reservation.date,
      time: reservation.time,
      expireAt: reservation.expireAt,
      userId: reservation.userId,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération de la réservation",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
