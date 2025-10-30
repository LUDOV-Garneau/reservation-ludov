import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

interface ReminderData extends RowDataPacket {
  reminder_enabled: number;
  reminder_hours_before: number | null;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("reservationId");

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: "Missing reservationId parameter" },
        { status: 400 }
      );
    }

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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = verifyToken(sessionCookie.value);
    if (!user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, hoursBeforeReservation, enabled } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de réservation manquant" },
        { status: 400 }
      );
    }

    if (enabled && !hoursBeforeReservation) {
      return NextResponse.json(
        { error: "Délai de rappel manquant" },
        { status: 400 }
      );
    }

    if (
      enabled &&
      (hoursBeforeReservation < 1 || hoursBeforeReservation > 168)
    ) {
      return NextResponse.json(
        { error: "Le délai doit être entre 1 et 168 heures (7 jours)" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT id FROM reservation WHERE id = ? AND user_id = ? AND archived = 0`,
        [reservationId, user.id]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          {
            error:
              "Réservation non trouvée ou vous n'avez pas accès à cette réservation",
          },
          { status: 404 }
        );
      }

      await connection.query(
        `UPDATE reservation 
         SET reminder_enabled = ?, 
             reminder_hours_before = ?,
             reminder_sent = 0,
             reminder_sent_at = NULL,
             lastUpdatedAt = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          enabled ? 1 : 0,
          enabled ? hoursBeforeReservation : null,
          reservationId,
          user.id,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: enabled
            ? `Rappel configuré : vous recevrez un email ${hoursBeforeReservation} heure(s) avant votre réservation`
            : "Rappel désactivé avec succès",
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error configuring reminder:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la configuration du rappel",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
