import db from "@/db";
import { NextResponse } from "next/server";
import { sendResetPasswordEmail } from "@/lib/sendEmail";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

export const POST = withAdmin(async (req, authUser) => {
  try {
    const body = await req.json().catch(() => { throw new Error("Corps de requête JSON invalide"); });
    const targetUserId = Number(body.targetUserId);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 });
    }

    const targetUser = await db.query.users.findFirst({
      columns: { id: true, email: true, preferredLocale: true },
      where: (t) => eq(t.id, targetUserId),
    });

    if (!targetUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if (targetUserId === authUser.id) return NextResponse.json({ error: "Impossible de réinitialiser votre propre mot de passe" }, { status: 400 });

    await db.update(users).set({ password: null }).where(eq(users.id, targetUserId));

    const res = await sendResetPasswordEmail({
      to: targetUser.email,
      locale: targetUser.preferredLocale,
    });
    if (res.rejected.length > 0) throw new Error();

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé avec succès" }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Erreur interne du serveur" }, { status: 500 });
  }
});
