import { parseDbDate } from "@/lib/dates";

/**
 * Date de création d'une station, dans la locale active.
 *
 * L'ancienne table forçait `toLocaleDateString("fr-FR")` quelle que soit la
 * langue de l'interface, et donnait donc du français à l'anglais — avec en plus
 * le format européen là où le Québec écrit `2026-09-05`.
 */
export function formatStationDate(value: string, locale: string): string {
  const date = parseDbDate(value);
  if (!date) return "—";

  return date.toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
