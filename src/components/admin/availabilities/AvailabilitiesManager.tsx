"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import WeekAvailabilitiesSelection from "./WeekAvailabilitiesSelection";
import WeekOverview from "./WeekOverview";
import DateRangeSelection from "./DateRangeSelection";
import BlockSpecificDatesSelection from "./BlockSpecificDatesSelection";
import SpecificDatesSelection from "./SpecificDatesSelection";
import { useAvailabilities } from "./hooks/useAvailabilities";
import type { DateSelection, Exception, WeekDay } from "@/types/availabilities";

type Vue = "weekly" | "specific-dates";

/** Les deux vues ne partagent aucun état d'enregistrement : sauvegarder l'une
 *  ne doit pas griser le bouton de l'autre. */
export default function AvailabilitiesManager() {
  const t = useTranslations("admin.availabilities");
  const [vue, setVue] = useState<Vue>("weekly");
  const c = useAvailabilities();

  const erreursSemaine =
    Object.keys(c.weeklyErrors).length + Object.keys(c.exceptionErrors).length;
  const erreursDates = Object.keys(c.specificErrors).length;

  const enregistrerSemaine = useCallback(() => {
    // Le bouton reste cliquable même en erreur : un bouton grisé sans
    // explication était un cul-de-sac. On refuse l'envoi et on dit pourquoi ;
    // le détail est déjà affiché sous le jour concerné.
    if (erreursSemaine > 0) {
      toast.error(t("errors.fixBeforeSaving"));
      return;
    }
    if (!c.state.dateRange.alwaysApplies && !c.state.dateRange.range?.startDate) {
      toast.error(t("errors.periodRequired"));
      return;
    }
    c.saveWeekly();
  }, [erreursSemaine, c, t]);

  const enregistrerDates = useCallback(() => {
    if (erreursDates > 0) {
      toast.error(t("errors.fixBeforeSaving"));
      return;
    }
    c.saveSpecific();
  }, [erreursDates, c, t]);

  const dateSelections: DateSelection[] = c.specificDates.map(
    ({ date, timeRange }) => ({
      date,
      startHour: timeRange.startHour,
      startMinute: timeRange.startMinute,
      endHour: timeRange.endHour,
      endMinute: timeRange.endMinute,
    }),
  );

  const majDatesPonctuelles = (selections: DateSelection[]) =>
    c.setSpecificDates(
      selections.map((sel, index) => ({
        date: sel.date,
        timeRange: {
          id: index,
          startHour: sel.startHour,
          startMinute: sel.startMinute,
          endHour: sel.endHour,
          endMinute: sel.endMinute,
        },
      })),
    );

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <StatusBanner
          loading={c.loading}
          configured={c.weeklyConfigured}
          datesCount={c.specificDates.length}
        />

        <div
          role="tablist"
          aria-label={t("title")}
          className="flex flex-col gap-4 md:flex-row md:gap-6"
        >
          <VueTab
            id="weekly"
            active={vue === "weekly"}
            dirty={c.weeklyDirty}
            onSelect={setVue}
            title={t("typeSelection.weekly.title")}
            description={t("typeSelection.weekly.description")}
          />
          <VueTab
            id="specific-dates"
            active={vue === "specific-dates"}
            dirty={c.specificDirty}
            onSelect={setVue}
            title={t("typeSelection.specificDates.title")}
            description={t("typeSelection.specificDates.description")}
          />
        </div>

        {c.loading ? (
          <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </Card>
        ) : vue === "weekly" ? (
          <Card className="mt-4 space-y-8 p-6" role="tabpanel">
            <WeekOverview weekly={c.state.weekly} errors={c.weeklyErrors} />

            <Section
              title={t("weekAvailabilities.title")}
              description={t("sections.weeklyHint")}
            >
              <WeekAvailabilitiesSelection
                weekly={c.state.weekly}
                errors={c.weeklyErrors}
                onChange={(weekly: Record<string, WeekDay>) =>
                  c.setState((prev) => ({ ...prev, weekly }))
                }
              />
            </Section>

            <Section
              title={t("sections.periodTitle")}
              description={t("sections.periodHint")}
            >
            <DateRangeSelection
              dateRange={c.state.dateRange.range}
              alwaysApplies={c.state.dateRange.alwaysApplies}
              onChange={(range) =>
                c.setState((prev) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, range },
                }))
              }
              onToggleAlways={(value) =>
                c.setState((prev) => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    alwaysApplies: value,
                    ...(value ? { range: null } : {}),
                  },
                }))
              }
            />
            </Section>

            <Section
              title={t("blockSpecificDates.title")}
              description={t("sections.blockedHint")}
            >
            <BlockSpecificDatesSelection
              blockEnabled={c.state.exceptions.enabled}
              onToggleBlock={(enabled) =>
                c.setState((prev) => ({
                  ...prev,
                  exceptions: { ...prev.exceptions, enabled },
                }))
              }
              exceptions={c.state.exceptions.dates}
              errors={c.exceptionErrors}
              onChange={(dates: Exception[]) =>
                c.setState((prev) => ({
                  ...prev,
                  exceptions: { ...prev.exceptions, dates },
                }))
              }
            />
            </Section>

            <SaveButton
              onClick={enregistrerSemaine}
              saving={c.savingWeekly}
              blocked={erreursSemaine > 0}
              label={t("actions.set")}
              savingLabel={t("actions.setting")}
              blockedHint={t("errors.fixBeforeSaving")}
            />
          </Card>
        ) : (
          <Card className="mt-4 p-6" role="tabpanel">
            <SpecificDatesSelection
              exceptions={dateSelections}
              errors={c.specificErrors}
              onChange={majDatesPonctuelles}
              label={t("text.selectLabel")}
            />

            <SaveButton
              onClick={enregistrerDates}
              saving={c.savingSpecific}
              blocked={erreursDates > 0}
              label={t("actions.saveDates")}
              savingLabel={t("actions.savingDates")}
              blockedHint={t("errors.fixBeforeSaving")}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * Dit si une configuration existe. Rien ne distinguait jusqu'ici un horaire
 * réellement enregistré des valeurs par défaut du formulaire.
 *
 * Les tables ne portent aucun horodatage : on ne peut donc pas afficher
 * « enregistré le … » sans une migration.
 */
function StatusBanner({
  loading,
  configured,
  datesCount,
}: {
  loading: boolean;
  configured: boolean;
  datesCount: number;
}) {
  const t = useTranslations("admin.availabilities.status");

  if (loading) return <Skeleton className="h-12 w-full rounded-lg" />;

  const Icon = configured ? CalendarCheck : CalendarX;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-sm",
        configured
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
      )}
      role="status"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        {configured ? t("configured") : t("notConfigured")}
        {" — "}
        {t("datesCount", { count: datesCount })}
      </span>
    </div>
  );
}

