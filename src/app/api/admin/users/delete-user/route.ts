import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { users, reservation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const authUser = verifyToken(token);
    if (!authUser?.id) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    if (!authUser.isAdmin) return NextResponse.json({ error: "Accès refusé - Privilèges administrateur requis" }, { status: 403 });

    const body = await req.json().catch(() => { throw new Error("Corps de requête JSON invalide"); });
    const targetUserId = Number(body.targetUserId);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      columns: { id: true, email: true },
      where: (t) => eq(t.id, targetUserId),
    });

    if (!existing) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if (targetUserId === authUser.id) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });

    await db.delete(reservation).where(eq(reservation.userId, targetUserId));
    await db.delete(users).where(eq(users.id, targetUserId));

    return NextResponse.json({ success: true, message: `Utilisateur avec l'ID ${targetUserId} supprimé avec succès.` }, { status: 200 });
  } catch (err) {
    console.error("ERREUR SUPPRESSION UTILISATEUR:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Erreur interne du serveur" }, { status: 500 });
  }
}
