import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/sendEmail";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { and, eq } from "drizzle-orm";
import { reservation, users, consoleType } from "@/db/schema";
import { alias } from "drizzle-orm/mysql-core";
import { createLogger, maskEmail } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const log = createLogger("RESERVATION:confirm-email");
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    log.warn("auth.rejected", { reason: "no_session" });
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = verifyToken(token);
  if (!user?.id) {
    log.warn("auth.rejected", { reason: "invalid_token" });
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  log.bind({ userId: Number(user.id) });

  let body;
  try {
    body = await req.json();
  } catch {
    log.warn("request.rejected", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reservationId } = body;
  if (!reservationId) {
    log.warn("request.rejected", { reason: "missing_reservation_id" });
    return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });
  }
  log.bind({ reservationId: String(reservationId) });

  try {
    const rows = await db
      .select({
        id: reservation.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        date: reservation.date,
        time: reservation.time,
        consoleName: consoleType.name,
        preferredLocale: users.preferredLocale,
      })
      .from(reservation)
      .innerJoin(users, eq(reservation.userId, users.id))
      .innerJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
      .where(and(eq(reservation.id, reservationId), eq(reservation.userId, Number(user.id))));

    if (rows.length === 0) {
      log.warn("reservation.not_found");
      return NextResponse.json({ error: "Reservation not found or access denied" }, { status: 404 });
    }

    const r = rows[0];
    await sendConfirmationEmail({
      to: r.email,
      userName: `${r.firstname} ${r.lastname}`,
      reservationId: r.id,
      date: r.date,
      time: r.time,
      consoleName: r.consoleName,
      locale: r.preferredLocale,
    });

    // Adresse masquée : reconnaître le destinataire sans exposer son courriel
    // dans les logs du conteneur.
    log.info("email.sent", {
      to: maskEmail(r.email),
      locale: r.preferredLocale,
      ms: log.elapsedMs(),
    });

    return NextResponse.json({ success: true, reservationId: r.id, email: r.email, message: "Reservation confirmed and email sent" }, { status: 200 });
  } catch (error) {
    // Le SMTP est hors du contrôle de l'app : c'est la panne la plus probable
    // ici, et l'usager n'a alors aucune confirmation par courriel.
    log.error("email.failed", error, { ms: log.elapsedMs() });
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