/** Un titre, une phrase d'explication, puis le contenu. La carte enchainait
 *  trois sujets sans separation : horaire, periode de validite, dates bloquees. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function VueTab({
  id,
  active,
  dirty,
  onSelect,
  title,
  description,
}: {
  id: Vue;
  active: boolean;
  dirty: boolean;
  onSelect: (vue: Vue) => void;
  title: string;
  description: string;
}) {
  const t = useTranslations("admin.availabilities.status");

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(id)}
      className={cn(
        "flex-1 rounded-lg border-2 p-4 text-center transition-colors",
        active
          ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30"
          : "hover:border-cyan-500",
      )}
    >
      <span className="flex items-center justify-center gap-2 font-semibold">
        {title}
        {dirty && (
          // Signale que l'autre vue porte des modifications non enregistrees :
          // changer d'onglet ne les perd pas, mais rien ne le disait.
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {t("unsaved")}
          </span>
        )}
      </span>
      <span className="mt-1 block text-sm text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function SaveButton({
  onClick,
  saving,
  blocked,
  label,
  savingLabel,
  blockedHint,
}: {
  onClick: () => void;
  saving: boolean;
  blocked: boolean;
  label: string;
  savingLabel: string;
  blockedHint: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button
        type="button"
        onClick={onClick}
        // Desactive pendant l'envoi seulement : une erreur de saisie ne doit
        // pas rendre le bouton inerte sans explication.
        disabled={saving}
        aria-describedby={blocked ? "save-blocked" : undefined}
        className="w-fit bg-cyan-500 text-base font-semibold text-white transition-colors hover:bg-cyan-600"
      >
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {savingLabel}
          </span>
        ) : (
          label
        )}
      </Button>
      {blocked && (
        <p id="save-blocked" className="text-sm text-destructive">
          {blockedHint}
        </p>
      )}
    </div>
  );
}
