"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toMinutes } from "@/lib/availabilityValidation";
import type { WeekDay } from "@/types/availabilities";
import type { RangeErrorCode } from "@/lib/availabilityValidation";

/** Bornes de l'axe si l'horaire est vide, et marge autour des heures réelles. */
const DEFAUT_DEBUT = 8 * 60;
const DEFAUT_FIN = 18 * 60;
const MARGE = 60;

const ORDRE = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Bloc = { debut: number; fin: number };

/**
 * Aperçu de la semaine : chaque jour est une colonne, chaque plage un bloc
 * plein sur un axe horaire commun.
 *
 * C'est la seule vue qui répond à « à quoi ressemble ma semaine ? ». Le
 * formulaire, lui, ne montre que sept lignes de listes déroulantes : pour
 * savoir si le mercredi ferme plus tôt que le mardi, il fallait comparer huit
 * menus de mémoire.
 *
 * Purement indicatif — rien n'est cliquable ici, la saisie reste dans le
 * formulaire en dessous.
 */
export default function WeekOverview({
  weekly,
  errors = {},
}: {
  weekly: Record<string, WeekDay>;
  /** Un jour en erreur est teinté ici aussi : sinon l'aperçu affirme
   *  tranquillement un horaire que le formulaire refuse d'enregistrer. */
  errors?: Record<string, RangeErrorCode>;
}) {
  const t = useTranslations("admin.availabilities");

  const parJour = new Map<string, Bloc[]>();
  for (const jour of ORDRE) {
    const donnees = weekly[jour];
    if (!donnees?.enabled) continue;

    const blocs: Bloc[] = [];
    for (const plage of donnees.hoursRanges ?? []) {
      const debut = toMinutes(plage.startHour, plage.startMinute);
      const fin = toMinutes(plage.endHour, plage.endMinute);
      // Une plage invalide n'est pas dessinée : le message d'erreur sous le
      // jour concerné dit déjà quoi corriger, un bloc à l'envers ajouterait
      // du bruit.
      if (debut === null || fin === null || fin <= debut) continue;
      blocs.push({ debut, fin });
    }
    if (blocs.length > 0) parJour.set(jour, blocs);
  }

  const tous = [...parJour.values()].flat();
  const min = tous.length
    ? Math.max(0, Math.min(...tous.map((b) => b.debut)) - MARGE)
    : DEFAUT_DEBUT;
  const max = tous.length
    ? Math.min(24 * 60, Math.max(...tous.map((b) => b.fin)) + MARGE)
    : DEFAUT_FIN;
  const amplitude = Math.max(60, max - min);

  // Repères horaires : toutes les 2 h si l'amplitude est large, sinon chaque
  // heure — sans quoi l'axe devient illisible sur une journée complète.
  const pas = amplitude > 8 * 60 ? 120 : 60;
  const premier = Math.ceil(min / pas) * pas;
  const reperes: number[] = [];
  for (let m = premier; m <= max; m += pas) reperes.push(m);

  const vide = parJour.size === 0;

  return (
    <section
      aria-label={t("overview.title")}
      className="rounded-lg border bg-muted/30 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("overview.title")}</h3>
        <p className="text-xs text-muted-foreground">
          {vide ? t("overview.empty") : t("overview.hint")}
        </p>
      </div>

      <div className="flex gap-2">
        {/* Axe des heures */}
        <div className="relative w-11 shrink-0 py-2" style={{ height: 148 }}>
          {reperes.map((m) => (
            <span
              key={m}
              className="absolute right-0 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{
                top: `calc(8px + ${(m - min) / amplitude} * (100% - 16px))`,
              }}
            >
              {String(Math.floor(m / 60)).padStart(2, "0")}:
              {String(m % 60).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {ORDRE.map((jour) => {
            const blocs = parJour.get(jour) ?? [];
            const ouvert = blocs.length > 0;
            const enErreur = Boolean(errors[jour]);

            return (
              <div key={jour} className="flex flex-col gap-1">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-md border py-2",
                    enErreur && "border-destructive bg-destructive/5",
                    ouvert && !enErreur
                      ? "bg-background"
                      : !ouvert && !enErreur
                        ? // Un jour ferme est plein et mat : sans cela une
                          // piste vide ressemble a un defaut d'affichage.
                          "border-dashed bg-muted/60"
                        : "",
                  )}
                  style={{ height: 148 }}
                >
                  {/* Lignes de repère, alignées sur l'axe de gauche. */}
                  {reperes.map((m) => (
                    <div
                      key={m}
                      aria-hidden
                      className="absolute inset-x-0 border-t border-border"
                      style={{
                        top: `calc(8px + ${(m - min) / amplitude} * (100% - 16px))`,
                      }}
                    />
                  ))}

                  {blocs.map((bloc, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-[3px] rounded-[3px] border border-cyan-600/40 bg-cyan-500/80 dark:border-cyan-300/30 dark:bg-cyan-400/70"
                      style={{
                        top: `calc(8px + ${((bloc.debut - min) / amplitude)} * (100% - 16px))`,
                        height: `calc(${(bloc.fin - bloc.debut) / amplitude} * (100% - 16px))`,
                      }}
                      title={`${String(Math.floor(bloc.debut / 60)).padStart(2, "0")}:${String(
                        bloc.debut % 60,
                      ).padStart(2, "0")} – ${String(
                        Math.floor(bloc.fin / 60),
                      ).padStart(2, "0")}:${String(bloc.fin % 60).padStart(2, "0")}`}
                    />
                  ))}
                </div>

                <span
                  className={cn(
                    "text-center text-[11px] font-medium capitalize",
                    enErreur
                      ? "text-destructive"
                      : ouvert
                        ? "text-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {/* Trois lettres : sept noms complets ne tiennent pas. */}
                  {t(`days.${jour}`).slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
