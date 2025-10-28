import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";

interface ReservationRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string | null;
  expireAt: string;
  createdAt: string;
  date: string | null;
  time: string | null;
  cours: number | null;

  ct_id: number;
  ct_name: string;
  ct_picture: string | null;
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
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const [rows] = await pool.query<ReservationRow[]>(
      `SELECT 
        r.*,
        ct.id as ct_id,
        ct.name as ct_name,
        ct.picture as ct_picture
       FROM reservation_hold r
       JOIN console_stock cs ON r.console_id = cs.id
       JOIN console_type ct ON cs.console_type_id = ct.id
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1`,
      [reservationId, Number(user.id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: "not_found",
          message: "Reservation not found or unauthorized",
        },
        { status: 404 }
      );
    }

    const reservation = rows[0];

    const now = new Date();
    const expiry = new Date(reservation.expireAt);

    if (expiry <= now) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(`UPDATE console_stock SET holding = 0 WHERE id = ?`, [
          reservation.console_id,
        ]);

        const gameIds = [
          reservation.game1_id,
          reservation.game2_id,
          reservation.game3_id,
        ].filter((id): id is number => id !== null);

        if (gameIds.length > 0) {
          const placeholders = gameIds.map(() => "?").join(", ");
          await conn.query(
            `UPDATE games SET holding = 0 WHERE id IN (${placeholders})`,
            gameIds
          );
        }

        await conn.query(`DELETE FROM reservation_hold WHERE id = ?`, [reservationId]);

        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error("Error deleting expired reservation:", e);
        throw e;
      } finally {
        conn.release();
      }

      return NextResponse.json(
        { success: false, status: "expired", message: "Reservation has expired" },
        { status: 410 }
      );
    }

    const gameIds = [
      reservation.game1_id,
      reservation.game2_id,
      reservation.game3_id,
    ].filter((id): id is number => id !== null);

    let accessories: number[] = [];
    if (reservation.accessoirs) {
      try {
        if (typeof reservation.accessoirs === "string") {
          accessories = JSON.parse(reservation.accessoirs);
        } else if (Array.isArray(reservation.accessoirs)) {
          accessories = reservation.accessoirs;
        }

        if (!Array.isArray(accessories)) {
          console.warn(" Accessories is not an array, resetting to empty");
          accessories = [];
        }
      } catch (e) {
        console.error("Error parsing accessories:", e);
        accessories = [];
      }
    }

    let currentStep = 1;

    if (reservation.console_id) currentStep = 2;
    if (gameIds.length > 0) currentStep = 3;
    if (accessories.length > 0) currentStep = 4;
    if (reservation.date && reservation.time) currentStep = 5;
    if (reservation.cours !== null) currentStep = 6;

    if (
      reservation.console_id &&
      reservation.cours !== null &&
      gameIds.length === 0
    ) {
      currentStep = 3;
    }

    const timeRemaining = Math.max(
      0,
      Math.floor((expiry.getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      success: true,
      status: "active",
      reservationId: reservation.id,
      userId: reservation.user_id,
      console: {
        id: reservation.ct_id,
        name: reservation.ct_name,
        picture: reservation.ct_picture,
      },
      consoleStockId: reservation.console_id,
      consoleTypeId: reservation.console_type_id,
      games: gameIds,
      accessories,
      selectedDate: reservation.date,
      selectedTime: reservation.time,
      cours: reservation.cours,
      expiresAt: expiry.toISOString(),
      createdAt: new Date(reservation.createdAt).toISOString(),
      currentStep,
      timeRemaining,
    });
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