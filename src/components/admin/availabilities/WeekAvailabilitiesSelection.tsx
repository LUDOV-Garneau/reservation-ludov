"use client";

import { useTranslations } from "next-intl";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import HourRangeSelection from "./HourRangeSelection";
import { HourRange, WeekDay } from "@/types/availabilities";
import type { RangeErrorCode } from "@/lib/availabilityValidation";
import RangeErrorMessage from "./RangeErrorMessage";
import { cn } from "@/lib/utils";

type Props = {
  weekly: Record<string, WeekDay>;
  /** Erreur eventuelle par jour, affichee sous les plages de ce jour. */
  errors?: Record<string, RangeErrorCode>;
  onChange: (updatedWeekly: Record<string, WeekDay>) => void;
};

export default function WeekAvailabilitiesSelection({
  weekly,
  errors = {},
  onChange,
}: Props) {
  const t = useTranslations();

  function setEnabled(id: string, value: boolean) {
    const updated = {
      ...weekly,
      [id]: { ...weekly[id], enabled: value },
    };
    onChange(updated);
  }

  function addHoursRange(dayId: string, newId: number) {
    const day = weekly[dayId];
    const updated = {
      ...weekly,
      [dayId]: {
        ...day,
        hoursRanges: [
          ...day.hoursRanges,
          {
            id: newId,
            startHour: "08",
            startMinute: "00",
            endHour: "17",
            endMinute: "00",
          },
        ],
      },
    };
    onChange(updated);
  }

  function modifyHoursRange(dayId: string, updatedRange: HourRange) {
    const day = weekly[dayId];
    const updatedRanges = day.hoursRanges.map((r) =>
      r.id === updatedRange.id ? updatedRange : r
    );
    const updated = {
      ...weekly,
      [dayId]: {
        ...day,
        hoursRanges: updatedRanges,
      },
    };
    onChange(updated);
  }

  function removeHoursRange(dayId: string, idHourRange: number) {
    const day = weekly[dayId];
    const updated = {
      ...weekly,
      [dayId]: {
        ...day,
        hoursRanges: day.hoursRanges.filter((r) => r.id !== idHourRange),
      },
    };
    onChange(updated);
  }

  return (
    <div className="divide-y rounded-lg border">
      {Object.entries(weekly).map(([id, { label, enabled, hoursRanges }]) => {
        // `Math.max` sur un tableau vide vaut -Infinity : sans ce repli, un
        // jour sans plage n'offrirait plus de bouton d'ajout.
        const maxId = hoursRanges.length
          ? Math.max(...hoursRanges.map((r) => r.id))
          : 0;
        return (
          <div
            key={id}
            className={cn(
              "grid grid-cols-1 items-start gap-3 px-4 py-3 md:grid-cols-[11rem_1fr] transition-colors",
              // Un jour fermé recule visuellement : la semaine se lit d'abord
              // par ses jours ouverts.
              enabled ? "bg-background" : "bg-muted/30",
              errors[id] && "bg-destructive/5",
            )}
          >
            <div className="flex items-center gap-3">
              <Switch
                id={id}
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(id, checked)}
              />
              <Label
                htmlFor={id}
                className={cn(
                  "font-medium capitalize",
                  !enabled && "text-muted-foreground",
                )}
              >
                {t(`admin.availabilities.days.${label}`)}
              </Label>
            </div>

            {enabled ? (
              <div className="flex w-full flex-col gap-2">
                {hoursRanges.map((timeRange) => (
                  <HourRangeSelection
                    key={timeRange.id}
                    startH={timeRange.startHour}
                    startM={timeRange.startMinute}
                    endH={timeRange.endHour}
                    endM={timeRange.endMinute}
                    showRemoveButton={hoursRanges.length > 1}
                    invalid={Boolean(errors[id])}
                    showAddButton={timeRange.id === maxId}
                    addRow={() => addHoursRange(id, maxId + 1)}
                    onModify={(range) =>
                      modifyHoursRange(id, { ...range, id: timeRange.id })
                    }
                    removeRow={() => removeHoursRange(id, timeRange.id)}
                  />
                ))}
                <RangeErrorMessage code={errors[id]} />
              </div>
            ) : (
              <span className="self-center text-sm italic text-muted-foreground">
                {t("admin.availabilities.weekAvailabilities.unavailableOn", {
                  day: t(
                    `admin.availabilities.days.${label}`
                  ).toLocaleLowerCase(),
                })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
