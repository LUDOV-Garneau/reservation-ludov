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
  expireAt: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const reservationId = request.nextUrl.searchParams.get("id");
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");

    // Verify user authentication
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) {
        user = verifyToken(token);
      }
    } catch (error) {
      console.error("Token verification error:", error);
    }

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

    // Fetch reservation from database
    const [reservationRows] = await pool.query<ReservationRow[]>(
      "SELECT * FROM reservation_hold WHERE id = ?",
      [reservationId]
    );

    if (!Array.isArray(reservationRows) || reservationRows.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          status: 'not_found',
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

    // Check if reservation has expired
    const now = new Date();
    const expiry = new Date(reservation.expireAt);
    
    if (expiry <= now) {
      // Auto-clean expired reservation
      await pool.query(
        "DELETE FROM reservation_hold WHERE id = ?",
        [reservationId]
      );
      
      // Restore console availability
      await pool.query(
        "UPDATE consoles SET nombre = nombre + 1 WHERE id = ?",
        [reservation.console_id]
      );

      return NextResponse.json(
        { 
          success: false,
          status: 'expired',
          message: "Reservation has expired"
        },
        { status: 410 }
      );
    }

    // Collect game IDs
    const gameIds = [
      reservation.game1_id,
      reservation.game2_id,
      reservation.game3_id
    ].filter(id => id !== null);

    // Determine current step based on available data
    let currentStep = 1;
    if (reservation.console_id) {
      currentStep = gameIds.length > 0 ? 2 : 1;
    }

    // Return active reservation data
    const responseData = {
      success: true,
      status: 'active',
      reservationId: reservation.id,
      userId: reservation.user_id,
      consoleId: reservation.console_id,
      games: gameIds,
      expiresAt: expiry.toISOString(),
      createdAt: new Date(reservation.createdAt).toISOString(),
      currentStep: currentStep
    };

    console.log('Active reservation retrieved successfully:', {
      reservationId: responseData.reservationId,
      userId: responseData.userId,
      currentStep: responseData.currentStep,
      expiresAt: responseData.expiresAt
    });

    return NextResponse.json(responseData, { status: 200 });

  } catch (err: unknown) {
    console.error("Error fetching active reservation:", err);
    return NextResponse.json(
      { 
        success: false,
        message: "Error fetching reservation",
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}