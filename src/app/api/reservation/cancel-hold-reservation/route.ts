import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

type ConsoleRow = RowDataPacket & {
  console_id: number;
  user_id: number;
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "reservationId manquant" },
        { status: 400 }
      );
    }

    // Récupérer l’ancienne console pour la libérer
    const [rows] = await pool.query<ConsoleRow[]>(
      `SELECT user_id, console_id, game1_id, game2_id, game3_id FROM reservation_hold WHERE id = ?`,
      [reservationId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Réservation introuvable" },
        { status: 404 }
      );
    }

    // Vérification des droits (Admin ou Propriétaire)
    if (!user.isAdmin && rows[0].user_id !== userId) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const consoleId = rows[0].console_id as number | null;

    // Supprimer la réservation
    await pool.query<ResultSetHeader>(`DELETE FROM reservation_hold WHERE id = ?`, [
      reservationId,
    ]);

    if (consoleId) {
      await pool.query(`UPDATE console_stock SET holding = 0 WHERE id = ?`, [
        consoleId,
      ]);
    }

    for (const gameId of [rows[0].game1_id, rows[0].game2_id, rows[0].game3_id]) {
      if (gameId) {
        await pool.query(`UPDATE games SET holding = 0 WHERE id = ?`, [
          gameId,
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      reservationId,
      releasedConsoleId: consoleId,
    });
  } catch (err) {
    console.error("Erreur cancel reservation:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
