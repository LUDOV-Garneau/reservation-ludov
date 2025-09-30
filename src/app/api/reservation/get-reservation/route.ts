import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";

interface ReservationRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  station_id: number | null;
  accessoir_id: number | null;
  expireAt: string;
  date: string | null;
  createdAt: string;
}

interface GameRow extends RowDataPacket {
  id: number;
  nom: string;
}

interface ConsoleRow extends RowDataPacket {
  id: number;
  nom: string;
}

interface AccessoireRow extends RowDataPacket {
  id: number;
  nom: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get reservationId from query params
    const reservationId = request.nextUrl.searchParams.get("id") || 
                         request.nextUrl.searchParams.get("reservationId");
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");

    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token != undefined) {
        user = verifyToken(token);
      }
    } catch (error) {
      console.error("Token verification error:", error);
    }

    // Validate inputs
    if (!reservationId) {
      return NextResponse.json(
        { 
          success: false,
          message: "reservationId is required"
        },
        { status: 400 }
      );
    }

    if (!user || !user.id) {
      return NextResponse.json(
        { 
          success: false,
          message: "User not authenticated"
        },
        { status: 401 }
      );
    }

    // Fetch reservation from reservation_hold table
    const [reservationRows] = await pool.query<ReservationRow[]>(
      "SELECT * FROM reservation_hold WHERE id = ?",
      [reservationId]
    );

    if (!Array.isArray(reservationRows) || reservationRows.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Reservation not found"
        },
        { status: 404 }
      );
    }

    const reservation = reservationRows[0];

    // Verify that the reservation belongs to the authenticated user
    if (reservation.user_id !== Number(user.id)) {
      return NextResponse.json(
        { 
          success: false,
          message: "Unauthorized access to this reservation"
        },
        { status: 403 }
      );
    }

    // Fetch games based on game1_id, game2_id, game3_id
    const gameIds = [
      reservation.game1_id,
      reservation.game2_id,
      reservation.game3_id
    ].filter(id => id !== null);

    let games: GameRow[] = [];
    if (gameIds.length > 0) {
      try {
        const placeholders = gameIds.map(() => '?').join(',');
        // Try common column names: nom, name, titre, title
        const [gameRows] = await pool.query<GameRow[]>(
          `SELECT * FROM jeux WHERE id IN (${placeholders})`,
          gameIds
        );
        games = gameRows;
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    }

    // Fetch console information
    let consoleRows: ConsoleRow[] = [];
    try {
      const [rows] = await pool.query<ConsoleRow[]>(
        "SELECT * FROM consoles WHERE id = ?",
        [reservation.console_id]
      );
      consoleRows = rows;
    } catch (error) {
      console.error('Error fetching console:', error);
    }

    // Fetch accessory if exists
    let accessoires: AccessoireRow[] = [];
    if (reservation.accessoir_id) {
      try {
        const [accessoireRows] = await pool.query<AccessoireRow[]>(
          "SELECT * FROM accessoires WHERE id = ?",
          [reservation.accessoir_id]
        );
        accessoires = accessoireRows;
      } catch (error) {
        console.error('Error fetching accessory:', error);
      }
    }

    // Format the response to match what the frontend expects
    // Auto-detect the name column from the fetched data
    const getNameField = (obj: any): string => {
      return obj?.nom || obj?.name || obj?.titre || obj?.title || obj?.label || 'Unknown';
    };

    const responseData = {
      jeux: games.map(game => ({ nom: getNameField(game) })),
      console: consoleRows.length > 0 ? {
        id: consoleRows[0].id,
        nom: getNameField(consoleRows[0])
      } : null,
      accessoires: accessoires.map(acc => ({ nom: getNameField(acc) })),
      cours: "", // Not used in hold reservations
      date: reservation.date || "",
      heure: "", // Not stored separately in reservation_hold
      status: "hold",
      reservationId: reservation.id,
      expiresAt: reservation.expireAt,
      stationId: reservation.station_id
    };

    console.log('Reservation data retrieved:', responseData);

    return NextResponse.json(responseData, { status: 200 });

  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      { 
        success: false,
        message: "Erreur lors de la récupération de la réservation",
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}