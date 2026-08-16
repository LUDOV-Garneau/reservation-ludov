import { NextResponse } from "next/server";
import db from "@/db";
import { reservation, emailLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { sendCancellationEmail } from "@/lib/sendEmail";

export const PATCH = withAdmin(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, reason } = body as { id: string; reason: string };

    if (!id) return NextResponse.json({ error: "Missing or invalid id parameter." }, { status: 422 });

    const trimmedReason = reason?.trim() ?? "";
    if (!trimmedReason) return NextResponse.json({ error: "La raison d'annulation est obligatoire." }, { status: 422 });
    if (trimmedReason.length > 500) return NextResponse.json({ error: "La raison d'annulation ne peut pas dépasser 500 caractères." }, { status: 422 });

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
      return NextResponse.json({ error: "Réservation introuvable ou déjà annulée" }, { status: 404 });
    }

    await db.update(reservation)
      .set({ archived: 1, cancellationReason: trimmedReason })
      .where(and(eq(reservation.id, id), eq(reservation.archived, 0)));

    // Courriel d'annulation : un échec d'envoi ne doit pas faire échouer
    // l'annulation elle-même — on le journalise dans email_logs.
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
        await db.insert(emailLogs).values({
          reservationId: id,
          emailType: "cancellation",
          recipient,
          status: "sent",
        });
      } catch (emailError) {
        console.error("ERREUR COURRIEL ANNULATION:", emailError);
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
    console.error("ERREUR PATCH RÉSERVATION:", error);
    return NextResponse.json({ error: "Erreur lors de l'annulation de la réservation." }, { status: 500 });
  }
});
