import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Reservation ID is required" 
        },
        { status: 400 }
      );
    }

    // Récupérer les données complètes de la réservation
    const [reservations]: any = await pool.query(
      `SELECT 
        rh.id as reservationId,
        rh.user_id as userId,
        rh.console_id as consoleId,
        rh.game1_id as game1Id,
        rh.game2_id as game2Id,
        rh.game3_id as game3Id,
        rh.station_id as stationId,
        rh.accessoir_id as accessoirId,
        rh.date,
        rh.expireAt,
        rh.createdAt,
        c.name as consoleName,
        c.picture as consoleImage
      FROM reservation_hold rh
      LEFT JOIN consoles c ON rh.console_id = c.id
      WHERE rh.id = ?`,
      [reservationId]
    );

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Réservation non trouvée" 
        },
        { status: 404 }
      );
    }

    const reservation = reservations[0];

    // Récupérer les détails des jeux
    const gameIds = [
      reservation.game1Id,
      reservation.game2Id,
      reservation.game3Id
    ].filter(id => id != null);

    let jeux = [];
    if (gameIds.length > 0) {
      const [games]: any = await pool.query(
        `SELECT id, titre, picture, author FROM games 
         WHERE id IN (${gameIds.map(() => '?').join(',')})`,
        gameIds
      );
      
      jeux = games.map((g: any) => ({
        id: g.id,
        nom: g.titre,
        picture: g.picture,
        author: g.author
      }));
    }

    // Récupérer les détails de la station si applicable
    let station = null;
    if (reservation.stationId) {
      const [stations]: any = await pool.query(
        `SELECT id, name FROM stations WHERE id = ?`,
        [reservation.stationId]
      );
      if (stations && stations.length > 0) {
        station = {
          id: stations[0].id,
          nom: stations[0].name
        };
      }
    }

    // Récupérer les accessoires si applicable
    let accessoires: { id: any; nom: any; }[] = [];
    if (reservation.accessoirId) {
      const [accessoiresData]: any = await pool.query(
        `SELECT id, name FROM accessoires WHERE id = ?`,
        [reservation.accessoirId]
      );
      if (accessoiresData && accessoiresData.length > 0) {
        accessoires = [{
          id: accessoiresData[0].id,
          nom: accessoiresData[0].name
        }];
      }
    }

    // Formater la date et l'heure
    const dateReservation = reservation.date ? new Date(reservation.date) : null;
    const dateFormatted = dateReservation 
      ? dateReservation.toLocaleDateString('fr-CA')
      : null;
    const heureFormatted = dateReservation
      ? dateReservation.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
      : null;

    // Construire la réponse
    interface Jeu {
      id: number;
      nom: string;
      picture: string;
      author: string;
    }

    interface ConsoleInfo {
      id: number;
      nom: string;
      image: string;
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
      cours: string;
      date: string | null;
      heure: string | null;
      expireAt: string;
      userId: number;
    }

    const response: ReservationResponse = {
      success: true,
      reservationId: reservation.reservationId,
      jeux: jeux,
      console: reservation.consoleId ? {
      id: reservation.consoleId,
      nom: reservation.consoleName || "Console",
      image: reservation.consoleImage
      } : null,
      accessoires: accessoires,
      station: station,
      cours: "", // À adapter selon votre logique
      date: dateFormatted,
      heure: heureFormatted,
      expireAt: reservation.expireAt,
      userId: reservation.userId
    };

    return NextResponse.json(response);

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