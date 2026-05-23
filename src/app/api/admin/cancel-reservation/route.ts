import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json().catch(() => ({}));
    const { id, reason } = body as { id: string; reason: string };

    if (!id) return NextResponse.json({ error: "Missing or invalid id parameter." }, { status: 422 });
    if (!reason) return NextResponse.json({ error: "La raison d'annulation est obligatoire." }, { status: 422 });

    const existing = await db.query.reservation.findFirst({
      columns: { id: true },
      where: (t) => eq(t.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Réservation introuvable ou déjà annulée" }, { status: 404 });
    }

    await db.update(reservation)
      .set({ archived: 1, cancellationReason: reason })
      .where(eq(reservation.id, id));

    return NextResponse.json({ message: "Réservation annulée avec succès." }, { status: 200 });
  } catch (error) {
    console.error("ERREUR PATCH RÉSERVATION:", error);
    return NextResponse.json({ error: "Erreur lors de l'annulation de la réservation." }, { status: 500 });
  }
}
