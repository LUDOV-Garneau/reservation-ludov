import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import db from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { PASSWORD_MIN } from "@/lib/userValidation";
import { hashResetToken, isWellFormedResetToken } from "@/lib/passwordReset";

const INVALID_TOKEN = { message: "Ce lien est invalide ou expiré." };

/** Nombre de lignes touchées par un UPDATE mysql2 (`[ResultSetHeader, champs]`). */
function affectedRows(result: unknown): number {
  if (!Array.isArray(result)) return 0;
  const [header] = result as [{ affectedRows?: number }, unknown];
  return Number(header?.affectedRows ?? 0);
}

/**
 * Vérifie un lien sans le consommer, pour que la page puisse afficher « lien
 * expiré » avant que la personne saisisse un mot de passe.
 */
export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get("token");

    if (!isWellFormedResetToken(token)) {
      return NextResponse.json(INVALID_TOKEN, { status: 400 });
    }

    const row = await db.query.passwordResetTokens.findFirst({
      columns: { id: true },
      where: (t) =>
        and(
          eq(t.tokenHash, hashResetToken(token)),
          isNull(t.usedAt),
          gt(t.expiresAt, sql`NOW()`),
        ),
    });

    if (!row) return NextResponse.json(INVALID_TOKEN, { status: 400 });

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("[reset-password] échec de la vérification du lien :", error);
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 },
    );
  }
}

/**
 * Pose le nouveau mot de passe.
 *
 * Contrairement à `/api/auth/register`, l'autorisation ne repose pas sur
 * l'absence de mot de passe mais sur la présentation du jeton, revérifié ici
 * même. Le jeton est réclamé par un UPDATE conditionnel : deux requêtes
 * concurrentes portant le même lien ne peuvent pas réussir toutes les deux.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    const password = body?.password;

    if (!isWellFormedResetToken(token)) {
      return NextResponse.json(INVALID_TOKEN, { status: 400 });
    }

    if (typeof password !== "string" || password.length < PASSWORD_MIN) {
      return NextResponse.json(
        {
          message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`,
        },
        { status: 400 },
      );
    }

    // Hachage hors transaction : bcrypt prend ~100 ms, inutile de garder les
    // verrous de ligne pendant ce temps.
    const passwordHash = await bcrypt.hash(password, 10);
    const tokenHash = hashResetToken(token);

    const userId = await db.transaction(async (tx) => {
      const claim = await tx
        .update(passwordResetTokens)
        .set({ usedAt: sql`NOW()` })
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, sql`NOW()`),
          ),
        );

      if (affectedRows(claim) !== 1) return null;

      const row = await tx.query.passwordResetTokens.findFirst({
        columns: { userId: true },
        where: (t) => eq(t.tokenHash, tokenHash),
      });

      if (!row) return null;

      await tx
        .update(users)
        .set({
          password: passwordHash,
          // Invalide les sessions ouvertes sur les autres appareils.
          sessionVersion: sql`${users.sessionVersion} + 1`,
          lastUpdatedAt: sql`NOW()`,
        })
        .where(eq(users.id, row.userId));

      // Les autres liens encore valides du compte ne doivent plus servir.
      await tx
        .delete(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, row.userId),
            isNull(passwordResetTokens.usedAt),
          ),
        );

      return row.userId;
    });

    if (userId === null) {
      return NextResponse.json(INVALID_TOKEN, { status: 400 });
    }

    return NextResponse.json(
      { message: "Mot de passe réinitialisé avec succès!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[reset-password] échec de la réinitialisation :", error);
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 },
    );
  }
}
