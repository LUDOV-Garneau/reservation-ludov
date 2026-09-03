import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import db from "@/db";
import { users } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";
import { signToken } from "@/lib/jwt";
import { PASSWORD_MIN } from "@/lib/userValidation";

/**
 * Changement de mot de passe par la personne connectée.
 *
 * Exige le mot de passe actuel (une session laissée ouverte ne suffit pas à
 * verrouiller le compte). Comme la réinitialisation par courriel, la version
 * de session est incrémentée pour déconnecter les autres appareils ; le
 * cookie de la session courante est réémis avec la nouvelle version pour que
 * la personne reste connectée ici.
 */
export const POST = withAuth(async (req, user) => {
  try {
    const body = (await req.json().catch(() => null)) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    } | null;
    const currentPassword = body?.currentPassword;
    const newPassword = body?.newPassword;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return NextResponse.json(
        { message: "Le mot de passe actuel est requis." },
        { status: 400 },
      );
    }
    if (typeof newPassword !== "string" || newPassword.length < PASSWORD_MIN) {
      return NextResponse.json(
        { message: `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.` },
        { status: 400 },
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { message: "Le nouveau mot de passe doit être différent de l'actuel." },
        { status: 400 },
      );
    }

    const row = await db.query.users.findFirst({
      columns: {
        id: true,
        email: true,
        firstname: true,
        isAdmin: true,
        password: true,
      },
      where: (t) => eq(t.id, user.id),
    });
    if (!row?.password) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const matches = await bcrypt.compare(currentPassword, row.password);
    if (!matches) {
      return NextResponse.json(
        { message: "Le mot de passe actuel est incorrect." },
        { status: 403 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const nextSessionVersion = await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          password: passwordHash,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          lastUpdatedAt: sql`NOW()`,
        })
        .where(eq(users.id, row.id));
      const updated = await tx.query.users.findFirst({
        columns: { sessionVersion: true },
        where: (t) => eq(t.id, row.id),
      });
      return updated?.sessionVersion ?? 0;
    });

    const token = signToken({
      id: row.id,
      name: row.firstname,
      email: row.email,
      isAdmin: row.isAdmin,
      sv: nextSessionVersion,
    });

    const response = NextResponse.json({
      message: "Mot de passe modifié avec succès.",
    });
    response.cookies.set({
      name: "SESSION",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.error("[change-password] échec :", error);
    return NextResponse.json(
      { message: "Une erreur s'est produite." },
      { status: 500 },
    );
  }
});
