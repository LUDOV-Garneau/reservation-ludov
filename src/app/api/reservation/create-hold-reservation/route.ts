import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {consoleId } = body;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
  
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) {
        user = verifyToken(token);
      }
    } catch {}

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized"
      },{ 
        status: 401 
      });
    }

    if (!consoleId) {
      return NextResponse.json({ 
          success: false,
          message: "userId and consoleId are required" 
        },{ 
          status: 400 
        }
      );
    }

    const userId = Number(user.id);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    const reservationId = `HOLD-${crypto.randomUUID()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    
    const formatDateTime = (date: Date): string => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const expiresAtFormatted = formatDateTime(expiresAt);
    const createdAtFormatted = formatDateTime(now);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query("SELECT nombre FROM consoles WHERE id = ?;", [consoleId]);
      const available = Array.isArray(rows) && rows[0]?.nombre > 0;
      if (!available) {
        throw new Error("Console non disponible");
      }

      await pool.query(
        `INSERT INTO reservation_hold 
        (id, user_id, console_id, expireAt, createdAt)
        VALUES (?, ?, ?, ?, ?)`,
        [reservationId, user?.id, consoleId, expiresAtFormatted, createdAtFormatted]
      );

      const [updateResult] = await connection.query(
        `UPDATE consoles SET nombre = nombre - 1 WHERE id = ? AND nombre > 0`,
        [consoleId]
      );

      if ((updateResult as any).affectedRows === 0) {
        throw new Error("Impossible de décrémenter la console");
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        reservationId,
        expiresAt: expiresAt.toISOString(),
        message: "Réservation temporaire créée avec succès",
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Erreur lors de la création de la réservation" },
      { status: 500 }
    );
  }
}