import db from "@/db";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import {
  firstError,
  isDuplicateEmailError,
  normalizeEmail,
  toMysqlDatetime,
  validateNewUser,
} from "@/lib/userValidation";

const LOCALES = ["fr", "en"] as const;

function parseUserId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const GET = withAdmin<{ userId: string }>(async (_req, _admin, params) => {
  try {
    const userId = parseUserId(params.userId);
    if (userId === null) {
      return NextResponse.json({ success: false, error: "ID utilisateur invalide" }, { status: 400 });
    }

    const [userData] = await db
      .select({
        id: users.id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
        isAdmin: users.isAdmin,
        preferredLocale: users.preferredLocale,
        lastUpdatedAt: users.lastUpdatedAt,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
        // Le détail affiche le même statut d'activation que la liste ; on
        // expose le booléen, jamais le hash.
        hasPassword: sql<boolean>`${users.password} IS NOT NULL`,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!userData) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: { ...userData, hasPassword: Boolean(userData.hasPassword) },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});

/**
 * Modification d'un compte : identité, rôle et langue des courriels.
 *
 * Deux garde-fous sur le rôle, pour la même raison — se retrouver sans aucun
 * administrateur ne se répare pas depuis l'interface :
 * - un admin ne peut pas se retirer ses propres droits ;
 * - le dernier admin ne peut pas être rétrogradé.
 */
export const PATCH = withAdmin<{ userId: string }>(async (req, authUser, params) => {
  try {
    const userId = parseUserId(params.userId);
    if (userId === null) {
      return NextResponse.json({ success: false, error: "ID utilisateur invalide" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Corps de requête JSON invalide" }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      columns: { id: true, firstname: true, lastname: true, email: true, isAdmin: true },
      where: (t) => eq(t.id, userId),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    const firstname =
      typeof body.firstname === "string" ? body.firstname.trim() : existing.firstname;
    const lastname =
      typeof body.lastname === "string" ? body.lastname.trim() : existing.lastname;
    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : existing.email;

    const invalid = firstError(validateNewUser({ firstname, lastname, email }));
    if (invalid) {
      return NextResponse.json({ success: false, error: invalid }, { status: 400 });
    }

    const nextIsAdmin =
      body.isAdmin === undefined ? existing.isAdmin : body.isAdmin ? 1 : 0;

    if (nextIsAdmin === 0 && existing.isAdmin === 1) {
      if (userId === authUser.id) {
        return NextResponse.json(
          { success: false, error: "Vous ne pouvez pas retirer vos propres droits d'administrateur." },
          { status: 400 },
        );
      }

      const [{ remaining }] = await db
        .select({ remaining: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(eq(users.isAdmin, 1), ne(users.id, userId)));

      if (Number(remaining) === 0) {
        return NextResponse.json(
          { success: false, error: "Il doit rester au moins un administrateur." },
          { status: 400 },
        );
      }
    }

    const preferredLocale =
      typeof body.preferredLocale === "string" &&
      (LOCALES as readonly string[]).includes(body.preferredLocale)
        ? body.preferredLocale
        : undefined;

    if (email !== existing.email) {
      const taken = await db.query.users.findFirst({
        columns: { id: true },
        where: (t) => eq(t.email, email),
      });
      if (taken) {
        return NextResponse.json(
          { success: false, error: "Un utilisateur avec cet email existe déjà." },
          { status: 409 },
        );
      }
    }

    try {
      await db
        .update(users)
        .set({
          firstname,
          lastname,
          email,
          isAdmin: nextIsAdmin,
          ...(preferredLocale && { preferredLocale }),
          lastUpdatedAt: toMysqlDatetime(new Date()),
        })
        .where(eq(users.id, userId));
    } catch (err) {
      // La vérification ci-dessus est indicative : c'est la contrainte unique
      // qui tranche en cas de modification concurrente.
      if (isDuplicateEmailError(err)) {
        return NextResponse.json(
          { success: false, error: "Un utilisateur avec cet email existe déjà." },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});
