"use client";

import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import SpecificDatesSelection, {
  DateSelection,
} from "./SpecificDatesSelection";
import WeekAvailabilitiesSelection from "./WeekAvailabilitiesSelection";
import AvailabilitiesTypeSelection from "./AvailabilitiesTypeSelection";
import DateRangeSelection from "./DateRangeSelection";
import BlockSpecificDatesSelection from "./BlockSpecificDatesSelection";

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

type Exception = {
  date: Date;
  timeRange: HourRange;
};

type AvailabilityState = {
  weekly: Record<string, WeekDay>;
  dateRange: { startDate: Date | null; endDate: Date | null } | null;
  exceptions: Exception[];
};

const defaultHR: HourRange = {
  id: 1,
  startHour: "09",
  startMinute: "00",
  endHour: "17",
  endMinute: "00",
};

const defaultW: Record<string, WeekDay> = {
  sunday: { label: "sunday", enabled: false, hoursRanges: [defaultHR] },
  monday: { label: "monday", enabled: false, hoursRanges: [defaultHR] },
  tuesday: { label: "tuesday", enabled: false, hoursRanges: [defaultHR] },
  wednesday: { label: "wednesday", enabled: false, hoursRanges: [defaultHR] },
  thursday: { label: "thursday", enabled: false, hoursRanges: [defaultHR] },
  friday: { label: "friday", enabled: false, hoursRanges: [defaultHR] },
  saturday: { label: "saturday", enabled: false, hoursRanges: [defaultHR] },
};

export default function AvailabilitiesTab() {
  const t = useTranslations();

  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(
    {
      weekly: defaultW,
      dateRange: null,
      exceptions: [],
    }
  );

  const [specificDates, setSpecificDates] = useState<DateSelection[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("weekly");
  const [blockEnabled, setBlockEnabled] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [specificDatesErrors, setSpecificDatesErrors] = useState<string[]>([]);

  const toMinutes = (h: string, m: string) => parseInt(h) * 60 + parseInt(m);

  function validateHourRanges(ranges: HourRange[]) {
    const sorted = [...ranges].sort(
      (a, b) =>
        toMinutes(a.startHour, a.startMinute) -
        toMinutes(b.startHour, b.startMinute)
    );
    for (let i = 0; i < sorted.length; i++) {
      const start = toMinutes(sorted[i].startHour, sorted[i].startMinute);
      const end = toMinutes(sorted[i].endHour, sorted[i].endMinute);
      if (end <= start) return t("admin.availabilities.errors.invalidRange");
      if (i > 0) {
        const prevEnd = toMinutes(
          sorted[i - 1].endHour,
          sorted[i - 1].endMinute
        );
        if (start < prevEnd) return t("admin.availabilities.errors.overlap");
      }
    }
    return null;
  }

  useEffect(() => {
    const newErrors: string[] = [];
    for (const [day, { enabled, hoursRanges }] of Object.entries(
      availabilityState.weekly
    )) {
      if (!enabled) continue;
      const err = validateHourRanges(hoursRanges);
      if (err) newErrors.push(day + ": " + err);
    }
    for (const exception of availabilityState.exceptions) {
      const err = validateHourRanges([exception.timeRange]);
      if (err)
        newErrors.push(
          t("admin.availabilities.errors.exception", {
            date: exception.date.toLocaleDateString(),
            error: err,
          })
        );
    }
    setErrors(newErrors);
  }, [availabilityState, t]);

  useEffect(() => {
    const newErrors: string[] = [];
    for (const item of specificDates) {
      const err = validateHourRanges([
        {
          id: 0,
          startHour: item.startHour,
          startMinute: item.startMinute,
          endHour: item.endHour,
          endMinute: item.endMinute,
        },
      ]);
      if (err) newErrors.push(item.date.toLocaleDateString() + ": " + err);
    }
    setSpecificDatesErrors(newErrors);
  }, [specificDates, t]);

  function updateWeekly(updatedWeekly: Record<string, WeekDay>) {
    setAvailabilityState((prev) => ({ ...prev, weekly: updatedWeekly }));
  }
  function updateDateRange(
    range: { startDate: Date | null; endDate: Date | null } | null
  ) {
    setAvailabilityState((prev) => ({ ...prev, dateRange: range }));
  }
  function updateExceptions(updatedExceptions: Exception[]) {
    setAvailabilityState((prev) => ({
      ...prev,
      exceptions: updatedExceptions,
    }));
  }

  function handleSubmitWeekly() {
    if (errors.length > 0) {
      alert(
        t("admin.availabilities.errors.fixErrors", {
          errors: errors.join("\n"),
        })
      );
      return;
    }
    alert(t("admin.availabilities.messages.savedWeekly"));
    console.log("Weekly availabilities saved:", availabilityState);
  }

  function handleSubmitSpecificDates() {
    if (specificDatesErrors.length > 0) {
      alert(
        t("admin.availabilities.errors.fixErrors", {
          errors: specificDatesErrors.join("\n"),
        })
      );
      return;
    }
    alert(t("admin.availabilities.messages.savedSpecific"));
    console.log("Valid dates saved:", specificDates);
  }

  return (
    <TabsContent value="availabilities" className="mx-auto">
      <AvailabilitiesTypeSelection
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
      />

      {selectedCard === "weekly" && (
        <Card className="p-6 mt-4">
          <WeekAvailabilitiesSelection
            weekly={availabilityState.weekly}
            onChange={updateWeekly}
          />
          <DateRangeSelection
            dateRange={availabilityState.dateRange}
            onChange={updateDateRange}
          />
          <BlockSpecificDatesSelection
            blockEnabled={blockEnabled}
            onToggleBlock={setBlockEnabled}
            exceptions={availabilityState.exceptions}
            onChange={updateExceptions}
          />
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
          <Button
            onClick={handleSubmitWeekly}
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
          >
            {t("admin.availabilities.actions.set")}
          </Button>
        </Card>
      )}

      {selectedCard === "specific-dates" && (
        <Card className="p-6 mt-4">
          <SpecificDatesSelection
            exceptions={specificDates}
            onChange={setSpecificDates}
            label={t("admin.availabilities.text.selectLabel")}
          />
          {specificDatesErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {specificDatesErrors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
          <Button
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
            onClick={handleSubmitSpecificDates}
          >
            {t("admin.availabilities.actions.saveDates")}
          </Button>
        </Card>
      )}
    </TabsContent>
  );
}
