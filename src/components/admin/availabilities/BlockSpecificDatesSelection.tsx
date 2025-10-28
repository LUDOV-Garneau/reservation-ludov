"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SpecificDatesSelection from "./SpecificDatesSelection";
import { useTranslations } from "next-intl";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type Exception = {
  date: Date;
  timeRange: HourRange;
};

type DateSelection = {
  date: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type Props = {
  blockEnabled: boolean;
  exceptions: Exception[];
  onChange: (exceptions: Exception[]) => void;
  onToggleBlock: (enabled: boolean) => void;
};

export function flattenExceptionsToDateSelections(
  exceptions: Exception[]
): DateSelection[] {
  return exceptions.map(({ date, timeRange }) => ({
    date,
    startHour: timeRange.startHour,
    startMinute: timeRange.startMinute,
    endHour: timeRange.endHour,
    endMinute: timeRange.endMinute,
  }));
}

export function groupDateSelectionsToExceptions(
  selections: DateSelection[]
): Exception[] {
  return selections.map((sel, idx) => ({
    date: sel.date,
    timeRange: {
      id: idx,
      startHour: sel.startHour,
      startMinute: sel.startMinute,
      endHour: sel.endHour,
      endMinute: sel.endMinute,
    },
  }));
}

export default function BlockSpecificDatesSelection({
  blockEnabled,
  exceptions,
  onChange,
  onToggleBlock,
}: Props) {
  const t = useTranslations();

  const dateSelections = flattenExceptionsToDateSelections(exceptions);

  function handleDateSelectionsChange(newSelections: DateSelection[]) {
    const newExceptions = groupDateSelectionsToExceptions(newSelections);
    onChange(newExceptions);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 mt-8">
        <Switch
          checked={blockEnabled}
          onCheckedChange={onToggleBlock}
          id="block-dates"
        />
        <Label htmlFor="block-dates" className="font-bold">
          {t("admin.availabilities.blockSpecificDates.title")}
        </Label>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t("admin.availabilities.blockSpecificDates.description")}
        &nbsp;
        <span className="font-semibold">
          {t("admin.availabilities.blockSpecificDates.highlight")}
        </span>
        &nbsp;
        {t("admin.availabilities.blockSpecificDates.remaining")}
      </p>

      {blockEnabled && (
        <SpecificDatesSelection
          exceptions={dateSelections}
          onChange={handleDateSelectionsChange}
        />
      )}
    </div>
  );
}
