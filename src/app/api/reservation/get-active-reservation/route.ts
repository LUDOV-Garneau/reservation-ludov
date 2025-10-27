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
  accessoirs: string | null;
  expireAt: string;
  createdAt: string;
  date: Date | null;
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
       WHERE r.id = ?
       LIMIT 1
       `,
      [reservationId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, status: "not_found", message: "Reservation not found" },
        { status: 404 }
      );
    }

    const r = rows[0];
    if (r.user_id !== Number(user.id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this reservation" },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiry = new Date(r.expireAt);

    if (expiry <= now) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query(`DELETE FROM reservation_hold WHERE id = ?`, [reservationId]);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }

      return NextResponse.json(
        { success: false, status: "expired", message: "Reservation has expired" },
        { status: 410 }
      );
    }

    const gameIds = [r.game1_id, r.game2_id, r.game3_id].filter(Boolean) as number[];

    let accessories: number[] = [];
    if (r.accessoirs) {
      try {
        if (typeof r.accessoirs === 'string') {
          accessories = JSON.parse(r.accessoirs);
        } 
        else if (Array.isArray(r.accessoirs)) {
          accessories = r.accessoirs;
        }
      } catch (e) {
        console.error("Error parsing accessories:", e);
        accessories = [];
      }
    }

    let currentStep = 1;
    if (r.console_id) currentStep = 2;
    if (gameIds.length > 0) currentStep = 3;
    if (accessories.length > 0) currentStep = 4;
    if (r.date && r.time) currentStep = 5;
    if (r.cours) currentStep = 6;

    const responseData = {
      success: true,
      status: "active",
      reservationId: r.id,
      userId: r.user_id,
      console: {
        id: r.ct_id,
        name: r.ct_name,
        picture: r.ct_picture,
      },
      games: gameIds,
      accessories,
      selectedDate: r.date,
      selectedTime: r.time,
      cours: r.cours,
      expiresAt: expiry.toISOString(),
      createdAt: new Date(r.createdAt).toISOString(),
      currentStep,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    console.error("Error fetching active reservation:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching reservation",
        error: (err as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}