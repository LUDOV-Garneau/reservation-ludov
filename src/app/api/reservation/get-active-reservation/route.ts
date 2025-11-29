import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";

interface JwtSession {
  id: number;
  email?: string;
}

interface ReservationRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number | null;
  console_type_id: number | null;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string | number[] | null;
  expireAt: string;
  createdAt: string;
  date: string | null;
  time: string | null;
  cours: number | null;

  ct_id: number;
  ct_name: string;
  ct_picture: string | null;

  expiresIn: number;
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
    let user: JwtSession | null = null;

    try {
      const token = sessionCookie?.value;
      if (token) {
        user = verifyToken(token) as JwtSession;
      }
    } catch (err) {
      console.error("Token verification error:", err);
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
      `
      SELECT 
        r.*,
        ct.id   AS ct_id,
        ct.name AS ct_name,
        GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), r.expireAt)) AS expiresIn
      FROM reservation_hold r
      JOIN console_stock cs ON r.console_id = cs.id
      JOIN console_type ct  ON cs.console_type_id = ct.id
      WHERE r.id = ? AND r.user_id = ?
      LIMIT 1
      `,
      [reservationId, Number(user.id)]
    );

    if (!rows || rows.length === 0) {
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

    // Si expiré, nettoyage transactionnel et 410
    if (Number(reservation.expiresIn) <= 0) {
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

        await conn.query(`DELETE FROM reservation_hold WHERE id = ?`, [
          reservation.id,
        ]);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error("Error deleting expired reservation:", e);
        throw e;
      } finally {
        conn.release();
      }

      return NextResponse.json(
        {
          success: false,
          status: "expired",
          message: "Reservation has expired",
        },
        { status: 410 }
      );
    }

    const gameIds = [
      reservation.game1_id,
      reservation.game2_id,
      reservation.game3_id,
    ].filter((id): id is number => id !== null);

    // Parse sécurisé des accessoires
    let accessories: number[] = [];
    if (reservation.accessoirs != null) {
      if (Array.isArray(reservation.accessoirs)) {
        accessories = reservation.accessoirs.filter(
          (v): v is number => typeof v === "number"
        );
      } else if (typeof reservation.accessoirs === "string") {
        try {
          const parsed = JSON.parse(
            reservation.accessoirs
          ) as Array<unknown> | null;
          if (Array.isArray(parsed)) {
            accessories = parsed.filter(
              (v): v is number => typeof v === "number"
            );
          } else {
            accessories = [];
          }
        } catch (parseErr) {
          console.error("Error parsing accessories JSON:", parseErr);
          accessories = [];
        }
      } else {
        accessories = [];
      }
    }

    // Calcul de l’étape UI
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

    const expiresAtIso = new Date(reservation.expireAt).toISOString();
    const expiresIn = Number(reservation.expiresIn);
    const timeRemaining = Math.max(0, expiresIn);

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
      expiresAt: expiresAtIso,
      createdAt: new Date(reservation.createdAt).toISOString(),
      currentStep,
      timeRemaining,
      expiresIn,
    });
  } catch (err) {
    // pas d'annotation 'unknown' ; on récupère le message si possible
    console.error("Error fetching active reservation:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching reservation",
        error: message,
      },
      { status: 500 }
    );
  }
}
