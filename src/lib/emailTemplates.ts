import db from "@/db";
import { emailTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  DEFAULT_TEMPLATES,
  isEmailLocale,
  type EmailLocale,
  type EmailTemplateContent,
  type EmailTemplateKey,
} from "@/lib/emailTemplateShapes";

/**
 * Chargement des gabarits depuis la base.
 *
 * Les formes, les défauts et le rendu vivent dans `emailTemplateShapes.ts`,
 * qui ne touche pas la base et peut donc être importé par un composant client.
 * Ce module les réexporte pour les appelants serveur existants.
 */

export * from "@/lib/emailTemplateShapes";

// Cache mémoire court : les courriels partent d'API routes long-vécues.
const CACHE_TTL_MS = 60_000;
const cache = new Map<
  string,
  { value: EmailTemplateContent; expiresAt: number }
>();

export function clearTemplateCache(): void {
  cache.clear();
}

/**
 * Charge un gabarit : BD (clé+locale) → BD (clé+fr) → défauts embarqués.
 */
export async function getTemplate(
  key: EmailTemplateKey,
  locale: string | null | undefined,
): Promise<EmailTemplateContent> {
  const resolvedLocale: EmailLocale =
    locale && isEmailLocale(locale) ? locale : "fr";
  const cacheKey = `${key}:${resolvedLocale}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let content: EmailTemplateContent | null = null;
  try {
    const row =
      (await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.templateKey, key),
          eq(emailTemplates.locale, resolvedLocale),
        ),
      })) ??
      (resolvedLocale !== "fr"
        ? await db.query.emailTemplates.findFirst({
            where: and(
              eq(emailTemplates.templateKey, key),
              eq(emailTemplates.locale, "fr"),
            ),
          })
        : null);

    if (row && row.subject && row.zones && typeof row.zones === "object") {
      content = {
        subject: row.subject,
        zones: row.zones as Record<string, string>,
      };
    }
  } catch (error) {
    console.error(`[emailTemplates] lecture BD échouée (${cacheKey}):`, error);
  }

  if (!content) {
    content = DEFAULT_TEMPLATES[key][resolvedLocale];
  }

  cache.set(cacheKey, { value: content, expiresAt: Date.now() + CACHE_TTL_MS });
  return content;
}
