"use client";

import { useTranslations } from "next-intl";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import HourRangeSelection from "./HourRangeSelection";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type WeekDay = {
  label: string;
  enabled: boolean;
  hoursRanges: HourRange[];
};

type Props = {
  weekly: Record<string, WeekDay>;
  onChange: (updatedWeekly: Record<string, WeekDay>) => void;
};

export default function WeekAvailabilitiesSelection({
  weekly,
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
    <>
      <strong className="block text-lg mb-2">
        {t("admin.availabilities.weekAvailabilities.title")}
      </strong>

      {Object.entries(weekly).map(([id, { label, enabled, hoursRanges }]) => {
        const minId = Math.min(...hoursRanges.map((r) => r.id));
        const maxId = Math.max(...hoursRanges.map((r) => r.id));
        return (
          <div
            key={id}
            className="grid grid-cols-3 py-4 px-2 border-b last:border-0 items-start"
          >
            <div className="flex items-center gap-3 mt-2">
              <Switch
                id={id}
                checked={enabled}
                onCheckedChange={(checked) => setEnabled(id, checked)}
              />
              <Label htmlFor={id} className="font-medium">
                {t(`admin.availabilities.days.${label}`)}
              </Label>
            </div>

            {enabled ? (
              <div className="col-span-2 flex flex-col gap-2">
                {hoursRanges.map((timeRange) => (
                  <HourRangeSelection
                    key={timeRange.id}
                    startH={timeRange.startHour}
                    startM={timeRange.startMinute}
                    endH={timeRange.endHour}
                    endM={timeRange.endMinute}
                    showRemoveButton={
                      hoursRanges.length > 1 && timeRange.id !== minId
                    }
                    showAddButton={timeRange.id === maxId}
                    addRow={() => addHoursRange(id, maxId + 1)}
                    onModify={(range) =>
                      modifyHoursRange(id, { ...range, id: timeRange.id })
                    }
                    removeRow={() => removeHoursRange(id, timeRange.id)}
                  />
                ))}
              </div>
            ) : (
              <span className="italic text-muted-foreground col-span-2">
                {t("admin.availabilities.weekAvailabilities.unavailableOn", {
                  day: t(`admin.availabilities.days.${label}`),
                })}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
