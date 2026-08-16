import { NextResponse } from "next/server";
import db from "@/db";
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
    const rows = await db.query.emailTemplates.findMany();
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
          return [
            locale,
            row
              ? { subject: row.subject, zones: row.zones }
              : DEFAULT_TEMPLATES[key][locale],
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
