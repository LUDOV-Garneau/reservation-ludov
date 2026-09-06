/**
 * Validation des plages horaires des disponibilités.
 *
 * Module pur, sans React ni Drizzle : il est appelé **par le client pour
 * l'affichage des erreurs et par la route pour refuser l'écriture**. La
 * validation ne vivait que dans le formulaire, si bien qu'un appel direct à
 * l'API pouvait enregistrer des plages qui se chevauchent ou dont la fin
 * précède le début — que le parcours de réservation relisait ensuite.
 */

export type TimeRangeInput = {
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

/** Pourquoi une plage est refusée. Le libellé traduit vit dans l'i18n. */
export type RangeErrorCode = "invalid_time" | "invalid_range" | "overlap";

const HOUR = /^([01]\d|2[0-3])$/;
const MINUTE = /^[0-5]\d$/;

/** Minutes depuis minuit, ou `null` si l'heure n'est pas lisible. */
export function toMinutes(hour: string, minute: string): number | null {
  if (!HOUR.test(hour) || !MINUTE.test(minute)) return null;
  return Number(hour) * 60 + Number(minute);
}

/**
 * Premier défaut d'un ensemble de plages, ou `null` si l'ensemble est valide.
 *
 * Les plages sont examinées triées par heure de début : deux plages se
 * chevauchent si l'une commence avant la fin de la précédente. Une plage vide
 * (fin = début) est refusée — elle n'offrirait aucun créneau.
 */
export function findRangeError(ranges: TimeRangeInput[]): RangeErrorCode | null {
  const bornes: { debut: number; fin: number }[] = [];

  for (const range of ranges) {
    const debut = toMinutes(range.startHour, range.startMinute);
    const fin = toMinutes(range.endHour, range.endMinute);
    // Une heure illisible est un défaut à part : la signaler comme un
    // « chevauchement » enverrait chercher au mauvais endroit.
    if (debut === null || fin === null) return "invalid_time";
    if (fin <= debut) return "invalid_range";
    bornes.push({ debut, fin });
  }

  bornes.sort((a, b) => a.debut - b.debut);
  for (let i = 1; i < bornes.length; i++) {
    if (bornes[i].debut < bornes[i - 1].fin) return "overlap";
  }

  return null;
}

export function isValidRangeSet(ranges: TimeRangeInput[]): boolean {
  return findRangeError(ranges) === null;
}

/**
 * Valide un horaire hebdomadaire complet : `{ jour: { enabled, ranges } }`.
 * Un jour désactivé n'est pas examiné — ses plages ne seront pas enregistrées.
 *
 * Renvoie une erreur **par jour**, pour que l'interface puisse l'afficher sous
 * le jour concerné plutôt que dans un bloc détaché en bas de page.
 */
export function findWeeklyErrors(
  weekly: Record<string, { enabled: boolean; hoursRanges: TimeRangeInput[] }>,
): Record<string, RangeErrorCode> {
  const erreurs: Record<string, RangeErrorCode> = {};

  for (const [jour, valeur] of Object.entries(weekly)) {
    if (!valeur?.enabled) continue;
    const erreur = findRangeError(valeur.hoursRanges ?? []);
    if (erreur) erreurs[jour] = erreur;
  }

  return erreurs;
}

/**
 * Valide un ensemble de dates ponctuelles, groupées par jour calendaire.
 *
 * La clé est le jour « YYYY-MM-DD » et non `toLocaleDateString()` : ce dernier
 * dépend de la locale du navigateur, donc deux exécutions pouvaient grouper
 * différemment.
 */
export function findDateErrors(
  entries: { date: string; timeRange: TimeRangeInput }[],
): Record<string, RangeErrorCode> {
  const parJour = new Map<string, TimeRangeInput[]>();

  for (const entry of entries) {
    const jour = entry.date;
    const liste = parJour.get(jour);
    if (liste) liste.push(entry.timeRange);
    else parJour.set(jour, [entry.timeRange]);
  }

  const erreurs: Record<string, RangeErrorCode> = {};
  for (const [jour, ranges] of parJour) {
    const erreur = findRangeError(ranges);
    if (erreur) erreurs[jour] = erreur;
  }

  return erreurs;
}
