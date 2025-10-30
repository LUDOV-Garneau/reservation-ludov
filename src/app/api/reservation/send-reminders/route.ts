import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { sendReminderEmail } from "@/lib/sendEmail";
import { connect } from "http2";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface ReservationToRemind extends RowDataPacket {
  id: string;
  user_id: number;
  date: Date | string;
  time: string;
  reminder_hours_before: number;
  email: string;
  firstname: string;
  lastname: string;
  console_name: string;
  station: number | null;
}

const TZ = 'America/Toronto';

function getOffsetFor(zone: string): string {
  const now = new Date();

  // Obtenir les "parts" de la date/heure dans le fuseau demandé (sans parsing de string)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const y = Number(map.year);
  const M = Number(map.month);
  const d = Number(map.day);
  const h = Number(map.hour);
  const m = Number(map.minute);
  const s = Number(map.second);

  // Reconstitue "l’instant" local comme s’il était en UTC
  const localAsUTCms = Date.UTC(y, M - 1, d, h, m, s);
  const nowUTCms = now.getTime();

  // Différence (minutes) entre l'heure locale du fuseau et l'UTC réelle (now)
  const diffMin = Math.round((localAsUTCms - nowUTCms) / 60000); // ex: -240 pour HAE
  if (!Number.isFinite(diffMin)) {
    throw new Error('offset computation failed');
  }

  const sign = diffMin >= 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`; // e.g. "-04:00" ou "-05:00"
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[CRON] Starting reminder job at", new Date().toISOString());

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[CRON] Unauthorized access attempt");
    console.error("   Received:", authHeader);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await pool.getConnection();

  try {

    const offset = getOffsetFor(TZ);
    try {
      await connection.query('SET time_zone = ?', [offset]);
      console.log(`[CRON] MySQL session time_zone set to ${offset} for ${TZ}`);
    } catch (e) {
      console.warn('[CRON] Failed to set session time_zone, continuing in server default:', e);
    }

    console.log("[CRON] Querying database for pending reminders...");

    const [reservations] = await connection.query<ReservationToRemind[]>(
      `SELECT 
        r.id,
        r.user_id,
        r.date,
        r.time,
        r.reminder_hours_before,
        r.station,
        u.email,
        u.firstname,
        u.lastname,
        ct.name as console_name
      FROM reservation r
      INNER JOIN users u ON u.id = r.user_id
      INNER JOIN console_type ct ON ct.id = r.console_type_id
      WHERE r.reminder_enabled = 1
        AND r.reminder_sent = 0
        AND r.archived = 0
        AND TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), CONCAT(r.date, ' ', r.time)) <= r.reminder_hours_before
        AND CONCAT(r.date, ' ', r.time) > UTC_TIMESTAMP()
      ORDER BY r.date ASC, r.time ASC
      LIMIT 50`
    );

    console.log(`[CRON] Found ${reservations.length} reminders to send`);

    if (reservations.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`[CRON] No reminders to send. Completed in ${duration}ms`);
      return NextResponse.json(
        {
          success: true,
          message: "No reminders to send",
          sent: 0,
          errors: 0,
          total: 0,
          duration,
        },
        { status: 200 }
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const reservation of reservations) {
      try {
        console.log(
          `[CRON] Sending reminder for reservation ${reservation.id} to ${reservation.email}`
        );

        const dateFormatted =
          reservation.date instanceof Date
            ? reservation.date.toISOString().split("T")[0]
            : String(reservation.date).split("T")[0];

        await sendReminderEmail({
          to: reservation.email,
          userName: `${reservation.firstname} ${reservation.lastname}`,
          reservationId: reservation.id,
          date: dateFormatted,
          time: reservation.time,
          consoleName: reservation.console_name,
        });

        await connection.query(
          `UPDATE reservation 
           SET reminder_sent = 1, 
               reminder_sent_at = NOW(),
               lastUpdatedAt = NOW()
           WHERE id = ?`,
          [reservation.id]
        );

        sentCount++;
        console.log(`[CRON] Reminder sent successfully for ${reservation.id}`);
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({ id: reservation.id, error: errorMessage });

        console.error(
          `[CRON] Error sending reminder for reservation ${reservation.id}:`,
          error
        );

        try {
          await connection.query(
            `INSERT INTO email_logs (reservation_id, email_type, recipient, status, error_message, created_at)
             VALUES (?, 'reminder', ?, 'failed', ?, NOW())`,
            [reservation.id, reservation.email, errorMessage]
          );
        } catch (logError) {
          console.error("[CRON] Failed to log error:", logError);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Job completed in ${duration}ms`);
    console.log(`[CRON] Results: Sent=${sentCount}, Errors=${errorCount}, Total=${reservations.length}`);

    return NextResponse.json(
      {
        success: true,
        sent: sentCount,
        errors: errorCount,
        total: reservations.length,
        duration,
        errorDetails: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[CRON] Fatal error in reminder job:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        duration,
      },
      { status: 500 }
    );
  } finally {
    connection.release();
    console.log("🔌 [CRON] Database connection released");
  }
}