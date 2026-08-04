import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { cours } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const coursId = Number(body.coursId);

    const existing = await db.query.cours.findFirst({
      columns: { id: true, nomCours: true },
      where: (t) => eq(t.id, coursId),
    });

    if (!existing) return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });

    // Set cours_id to NULL on related reservations before deleting
    await db.execute(sql`UPDATE reservation SET cours_id = NULL WHERE cours_id = ${coursId}`);
    await db.delete(cours).where(eq(cours.id, coursId));

    return NextResponse.json({ success: true, message: "Cours supprimé avec succès", status: 200 });
  } catch (err) {
    console.error("Erreur lors de la suppression du cours:", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
