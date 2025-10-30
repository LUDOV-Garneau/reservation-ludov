import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

interface ReminderData extends RowDataPacket {
  reminder_enabled: number;
  reminder_hours_before: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = verifyToken(sessionCookie.value);
    if (!user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const reservationId = params.id;
    const connection = await pool.getConnection();

    try {
      // Récupérer l'état du rappel
      const [rows] = await connection.query<ReminderData[]>(
        `SELECT reminder_enabled, reminder_hours_before 
         FROM reservation 
         WHERE id = ? AND user_id = ? AND archived = 0`,
        [reservationId, user.id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Réservation non trouvée" },
          { status: 404 }
        );
      }

      const reminder = rows[0];

      return NextResponse.json(
        {
          reminderEnabled: reminder.reminder_enabled === 1,
          reminderHoursBefore: reminder.reminder_hours_before,
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("❌ Error fetching reminder status:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du statut du rappel",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}