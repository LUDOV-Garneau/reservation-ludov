"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { parseYmdLocal, toLocalYmd } from "@/lib/dates";
import {
  findDateErrors,
  findWeeklyErrors,
  type RangeErrorCode,
} from "@/lib/availabilityValidation";
import type {
  AvailabilityState,
  Exception,
  HourRange,
  WeekDay,
  fetchAvailabilities,
} from "@/types/availabilities";

const JOURS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Plage par défaut. C'est une **fabrique** et non une constante partagée :
 * l'ancien code réutilisait le même objet pour les sept jours, si bien que
 * tous pointaient sur la même plage.
 */
function plageParDefaut(): HourRange {
  return {
    id: 0,
    startHour: "09",
    startMinute: "00",
    endHour: "17",
    endMinute: "00",
  };
}

function semaineParDefaut(): Record<string, WeekDay> {
  return Object.fromEntries(
    JOURS.map((jour) => [
      jour,
      { label: jour, enabled: false, hoursRanges: [plageParDefaut()] },
    ]),
  );
}

function etatParDefaut(): AvailabilityState {
  return {
    weekly: semaineParDefaut(),
    dateRange: { alwaysApplies: false, range: null },
    exceptions: { enabled: false, dates: [] },
  };
}

function versPayload(state: AvailabilityState) {
  return {
    weekly: state.weekly,
    dateRange: {
      alwaysApplies: state.dateRange.alwaysApplies,
      range: state.dateRange.range
        ? {
            startDate: state.dateRange.range.startDate
              ? toLocalYmd(state.dateRange.range.startDate)
              : null,
            endDate: state.dateRange.range.endDate
              ? toLocalYmd(state.dateRange.range.endDate)
              : null,
          }
        : null,
    },
    exceptions: {
      enabled: state.exceptions.enabled,
      dates: state.exceptions.dates.map((ex) => ({
        date: toLocalYmd(ex.date),
        timeRange: ex.timeRange,
      })),
    },
  };
}

/** Empreinte servant à détecter les modifications non enregistrées. */
function empreinte(valeur: unknown): string {
  return JSON.stringify(valeur);
}

export type AvailabilitiesController = {
  state: AvailabilityState;
  setState: React.Dispatch<React.SetStateAction<AvailabilityState>>;
  specificDates: Exception[];
  setSpecificDates: React.Dispatch<React.SetStateAction<Exception[]>>;
  loading: boolean;
  savingWeekly: boolean;
  savingSpecific: boolean;
  /** Une configuration hebdomadaire existe en base. */
  weeklyConfigured: boolean;
  weeklyDirty: boolean;
  specificDirty: boolean;
  /** Erreurs par jour de semaine, dérivées de l'état — jamais périmées. */
  weeklyErrors: Record<string, RangeErrorCode>;
  /** Erreurs des exceptions et des dates ponctuelles, par jour « YYYY-MM-DD ». */
  exceptionErrors: Record<string, RangeErrorCode>;
  specificErrors: Record<string, RangeErrorCode>;
  saveWeekly: () => Promise<boolean>;
  saveSpecific: () => Promise<boolean>;
};

