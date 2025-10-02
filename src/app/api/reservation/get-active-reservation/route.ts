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
  accessoir_id: number | null; // 👈 ajouté
  expireAt: string;
  createdAt: string;

  // champs console
  console_name: string;
  console_nombre: number;
  console_image: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const reservationId = request.nextUrl.searchParams.get("id");
    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "reservationId is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;

    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch (error) {
      console.error("Token verification error:", error);
    }

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Récupère la réservation + console associée
    const [rows] = await pool.query<ReservationRow[]>(
      `SELECT r.*, c.name as console_name, c.nombre as console_nombre, c.picture as console_image
       FROM reservation_hold r
       JOIN consoles c ON r.console_id = c.id
       WHERE r.id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, status: "not_found", message: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservation = rows[0];

    if (reservation.user_id !== Number(user.id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this reservation" },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiry = new Date(reservation.expireAt);

    if (expiry <= now) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query("DELETE FROM reservation_hold WHERE id = ?", [reservationId]);
        await conn.query("UPDATE consoles SET nombre = nombre + 1 WHERE id = ?", [reservation.console_id]);
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return NextResponse.json(
        { success: false, status: "expired", message: "Reservation has expired" },
        { status: 410 }
      );
    }

    const gameIds = [reservation.game1_id, reservation.game2_id, reservation.game3_id].filter(Boolean);
    const accessories = reservation.accessoir_id ? [reservation.accessoir_id] : []; // 👈 ici

    let currentStep = 1;
    if (reservation.console_id) currentStep = 2;
    if (gameIds.length > 0) currentStep = 3;
    if (accessories.length > 0) currentStep = 4; // 👈 on ajoute étape accessoires

    const responseData = {
      success: true,
      status: "active",
      reservationId: reservation.id,
      userId: reservation.user_id,
      console: {
        id: reservation.console_id,
        name: reservation.console_name,
        nombre: reservation.console_nombre,
        image: reservation.console_image || "/placeholder_consoles.jpg",
      },
      games: gameIds,
      accessories, // 👈 renvoie les accessoires choisis
      expiresAt: expiry.toISOString(),
      createdAt: new Date(reservation.createdAt).toISOString(),
      currentStep,
    };

    console.log("Active reservation:", {
      resId: reservation.id.slice(0, 8) + "...",
      userId: reservation.user_id,
      step: currentStep,
    });

    return NextResponse.json(responseData, { status: 200 });

  } catch (err: unknown) {
    console.error("Error fetching active reservation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching reservation",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
