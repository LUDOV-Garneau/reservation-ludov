"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SpecificDatesSelection from "./SpecificDatesSelection";
import { useTranslations } from "next-intl";
import { Exception, DateSelection } from "@/types/availabilities";
import type { RangeErrorCode } from "@/lib/availabilityValidation";

type Props = {
  blockEnabled: boolean;
  exceptions: Exception[];
  /** Erreurs par jour « YYYY-MM-DD », transmises au selecteur de dates. */
  errors?: Record<string, RangeErrorCode>;
  onChange: (exceptions: Exception[]) => void;
  onToggleBlock: (enabled: boolean) => void;
};

/** Projection 1:1, pas un aplatissement : les noms d'origine
 *  (« flatten » / « group ») decrivaient une operation qui n'a jamais eu lieu. */
function versSelections(exceptions: Exception[]): DateSelection[] {
  return exceptions.map(({ date, timeRange }) => ({
    date,
    startHour: timeRange.startHour,
    startMinute: timeRange.startMinute,
    endHour: timeRange.endHour,
    endMinute: timeRange.endMinute,
  }));
}

function versExceptions(selections: DateSelection[]): Exception[] {
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
  errors,
  onChange,
  onToggleBlock,
}: Props) {
  const t = useTranslations();

  const dateSelections = versSelections(exceptions);

  function handleDateSelectionsChange(newSelections: DateSelection[]) {
    const newExceptions = versExceptions(newSelections);
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
          errors={errors}
          onChange={handleDateSelectionsChange}
        />
      )}
    </div>
  );
}
