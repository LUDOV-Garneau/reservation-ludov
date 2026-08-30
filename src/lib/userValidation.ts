/**
 * Règles de validation d'un compte utilisateur, partagées entre le formulaire
 * d'ajout, la route unitaire et l'import CSV. Les trois en avaient chacun leur
 * copie, avec des bornes qui divergeaient déjà de celles du schéma.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bornes alignées sur `src/db/schema.ts` (users). */
export const NAME_MIN = 2;
export const FIRSTNAME_MAX = 50;
export const LASTNAME_MAX = 100;
export const EMAIL_MAX = 255;

/**
 * Longueur minimale d'un mot de passe. Appliquée par le formulaire de création
 * de mot de passe et par la route de réinitialisation.
 */
export const PASSWORD_MIN = 8;

/** Limite de l'import CSV, celle que l'interface annonce à l'utilisateur. */
export const CSV_MAX_BYTES = 5 * 1024 * 1024;

export type UserFieldErrors = {
  firstname?: string;
  lastname?: string;
  email?: string;
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Valide un compte à créer. Renvoie les erreurs par champ, vides si tout passe.
 * Les messages sont en français : la route les renvoie tels quels, et le
 * formulaire affiche ses propres messages traduits avant même d'appeler l'API.
 */
export function validateNewUser(input: {
  firstname: string;
  lastname: string;
  email: string;
}): UserFieldErrors {
  const errors: UserFieldErrors = {};
  const firstname = input.firstname.trim();
  const lastname = input.lastname.trim();
  const email = normalizeEmail(input.email);

  if (!firstname) errors.firstname = "Le prénom est requis.";
  else if (firstname.length < NAME_MIN)
    errors.firstname = `Le prénom doit contenir au moins ${NAME_MIN} caractères.`;
  else if (firstname.length > FIRSTNAME_MAX)
    errors.firstname = `Le prénom ne peut pas dépasser ${FIRSTNAME_MAX} caractères.`;

  if (!lastname) errors.lastname = "Le nom de famille est requis.";
  else if (lastname.length < NAME_MIN)
    errors.lastname = `Le nom de famille doit contenir au moins ${NAME_MIN} caractères.`;
  else if (lastname.length > LASTNAME_MAX)
    errors.lastname = `Le nom de famille ne peut pas dépasser ${LASTNAME_MAX} caractères.`;

  if (!email) errors.email = "L'adresse courriel est requise.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Format d'adresse courriel invalide.";
  else if (email.length > EMAIL_MAX)
    errors.email = `L'adresse courriel ne peut pas dépasser ${EMAIL_MAX} caractères.`;

  return errors;
}

export function firstError(errors: UserFieldErrors): string | null {
  return errors.firstname ?? errors.lastname ?? errors.email ?? null;
}

/**
 * Vrai pour la violation de contrainte unique de MySQL (ER_DUP_ENTRY, 1062),
 * levée depuis la migration `0007_users_email_unique` quand deux créations
 * concurrentes visent le même courriel.
 */
export function isDuplicateEmailError(error: unknown): boolean {
  const err = error as { code?: string; errno?: number } | null;
  return err?.code === "ER_DUP_ENTRY" || err?.errno === 1062;
}

/** `datetime` MySQL attend `YYYY-MM-DD HH:MM:SS`. */
export function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
