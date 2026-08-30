import db from "@/db";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { isNotNull, sql } from "drizzle-orm";
import { sendResetPasswordEmail } from "@/lib/sendEmail";
import { withAdmin } from "@/lib/withAuth";

/**
 * Jeton de confirmation, identique côté interface : l'admin doit le recopier à
 * la main. Il est fixe et non traduit pour que le contrat de l'API ne dépende
 * pas de la langue affichée — sans quoi la protection ne vivrait que dans le
 * navigateur.
 */
const CONFIRM_TOKEN = "REINITIALISER-TOUT";

type Failure = { email: string; error: string };

/**
 * Réinitialise le mot de passe de **tous** les comptes, y compris celui de
 * l'admin qui déclenche l'action — contrairement aux actions groupées, qui
 * excluent l'appelant.
 *
 * Ce n'est pas un verrouillage définitif : un compte sans mot de passe se
 * récupère seul via le parcours d'inscription (`/api/auth/register` puis OTP
 * par courriel). La seule dépendance est l'accès à sa boîte courriel.
 *
 * Toutes les sessions sont invalidées, y compris celle de l'admin qui déclenche
 * l'action : `session_version` est incrémentée pour chaque compte touché, et le
 * claim `sv` des JWT déjà émis ne concorde plus. L'admin est donc déconnecté à
 * sa requête suivante et doit lui aussi repasser par le parcours de récupération.
 */
export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json().catch(() => null);

    if (!body || body.confirm !== CONFIRM_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Confirmation manquante ou incorrecte." },
        { status: 400 },
      );
    }

    // Les comptes déjà sans mot de passe n'ont rien à réinitialiser et n'ont
    // pas besoin d'un courriel de plus : on ne touche que ceux qui en ont un.
    const targets = await db
      .select({ email: users.email, preferredLocale: users.preferredLocale })
      .from(users)
      .where(isNotNull(users.password));

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        reset: 0,
        emailsSent: 0,
        failed: [],
      });
    }

    // Un seul UPDATE : la réinitialisation est atomique, indépendamment de ce
    // qui se passera ensuite avec les courriels. L'incrément de
    // `session_version` ferme du même coup toutes les sessions ouvertes.
    await db
      .update(users)
      .set({
        password: null,
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(isNotNull(users.password));

    // Envoi séquentiel : un envoi qui échoue ne doit ni interrompre les autres
    // ni faire croire que la réinitialisation n'a pas eu lieu — elle est déjà
    // committée ci-dessus.
    const failed: Failure[] = [];
    let emailsSent = 0;

    for (const target of targets) {
      try {
        const res = await sendResetPasswordEmail({
          to: target.email,
          locale: target.preferredLocale,
        });
        if (res.rejected.length > 0) throw new Error("Le courriel a été rejeté");
        emailsSent++;
      } catch (err) {
        console.error(`Courriel de réinitialisation en échec pour ${target.email}:`, err);
        failed.push({
          email: target.email,
          error: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      reset: targets.length,
      emailsSent,
      failed,
    });
  } catch (err) {
    console.error("ERREUR RÉINITIALISATION GLOBALE:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
});
