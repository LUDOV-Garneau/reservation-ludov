import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { stations, reservation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const stationId = Number(body.stationId);

    const existing = await db.query.stations.findFirst({
      columns: { id: true, name: true },
      where: (t) => eq(t.id, stationId),
    });

    if (!existing) return NextResponse.json({ error: "Station introuvable" }, { status: 404 });

    await db.delete(reservation).where(eq(reservation.station, stationId));
    await db.delete(stations).where(eq(stations.id, stationId));

    return NextResponse.json({ success: true, message: "Station supprimée avec succès", status: 200 });
  } catch (err) {
    console.error("Erreur lors de la suppression de la station:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
