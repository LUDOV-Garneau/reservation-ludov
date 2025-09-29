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
      )
    };

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      `INSERT INTO reservation_hold (user_id, console_id, expireAt, createdAt)
      VALUES (?, ?, ?, NOW())`,
      [userId, consoleId, expiresAt]
    )

    await pool.query(`UPDATE consoles SET available = 0 WHERE id = ?`, [consoleId]);

    return NextResponse.json({
      success: true,
      data: {
        expiresAt: expiresAt.toISOString(),
        message: "Réservation temporaire créée avec succès"
      }
    });

  } catch (err: unknown) {
    console.error("Erreur SQL:", err);
    return NextResponse.json(
      { message: "Erreur lors de la création de la réservation" },
      { status: 500 }
    );
  }
    
}
