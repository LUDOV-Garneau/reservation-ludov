import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, consoleId } = body;

    if (!userId || !consoleId) {
      return NextResponse.json({ 
          success: false,
          message: "userId and consoleId are required" 
        },{ 
          status: 400 
        }
      );
    }

    const reservationId = `RESHOLD-${crypto.randomUUID()}`;
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const expiresAtFormatted = formatDateTime(expiresAt);
    const createdAtFormatted = formatDateTime(now);

    await pool.query(
      `INSERT INTO reservation_hold 
       (id, user_id, console_id, expireAt, createdAt)
       VALUES (?, ?, 8436, ?, ?)`,
      [reservationId, userId, expiresAtFormatted, createdAtFormatted]
    );

    await pool.query(
      `UPDATE consoles SET nombre = nombre - 1 WHERE id = ? AND nombre > 0`, 
      [consoleId]
    );

    return NextResponse.json({
      success: true,
      reservationId: reservationId,
      expiresAt: expiresAt.toISOString(),
      message: "Réservation temporaire créée avec succès"
    });

  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      { 
        success: false,
        message: "Erreur lors de la création de la réservation",
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}