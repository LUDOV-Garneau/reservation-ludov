import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { sql } from "drizzle-orm";
import { sendReminderEmail } from "@/lib/sendEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface ReservationToRemind {
  id: string;
  user_id: number;
  date: string;
  time: string;
  reminder_hours_before: number;
  station: number | null;
  email: string;
  firstname: string;
  lastname: string;
  console_name: string;
}

const TZ = "America/Toronto";

function getOffsetFor(zone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const localAsUTCms = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  const diffMin = Math.round((localAsUTCms - now.getTime()) / 60000);
  if (!Number.isFinite(diffMin)) throw new Error("offset computation failed");

  const sign = diffMin >= 0 ? "+" : "-";
  const abs = Math.abs(diffMin);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
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
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("[CRON] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sentCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  try {
    // Short transaction: SET time_zone + SELECT only — no email sending inside
    const reservations = await db.transaction(async (tx) => {
      const offset = getOffsetFor(TZ);
      try {
        await tx.execute(sql`SET time_zone = ${offset}`);
        console.log(
          `[CRON] MySQL session time_zone set to ${offset} for ${TZ}`,
        );
      } catch (e) {
        console.warn(
          "[CRON] Failed to set session time_zone, continuing in server default:",
          e,
        );
      }

      console.log("[CRON] Querying database for pending reminders...");

      return (await tx.execute<ReservationToRemind>(
        sql`SELECT
          r.id, r.user_id, r.date, r.time, r.reminder_hours_before, r.station,
          u.email, u.firstname, u.lastname,
          ct.name as console_name
        FROM reservation r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN console_type ct ON ct.id = r.console_type_id
        WHERE r.reminder_enabled = 1
          AND r.reminder_sent = 0
          AND r.archived = 0
          AND TIMESTAMPDIFF(HOUR, NOW(), CONCAT(r.date, ' ', r.time)) <= r.reminder_hours_before
          AND CONCAT(r.date, ' ', r.time) > NOW()
        ORDER BY r.date ASC, r.time ASC
        LIMIT 50`,
      )) as unknown as ReservationToRemind[];
    });

    console.log(`[CRON] Found ${reservations.length} reminders to send`);

    // Process each reservation independently — no transaction held during email sending
    for (const r of reservations) {
      try {
        const dateFormatted = String(r.date).split("T")[0];
        await sendReminderEmail({
          to: r.email,
          userName: `${r.firstname} ${r.lastname}`,
          reservationId: r.id,
          date: dateFormatted,
          time: r.time,
          consoleName: r.console_name,
        });

        // Anti-double-envoi: UPDATE conditionnel sur reminder_sent = 0
        // Si un autre job concurrent a déjà traité cette ligne, rowsAffected = 0
        await db.execute(
          sql`UPDATE reservation
              SET reminder_sent = 1, reminder_sent_at = NOW(), lastUpdatedAt = NOW()
              WHERE id = ${r.id} AND reminder_sent = 0`,
        );

        sentCount++;
        console.log(`[CRON] Reminder sent successfully for ${r.id}`);
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({ id: r.id, error: errorMessage });
        console.error(
          `[CRON] Error sending reminder for reservation ${r.id}:`,
          error,
        );

        try {
          await db.execute(
            sql`INSERT INTO email_logs (reservation_id, email_type, recipient, status, error_message, created_at) VALUES (${r.id}, 'reminder', ${r.email}, 'failed', ${errorMessage}, NOW())`,
          );
        } catch (logError) {
          console.error("[CRON] Failed to log error:", logError);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[CRON] Job completed in ${duration}ms. Sent=${sentCount}, Errors=${errorCount}`,
    );

    return NextResponse.json(
      {
        success: true,
        sent: sentCount,
        errors: errorCount,
        total: sentCount + errorCount,
        duration,
        errorDetails: errors.length > 0 ? errors : undefined,
      },
      { status: 200 },
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
      { status: 500 },
    );
  }
}
