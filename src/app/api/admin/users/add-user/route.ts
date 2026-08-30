import { NextResponse } from "next/server";
import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import {
  firstError,
  isDuplicateEmailError,
  normalizeEmail,
  toMysqlDatetime,
  validateNewUser,
} from "@/lib/userValidation";

export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const firstname = (typeof body.firstname === "string" ? body.firstname : "").trim();
    const lastname = (typeof body.lastname === "string" ? body.lastname : "").trim();
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const isAdmin = body.isAdmin === 1 || body.isAdmin === true ? 1 : 0;

    const invalid = firstError(validateNewUser({ firstname, lastname, email }));
    if (invalid) {
      return NextResponse.json({ success: false, error: invalid }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      columns: { id: true },
      where: (t) => eq(t.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 },
      );
    }

    const now = toMysqlDatetime(new Date());

    try {
      // Le compte est créé sans mot de passe : la personne ne peut pas encore
      // se connecter. C'est l'action « Réinitialiser le mot de passe » qui lui
      // envoie le courriel d'accès — l'envoi reste manuel, par choix.
      await db.insert(users).values({
        firstname,
        lastname,
        email,
        password: null,
        isAdmin,
        lastUpdatedAt: now,
        createdAt: now,
      });
    } catch (err) {
      // La vérification ci-dessus est indicative : entre le SELECT et
      // l'INSERT, une autre requête a pu créer le même courriel. C'est la
      // contrainte unique qui tranche.
      if (isDuplicateEmailError(err)) {
        return NextResponse.json(
          { success: false, error: "Un utilisateur avec cet email existe déjà." },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json(
      { success: true, message: "Utilisateur ajouté avec succès." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur lors du traitement de la requête :", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
