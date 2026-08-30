import { NextRequest, NextResponse, after } from "next/server";
import { and, count, eq, gt, sql } from "drizzle-orm";
import db from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { sendForgotPasswordEmail } from "@/lib/sendEmail";
import {
  RESET_REQUESTS_PER_HOUR,
  RESET_TOKEN_TTL_MINUTES,
  buildResetUrl,
  generateResetToken,
  hashResetToken,
} from "@/lib/passwordReset";

/**
 * Réponse unique de la route, quoi qu'il arrive : courriel inconnu, quota de
 * demandes atteint, panne SMTP. Sans cela, la page de connexion deviendrait un
 * oracle permettant de savoir quelles adresses possèdent un compte LUDOV.
 */
const NEUTRAL_RESPONSE = {
  message:
    "Si un compte existe pour cette adresse, un courriel de réinitialisation vient d'être envoyé.",
};

/**
 * Cherche le compte, respecte le quota, crée le jeton et envoie le lien.
 *
 * Exécuté après que la réponse est partie : rien de ce qui se passe ici ne doit
 * pouvoir se déduire de la requête.
 *
 * Un compte sans mot de passe (jamais inscrit, ou réinitialisé par un
 * administrateur) reçoit le lien lui aussi : prouver la possession du courriel
 * est exactement ce qu'exige déjà le parcours d'inscription.
 */
async function processRequest(email: string, requestedLocale: string | null) {
  const user = await db.query.users.findFirst({
    columns: { id: true, email: true, preferredLocale: true },
    where: (t) => eq(t.email, email),
  });

  if (!user) return;

  // La langue de l'interface au moment de la demande prime : c'est celle que
  // la personne utilise là, maintenant. `preferredLocale` sert de secours.
  const locale =
    requestedLocale ?? (user.preferredLocale === "en" ? "en" : "fr");

  // Limite de débit : empêche qu'un tiers inonde la boîte courriel d'un usager.
  const [recent] = await db
    .select({ value: count() })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        gt(passwordResetTokens.createdAt, sql`DATE_SUB(NOW(), INTERVAL 1 HOUR)`),
      ),
    );

  if ((recent?.value ?? 0) >= RESET_REQUESTS_PER_HOUR) {
    console.warn(
      `[forgot-password] limite de débit atteinte pour l'usager ${user.id}`,
    );
    return;
  }

  const token = generateResetToken();

  // Toutes les dates sont calculées par MySQL. Les poser depuis Node les
  // écrirait en UTC alors que les comparaisons se font contre NOW(), qui suit
  // l'horloge locale du serveur : sur un serveur à UTC-4, un lien de 30 minutes
  // vivrait en réalité 4 h 30.
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashResetToken(token),
    createdAt: sql`NOW()`,
    expiresAt: sql`DATE_ADD(NOW(), INTERVAL ${RESET_TOKEN_TTL_MINUTES} MINUTE)`,
  });

  const response = await sendForgotPasswordEmail({
    to: user.email,
    locale,
    resetUrl: buildResetUrl(token, locale),
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
  });

  if (response.rejected.length > 0) {
    console.error(`[forgot-password] courriel rejeté pour l'usager ${user.id}`);
  }
}

/**
 * Demande de réinitialisation.
 *
 * La réponse part avant tout travail, et le travail se fait dans `after()`.
 * Une réponse neutre ne suffit pas si sa durée, elle, dépend du compte : une
 * adresse inconnue répondrait instantanément là où une adresse connue
 * attendrait le serveur SMTP. Ce délai suffit à énumérer les comptes, quel que
 * soit le contenu de la réponse. Ici, la durée est la même pour tout le monde.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const requestedLocale =
    body?.locale === "en" || body?.locale === "fr" ? body.locale : null;

  if (email) {
    after(async () => {
      try {
        await processRequest(email, requestedLocale);
      } catch (error) {
        console.error("[forgot-password] échec de la demande :", error);
      }
    });
  }

  return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
}
