import { eq } from "drizzle-orm";
import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import type { JwtPayload } from "@/types";

export type SessionUser = JwtPayload & { id: number };

/**
 * Vérifie qu'un jeton de session n'a pas été périmé par une réinitialisation
 * de mot de passe.
 *
 * La signature du JWT ne suffit pas : elle reste valide 7 jours, y compris sur
 * un appareil dont la personne a justement voulu se déconnecter en changeant
 * son mot de passe. Le claim `sv` est comparé à `users.session_version`, que la
 * route de réinitialisation incrémente.
 *
 * Un `sv` absent vaut 0 : les jetons émis avant l'ajout de la colonne restent
 * valides jusqu'à leur expiration naturelle, sinon la mise en production
 * déconnecterait tout le monde d'un coup.
 */
export async function isSessionCurrent(user: SessionUser): Promise<boolean> {
  try {
    const row = await db.query.users.findFirst({
      columns: { sessionVersion: true },
      where: (t) => eq(t.id, user.id),
    });

    // Compte supprimé entre-temps : la session ne vaut plus rien.
    if (!row) return false;

    return (user.sv ?? 0) === row.sessionVersion;
  } catch (error) {
    // Une panne de base ne doit pas déconnecter tout le monde : on retombe sur
    // la garantie de la signature, qui reste vérifiée par l'appelant.
    console.error("[session] vérification de session_version échouée :", error);
    return true;
  }
}

/**
 * Lit le cookie SESSION et renvoie l'usager si le jeton est signé ET courant.
 * Destiné aux composants serveur ; les routes d'API passent par `withAuth`.
 */
export async function readSession(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  const user = verifyToken(token);
  if (!user?.id) return null;
  const sessionUser = user as SessionUser;
  return (await isSessionCurrent(sessionUser)) ? sessionUser : null;
}
