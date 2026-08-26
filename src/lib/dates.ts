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
