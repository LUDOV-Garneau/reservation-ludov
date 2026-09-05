/** Durée d'une session, en heures (identique à calendar-times).
 *
 * Vit ici plutôt que dans `availability.ts` : ce dernier importe `@/db`, donc
 * l'importer depuis un composant client embarque `mysql2` dans le bundle du
 * navigateur, où `net` et `tls` n'existent pas. `dates.ts` n'a aucune
 * dépendance et se partage sans risque entre serveur et client.
 */
export const SESSION_DURATION_HOURS = 2;

/**
 * Helpers de dates en fuseau LOCAL.
 * Une chaîne "YYYY-MM-DD" représente toujours le jour calendaire local,
 * jamais UTC : ne pas utiliser toISOString()/new Date("YYYY-MM-DD") pour
 * convertir, sous peine de décalage d'un jour en Amérique.
 */

export function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** true si le créneau (jour local + heure "HH:mm" ou "HH:mm:ss") est dans le futur. */
export function isFutureSlot(
  ymd: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const [h = 0, min = 0] = time.split(":").map(Number);
  const slot = parseYmdLocal(ymd);
  slot.setHours(h, min, 0, 0);
  return slot.getTime() > now.getTime();
}

/** Minutes écoulées depuis minuit pour une heure « HH:mm » ou « HH:mm:ss ». */
export function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Vrai si deux sessions qui débutent à ces heures se chevauchent.
 *
 * Une session dure SESSION_DURATION_HOURS : une réservation à 10 h occupe la
 * station (et ses items) jusqu'à 12 h, donc 11 h entre en conflit avec elle.
 * Comparer les heures de début à l'égalité laissait passer ce cas.
 */
export function slotsOverlap(a: string, b: string): boolean {
  return (
    Math.abs(timeToMinutes(a) - timeToMinutes(b)) <
    SESSION_DURATION_HOURS * 60
  );
}

/**
 * Les `datetime` MySQL arrivent en `"2026-08-29 15:18:00"`. Passé tel quel à
 * `new Date()`, ce format n'est pas garanti par la spec ; on le normalise.
 */
export function parseDbDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}
