import crypto from "crypto";

/** Durée de vie d'un lien de réinitialisation. */
export const RESET_TOKEN_TTL_MINUTES = 30;

/** Demandes de réinitialisation acceptées par compte et par heure. */
export const RESET_REQUESTS_PER_HOUR = 3;

/**
 * Jeton en clair envoyé dans le courriel : 256 bits d'entropie, sûr en URL.
 * Il n'est jamais stocké — seul son empreinte l'est (voir `hashResetToken`).
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Empreinte stockée en base. SHA-256 sans sel : le jeton est déjà aléatoire et
 * de haute entropie, un sel n'apporterait rien contre une attaque par
 * dictionnaire, et une empreinte déterministe permet la recherche par index.
 */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Format attendu d'un jeton : base64url de 32 octets. */
export function isWellFormedResetToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

/**
 * URL du lien envoyé par courriel. `NEXT_PUBLIC_APP_URL` est déjà la
 * convention du projet pour l'URL publique (voir cron-scheduler.js).
 */
export function buildResetUrl(token: string, locale: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const safeLocale = locale === "en" ? "en" : "fr";
  return `${base}/${safeLocale}/auth/reset-password?token=${encodeURIComponent(token)}`;
}
