import { NextResponse } from "next/server";
import db from "@/db";
import { reservation, emailLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { sendCancellationEmail } from "@/lib/sendEmail";
import { createLogger, maskEmail } from "@/lib/logger";

export const PATCH = withAdmin(async (req, admin) => {
  const log = createLogger("RESERVATION:admin-cancel", { adminId: admin.id });
  try {
    const body = await req.json().catch(() => ({}));
    const { id, reason } = body as { id: string; reason: string };

    if (!id) {
      log.warn("request.rejected", { reason: "missing_id" });
      return NextResponse.json({ error: "Missing or invalid id parameter." }, { status: 422 });
    }
    log.bind({ reservationId: id });

    const trimmedReason = reason?.trim() ?? "";
    if (!trimmedReason) {
      log.warn("request.rejected", { reason: "missing_cancellation_reason" });
      return NextResponse.json({ error: "La raison d'annulation est obligatoire." }, { status: 422 });
    }
    if (trimmedReason.length > 500) {
      log.warn("request.rejected", { reason: "cancellation_reason_too_long", length: trimmedReason.length });
      return NextResponse.json({ error: "La raison d'annulation ne peut pas dépasser 500 caractères." }, { status: 422 });
    }

    const existing = await db.query.reservation.findFirst({
      columns: { id: true, date: true, time: true },
      where: (t) => and(eq(t.id, id), eq(t.archived, 0)),
      with: {
        user: {
          columns: {
            firstname: true,
            lastname: true,
            email: true,
            preferredLocale: true,
          },
        },
      },
    });

    if (!existing) {
      log.warn("reservation.not_found", { reason: "unknown_or_already_archived" });
      return NextResponse.json({ error: "Réservation introuvable ou déjà annulée" }, { status: 404 });
    }

    await db.update(reservation)
      .set({ archived: 1, cancellationReason: trimmedReason })
      .where(and(eq(reservation.id, id), eq(reservation.archived, 0)));

    // Une annulation vient d'un humain et prive un usager de son créneau :
    // qui et quand doit rester lisible dans les logs.
    //
    // La raison, elle, est une saisie libre pouvant nommer des personnes ou
    // décrire un cas : elle reste en base (`reservation.cancellation_reason`),
    // consultable à partir du `reservationId` ci-dessous, plutôt que déversée
    // dans les logs du conteneur. Seule sa longueur est journalisée, pour
    // distinguer une explication d'un texte bâclé.
    log.info("reservation.cancelled", {
      date: String(existing.date),
      time: String(existing.time).slice(0, 5),
      reasonLength: trimmedReason.length,
    });

    // Courriel d'annulation : un échec d'envoi ne doit pas faire échouer
    // l'annulation elle-même, on le journalise dans email_logs.
    let emailSent = false;
    const recipient = existing.user?.email ?? null;
    if (recipient) {
      try {
        await sendCancellationEmail({
          to: recipient,
          userName: [existing.user?.firstname, existing.user?.lastname]
            .filter(Boolean)
            .join(" "),
          reservationId: id,
          date: String(existing.date),
          time: String(existing.time).slice(0, 5),
          reason: trimmedReason,
          locale: existing.user?.preferredLocale,
        });
        emailSent = true;
        log.info("email.sent", { type: "cancellation", to: maskEmail(recipient) });
        await db.insert(emailLogs).values({
          reservationId: id,
          emailType: "cancellation",
          recipient,
          status: "sent",
        });
      } catch (emailError) {
        // L'annulation reste valide : seul le courriel a échoué, l'usager
        // risque de se présenter sans savoir.
        log.error("email.failed", emailError, { type: "cancellation", to: maskEmail(recipient) });
        await db
          .insert(emailLogs)
          .values({
            reservationId: id,
            emailType: "cancellation",
            recipient,
            status: "failed",
            errorMessage:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
          })
          .catch((logError) =>
            console.error("ERREUR LOG COURRIEL:", logError),
          );
      }
    }

    return NextResponse.json(
      { message: "Réservation annulée avec succès.", emailSent },
      { status: 200 },
    );
  } catch (error) {
    log.error("request.failed", error, { ms: log.elapsedMs() });
    return NextResponse.json({ error: "Erreur lors de l'annulation de la réservation." }, { status: 500 });
  }
});
