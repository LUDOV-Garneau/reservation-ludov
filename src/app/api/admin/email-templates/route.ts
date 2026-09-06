import { NextResponse } from "next/server";
import db from "@/db";
import { emailTemplates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import {
  DEFAULT_TEMPLATES,
  EMAIL_LOCALES,
  EMAIL_TEMPLATE_KEYS,
  TEMPLATE_VARIABLES,
  TEMPLATE_ZONES,
} from "@/lib/emailTemplates";

/**
 * Liste des gabarits de courriels (admin) : contenu BD fusionné avec les
 * défauts embarqués, pour chaque clé et chaque langue.
 */
export const GET = withAdmin(async () => {
  try {
    // Jointure sur `users` : `updated_by` ne stocke qu'un identifiant, et
    // « modifie par 7 » ne dit rien a personne.
    const rows = await db
      .select({
        templateKey: emailTemplates.templateKey,
        locale: emailTemplates.locale,
        subject: emailTemplates.subject,
        zones: emailTemplates.zones,
        updatedAt: emailTemplates.updatedAt,
        updatedByFirstname: users.firstname,
        updatedByLastname: users.lastname,
      })
      .from(emailTemplates)
      .leftJoin(users, eq(emailTemplates.updatedBy, users.id));

    const byKey = new Map(
      rows.map((r) => [`${r.templateKey}:${r.locale}`, r] as const),
    );

    const templates = EMAIL_TEMPLATE_KEYS.map((key) => ({
      key,
      zones: TEMPLATE_ZONES[key],
      variables: TEMPLATE_VARIABLES[key],
      content: Object.fromEntries(
        EMAIL_LOCALES.map((locale) => {
          const row = byKey.get(`${key}:${locale}`);
          if (!row) {
            // Aucune ligne en base : c'est le texte embarque qui part, et
            // l'interface doit pouvoir le dire.
            return [locale, { ...DEFAULT_TEMPLATES[key][locale], customized: false }];
          }
          return [
            locale,
            {
              subject: row.subject,
              zones: row.zones,
              customized: true,
              updatedAt: row.updatedAt ?? null,
              updatedBy:
                `${row.updatedByFirstname ?? ""} ${row.updatedByLastname ?? ""}`.trim() ||
                null,
            },
          ];
        }),
      ),
    }));

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Erreur liste gabarits courriels:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des gabarits." },
      { status: 500 },
    );
  }
});
