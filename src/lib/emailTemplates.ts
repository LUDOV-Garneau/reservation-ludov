import db from "@/db";
import { emailTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Contenu éditable des courriels transactionnels.
 * Le gabarit HTML (mise en page, couleurs, cartes de détails) reste fixe dans
 * sendEmail.ts ; les administrateurs éditent le sujet et des zones de texte
 * nommées, avec des variables {commeCeci} interpolées à l'envoi.
 */

export const EMAIL_TEMPLATE_KEYS = [
  "confirmation",
  "reminder",
  "reset_password",
  "welcome",
  "otp",
  "cancellation",
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_LOCALES = ["fr", "en"] as const;
export type EmailLocale = (typeof EMAIL_LOCALES)[number];

export type EmailTemplateContent = {
  subject: string;
  zones: Record<string, string>;
};

/** Variables autorisées par gabarit (validation à la sauvegarde + interpolation). */
export const TEMPLATE_VARIABLES: Record<EmailTemplateKey, string[]> = {
  confirmation: ["userName", "reservationId", "date", "time", "consoleName"],
  reminder: ["userName", "reservationId", "date", "time", "consoleName"],
  reset_password: [],
  welcome: [],
  otp: ["otpCode"],
  cancellation: ["userName", "reservationId", "date", "time", "reason"],
};

/** Zones attendues par gabarit (l'interface admin les affiche dans cet ordre). */
export const TEMPLATE_ZONES: Record<EmailTemplateKey, string[]> = {
  confirmation: ["intro", "important", "outro"],
  reminder: ["intro", "outro"],
  reset_password: ["intro", "outro"],
  welcome: ["intro", "outro"],
  otp: ["body"],
  cancellation: ["intro", "outro"],
};

/**
 * Textes par défaut : identiques au contenu historique codé en dur (fr) +
 * traduction (en). Utilisés comme secours si la ligne BD est absente, et pour
 * la graine de la migration.
 */
export const DEFAULT_TEMPLATES: Record<
  EmailTemplateKey,
  Record<EmailLocale, EmailTemplateContent>
> = {
  confirmation: {
    fr: {
      subject: "Confirmation de votre réservation LUDOV",
      zones: {
        intro:
          "Bonjour {userName},\nVotre réservation chez LUDOV a bien été confirmée. Nous avons hâte de vous accueillir !",
        important:
          "Arrivez 5 minutes à l'avance afin de valider votre présence.\nApportez une pièce d'identité valide.\nSi vous souhaitez modifier votre réservation, contactez-nous au moins 24h à l'avance.",
        outro:
          "Si vous avez des questions, notre équipe est là pour vous aider.",
      },
    },
    en: {
      subject: "Your LUDOV reservation is confirmed",
      zones: {
        intro:
          "Hello {userName},\nYour LUDOV reservation has been confirmed. We look forward to welcoming you!",
        important:
          "Arrive 5 minutes early to check in.\nBring a valid ID.\nIf you need to change your reservation, contact us at least 24 hours in advance.",
        outro: "If you have any questions, our team is here to help.",
      },
    },
  },
  reminder: {
    fr: {
      subject: "Rappel de votre réservation LUDOV",
      zones: {
        intro:
          "Bonjour {userName},\nPetit rappel : votre réservation chez LUDOV approche !",
        outro:
          "Si vous ne pouvez pas vous présenter, merci d'annuler votre réservation depuis la plateforme.",
      },
    },
    en: {
      subject: "Reminder: your upcoming LUDOV reservation",
      zones: {
        intro:
          "Hello {userName},\nJust a reminder: your LUDOV reservation is coming up!",
        outro:
          "If you cannot make it, please cancel your reservation on the platform.",
      },
    },
  },
  reset_password: {
    fr: {
      subject: "Réinitialisation de votre mot de passe LUDOV",
      zones: {
        intro:
          "Bonjour,\nNous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte LUDOV.\nVotre mot de passe a été réinitialisé avec succès.\nLors de votre prochaine connexion, veuillez cliquer sur « Première connexion » afin de définir un nouveau mot de passe.\nSi vous n'êtes pas à l'origine de cette demande, veuillez contacter notre support immédiatement.",
        outro:
          "Si vous avez des questions ou éprouvez des difficultés, n'hésitez pas à nous contacter.",
      },
    },
    en: {
      subject: "Your LUDOV password has been reset",
      zones: {
        intro:
          "Hello,\nWe received a request to reset the password of your LUDOV account.\nYour password has been reset successfully.\nOn your next login, please click “First login” to set a new password.\nIf you did not request this, please contact our support immediately.",
        outro: "If you have any questions or difficulties, feel free to contact us.",
      },
    },
  },
  welcome: {
    fr: {
      subject: "Bienvenue chez LUDOV !",
      zones: {
        intro:
          "Bonjour,\nNous sommes ravis de vous accueillir au sein des laboratoires de LUDOV !\nVous pouvez dès maintenant explorer la plateforme, consulter le catalogue et effectuer vos réservations.",
        outro:
          "Si vous avez des questions concernant vos emprunts, vos réservations ou le fonctionnement de la plateforme, n'hésitez pas à nous contacter.",
      },
    },
    en: {
      subject: "Welcome to LUDOV!",
      zones: {
        intro:
          "Hello,\nWe are delighted to welcome you to the LUDOV laboratories!\nYou can now explore the platform, browse the catalog and make reservations.",
        outro:
          "If you have any questions about your loans, reservations or how the platform works, feel free to contact us.",
      },
    },
  },
  otp: {
    fr: {
      subject: "Code OTP - LUDOV réservation",
      zones: {
        body: "Votre code de vérification LUDOV est : {otpCode}\nCe code expire dans 15 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.",
      },
    },
    en: {
      subject: "OTP code - LUDOV reservation",
      zones: {
        body: "Your LUDOV verification code is: {otpCode}\nThis code expires in 15 minutes.\nIf you did not request this, please ignore this email.",
      },
    },
  },
  cancellation: {
    fr: {
      subject: "Annulation de votre réservation LUDOV",
      zones: {
        intro:
          "Bonjour {userName},\nVotre réservation chez LUDOV a été annulée par notre équipe. Vous trouverez les détails ci-dessous.",
        outro:
          "Vous pouvez effectuer une nouvelle réservation en tout temps depuis la plateforme LUDOV.\nSi vous avez des questions concernant cette annulation, notre équipe est là pour vous aider.",
      },
    },
    en: {
      subject: "Your LUDOV reservation has been cancelled",
      zones: {
        intro:
          "Hello {userName},\nYour LUDOV reservation has been cancelled by our team. You will find the details below.",
        outro:
          "You can make a new reservation at any time on the LUDOV platform.\nIf you have any questions about this cancellation, our team is here to help.",
      },
    },
  },
};

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function isEmailLocale(value: string): value is EmailLocale {
  return (EMAIL_LOCALES as readonly string[]).includes(value);
}

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

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Interpole les {variables} dans un texte de zone (valeurs échappées HTML).
 * Les variables inconnues restent telles quelles.
 */
export function renderZoneText(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in variables ? escapeHtml(variables[name]) : match,
  );
}

/** Variante texte brut (courriel OTP) : pas d'échappement HTML. */
export function renderZoneTextPlain(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in variables ? variables[name] : match,
  );
}

/** Transforme une zone (lignes séparées par \n) en paragraphes HTML stylés. */
export function zoneToParagraphs(
  rendered: string,
  style = "margin: 0 0 20px 0; color: #374151; font-size: 16px;",
): string {
  return rendered
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="${style}">${line}</p>`)
    .join("\n");
}

/** Transforme une zone (lignes séparées par \n) en liste HTML `<li>`. */
export function zoneToListItems(rendered: string): string {
  return rendered
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li style="margin:0 0 6px 0;">${line}</li>`)
    .join("\n");
}

/** Rejette toute variable non listée pour le gabarit (validation à la sauvegarde). */
export function findUnknownVariables(
  key: EmailTemplateKey,
  content: EmailTemplateContent,
): string[] {
  const allowed = new Set(TEMPLATE_VARIABLES[key]);
  const unknown = new Set<string>();
  const texts = [content.subject, ...Object.values(content.zones)];
  for (const text of texts) {
    for (const match of text.matchAll(/\{(\w+)\}/g)) {
      if (!allowed.has(match[1])) unknown.add(match[1]);
    }
  }
  return [...unknown];
}
