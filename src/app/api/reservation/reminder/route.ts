import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import db from "@/db";
import { reservation } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    if (!sessionCookie?.value) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const user = verifyToken(sessionCookie.value);
    if (!user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("reservationId");
    if (!reservationId) {
      return NextResponse.json({ success: false, error: "Missing reservationId parameter" }, { status: 400 });
    }

    const [row] = await db
      .select({ reminderEnabled: reservation.reminderEnabled, reminderHoursBefore: reservation.reminderHoursBefore })
      .from(reservation)
      .where(and(
        eq(reservation.id, reservationId),
        eq(reservation.userId, Number(user.id)),
        eq(reservation.archived, 0)
      ));

    if (!row) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      reminderEnabled: row.reminderEnabled === 1,
      reminderHoursBefore: row.reminderHoursBefore,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reminder status:", error);
    return NextResponse.json({
      error: "Erreur lors de la récupération du statut du rappel",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    if (!sessionCookie?.value) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const user = verifyToken(sessionCookie.value);
    if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const { reservationId, hoursBeforeReservation, enabled } = body;

    if (!reservationId) {
      return NextResponse.json({ error: "ID de réservation manquant" }, { status: 400 });
    }
    if (enabled && !hoursBeforeReservation) {
      return NextResponse.json({ error: "Délai de rappel manquant" }, { status: 400 });
    }
    if (enabled && (hoursBeforeReservation < 1 || hoursBeforeReservation > 168)) {
      return NextResponse.json({ error: "Le délai doit être entre 1 et 168 heures (7 jours)" }, { status: 400 });
    }

    const existing = await db.query.reservation.findFirst({
      columns: { id: true },
      where: and(eq(reservation.id, reservationId), eq(reservation.userId, Number(user.id)), eq(reservation.archived, 0)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Réservation non trouvée ou vous n'avez pas accès à cette réservation" }, { status: 404 });
    }

    await db.update(reservation)
      .set({
        reminderEnabled: enabled ? 1 : 0,
        reminderHoursBefore: enabled ? hoursBeforeReservation : null,
        reminderSent: 0,
        reminderSentAt: null,
        lastUpdatedAt: sql`NOW()`,
      })
      .where(and(eq(reservation.id, reservationId), eq(reservation.userId, Number(user.id))));

    return NextResponse.json({
      success: true,
      message: enabled
        ? `Rappel configuré : vous recevrez un email ${hoursBeforeReservation} heure(s) avant votre réservation`
        : "Rappel désactivé avec succès",
    }, { status: 200 });
  } catch (error) {
    console.error("Error configuring reminder:", error);
    return NextResponse.json({
      error: "Erreur lors de la configuration du rappel",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