export function useAvailabilities(): AvailabilitiesController {
  const t = useTranslations("admin.availabilities");

  const [state, setState] = useState<AvailabilityState>(etatParDefaut);
  const [specificDates, setSpecificDates] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [savingSpecific, setSavingSpecific] = useState(false);
  const [weeklyConfigured, setWeeklyConfigured] = useState(false);

  // Empreintes de ce qui est enregistre, pour signaler les modifications en
  // cours sur l'onglet qu'on quitte.
  const [weeklySaved, setWeeklySaved] = useState<string>("");
  const [specificSaved, setSpecificSaved] = useState<string>("");

  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/week-availabilities", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("fetch");

        const data = (await res.json()) as fetchAvailabilities;
        if (annule) return;

        const semaine = semaineParDefaut();
        const recu = data.availability.weekly ?? {};
        for (const [jour, valeur] of Object.entries(recu)) {
          const plages =
            Array.isArray(valeur.hoursRanges) && valeur.hoursRanges.length > 0
              ? valeur.hoursRanges
              : [plageParDefaut()];
          semaine[jour] = { ...valeur, hoursRanges: plages };
        }

        const charge: AvailabilityState = {
          weekly: semaine,
          dateRange: {
            alwaysApplies: data.availability.dateRange.alwaysApplies,
            range: data.availability.dateRange.range
              ? {
                  startDate: data.availability.dateRange.range.startDate
                    ? parseYmdLocal(
                        String(data.availability.dateRange.range.startDate),
                      )
                    : null,
                  endDate: data.availability.dateRange.range.endDate
                    ? parseYmdLocal(
                        String(data.availability.dateRange.range.endDate),
                      )
                    : null,
                }
              : null,
          },
          exceptions: {
            enabled: data.availability.exceptions.enabled,
            dates: data.availability.exceptions.dates.map((ex) => ({
              ...ex,
              date: parseYmdLocal(String(ex.date)),
            })),
          },
        };

        const dates = data.specificDates.map((d) => ({
          ...d,
          date: parseYmdLocal(String(d.date)),
        }));

        setState(charge);
        setSpecificDates(dates);
        setWeeklyConfigured(Object.keys(recu).length > 0);
        setWeeklySaved(empreinte(versPayload(charge)));
        setSpecificSaved(empreinte(dates.map((d) => toLocalYmd(d.date))));
      } catch {
        if (!annule) toast.error(t("errors.fetchAvailabilities"));
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [t]);

  // Les erreurs sont DERIVEES et non stockees. L'ancien code les gardait dans
  // un state mis a jour par un effet, dont la reinitialisation ne se declenchait
  // jamais quand la derniere date fautive etait supprimee : la banniere restait
  // et le bouton restait desactive.
  const weeklyErrors = useMemo(
    () => findWeeklyErrors(state.weekly),
    [state.weekly],
  );

  const exceptionErrors = useMemo(
    () =>
      state.exceptions.enabled
        ? findDateErrors(
            state.exceptions.dates.map((ex) => ({
              date: toLocalYmd(ex.date),
              timeRange: ex.timeRange,
            })),
          )
        : {},
    [state.exceptions],
  );

  const specificErrors = useMemo(
    () =>
      findDateErrors(
        specificDates.map((sd) => ({
          date: toLocalYmd(sd.date),
          timeRange: sd.timeRange,
        })),
      ),
    [specificDates],
  );

  const payloadCourant = useMemo(() => versPayload(state), [state]);
  const weeklyDirty = !loading && empreinte(payloadCourant) !== weeklySaved;
  const specificDirty =
    !loading &&
    empreinte(specificDates.map((d) => toLocalYmd(d.date))) !== specificSaved;

  const saveWeekly = useCallback(async (): Promise<boolean> => {
    setSavingWeekly(true);
    try {
      const res = await fetch("/api/admin/week-availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadCourant),
      });
      if (!res.ok) throw new Error("save");

      toast.success(t("messages.savedWeekly"));
      setWeeklyConfigured(true);
      setWeeklySaved(empreinte(payloadCourant));
      return true;
    } catch {
      toast.error(t("errors.savingAvailabilities"));
      return false;
    } finally {
      setSavingWeekly(false);
    }
  }, [payloadCourant, t]);

  const saveSpecific = useCallback(async (): Promise<boolean> => {
    setSavingSpecific(true);
    try {
      const res = await fetch("/api/admin/specific-availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          specificDates.map((sd) => ({
            date: toLocalYmd(sd.date),
            timeRange: sd.timeRange,
          })),
        ),
      });
      if (!res.ok) throw new Error("save");

      toast.success(t("messages.savedSpecific"));
      setSpecificSaved(empreinte(specificDates.map((d) => toLocalYmd(d.date))));
      return true;
    } catch {
      toast.error(t("errors.savingAvailabilities"));
      return false;
    } finally {
      setSavingSpecific(false);
    }
  }, [specificDates, t]);

  return {
    state,
    setState,
    specificDates,
    setSpecificDates,
    loading,
    savingWeekly,
    savingSpecific,
    weeklyConfigured,
    weeklyDirty,
    specificDirty,
    weeklyErrors,
    exceptionErrors,
    specificErrors,
    saveWeekly,
    saveSpecific,
  };
}
