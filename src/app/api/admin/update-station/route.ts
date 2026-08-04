import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { stations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, stationId, consoles, isActive } = body;

    if (!name || name.trim() === "") return NextResponse.json({ error: "Le nom de la station est requis." }, { status: 400 });
    if (!stationId) return NextResponse.json({ error: "L'identifiant de la station est requis." }, { status: 400 });
    if (!Array.isArray(consoles) || consoles.length === 0) return NextResponse.json({ error: "Aucune plateforme fournie pour la station." }, { status: 400 });
    if (typeof isActive !== "boolean") return NextResponse.json({ error: "Le statut actif de la station est requis." }, { status: 400 });

    const existing = await db.query.stations.findFirst({
      columns: { id: true },
      where: (t) => eq(t.id, stationId),
    });

    if (!existing) return NextResponse.json({ error: "Aucune station trouvée avec cet id." }, { status: 404 });

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await db.update(stations)
      .set({ name, consoles, isActive: isActive ? 1 : 0, lastUpdatedAt: now })
      .where(eq(stations.id, stationId));

    return NextResponse.json({ success: true, message: "Station modifiée avec succès." }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la modification de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
