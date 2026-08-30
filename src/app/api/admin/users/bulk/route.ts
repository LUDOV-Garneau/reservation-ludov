import db from "@/db";
import { NextResponse } from "next/server";
import { users, reservation } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { sendResetPasswordEmail } from "@/lib/sendEmail";
import { withAdmin } from "@/lib/withAuth";

const ACTIONS = ["reset-password", "delete"] as const;
type BulkAction = (typeof ACTIONS)[number];

/** Garde-fou : au-delà, c'est un import/export, pas une action de liste. */
const MAX_IDS = 100;

type Failure = { id: number; error: string };

/**
 * Actions groupées sur des utilisateurs.
 *
 * Le traitement est séquentiel : une réinitialisation envoie un courriel, et
 * lancer quarante envois SMTP en parallèle depuis le navigateur (une requête
 * par utilisateur) ne donne ni ordre ni compte-rendu exploitable.
 *
 * Répond 200 même en cas d'échec partiel : l'appelant lit `succeeded` et
 * `failed` pour savoir ce qui est réellement passé.
 */
export const POST = withAdmin(async (req, authUser) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    }

    const action = body.action as BulkAction;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    if (!Array.isArray(body.userIds)) {
      return NextResponse.json({ error: "userIds doit être un tableau" }, { status: 400 });
    }

    // L'id de l'appelant est retiré silencieusement : les endpoints unitaires
    // refusent déjà l'auto-action, ce n'est pas un échec à rapporter.
    const userIds = [
      ...new Set(
        body.userIds
          .map((value: unknown) => Number(value))
          .filter((id: number) => Number.isFinite(id) && id > 0 && id !== authUser.id),
      ),
    ] as number[];

    if (userIds.length === 0) {
      return NextResponse.json({ error: "Aucun utilisateur valide" }, { status: 400 });
    }

    if (userIds.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IDS} utilisateurs par appel` },
        { status: 400 },
      );
    }

    const existing = await db
      .select({
        id: users.id,
        email: users.email,
        preferredLocale: users.preferredLocale,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    const byId = new Map(existing.map((user) => [user.id, user]));

    const succeeded: number[] = [];
    const failed: Failure[] = [];

    for (const id of userIds) {
      const target = byId.get(id);
      if (!target) {
        failed.push({ id, error: "Utilisateur introuvable" });
        continue;
      }

      try {
        if (action === "delete") {
          await db.delete(reservation).where(eq(reservation.userId, id));
          await db.delete(users).where(eq(users.id, id));
        } else {
          await db
            .update(users)
            .set({
              password: null,
              // Ferme les sessions ouvertes ailleurs, comme la réinitialisation
              // unitaire et le parcours `/api/auth/reset-password`.
              sessionVersion: sql`${users.sessionVersion} + 1`,
            })
            .where(eq(users.id, id));
          const res = await sendResetPasswordEmail({
            to: target.email,
            locale: target.preferredLocale,
          });
          if (res.rejected.length > 0) {
            throw new Error("Le courriel a été rejeté");
          }
        }
        succeeded.push(id);
      } catch (err) {
        console.error(`Action groupée "${action}" en échec sur l'utilisateur ${id}:`, err);
        failed.push({
          id,
          error: err instanceof Error ? err.message : "Erreur interne du serveur",
        });
      }
    }

    return NextResponse.json({ success: failed.length === 0, succeeded, failed });
  } catch (err) {
    console.error("ERREUR ACTION GROUPÉE UTILISATEURS:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
});
