"use client";

import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import SpecificDatesSelection from "./SpecificDatesSelection";
import WeekAvailabilitiesSelection from "./WeekAvailabilitiesSelection";
import AvailabilitiesTypeSelection from "./AvailabilitiesTypeSelection";
import DateRangeSelection from "./DateRangeSelection";
import BlockSpecificDatesSelection, {
  flattenExceptionsToDateSelections,
  groupDateSelectionsToExceptions,
} from "./BlockSpecificDatesSelection";
import { toast } from "sonner";
import {
  HourRange,
  WeekDay,
  Exception,
  AvailabilityState,
  fetchAvailabilities,
  DateSelection,
} from "@/types/availabilities";

const defaultHR: HourRange = {
  id: 0,
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
  const [isLoading, setIsLoading] = useState(false);

  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(
    {
      weekly: defaultW,
      dateRange: { alwaysApplies: false, range: null },
      exceptions: { enabled: false, dates: [] },
    }
  );
  const [specificDates, setSpecificDates] = useState<Exception[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("weekly");
  const [errors, setErrors] = useState<string[]>([]);
  const [specificDatesErrors, setSpecificDatesErrors] = useState<string[]>([]);

  const dateSelections = flattenExceptionsToDateSelections(specificDates);

  const handleSpecificDatesChange = (newSelections: DateSelection[]) =>
    setSpecificDates(groupDateSelectionsToExceptions(newSelections));

  const toMinutes = (hour: string, minute: string) =>
    parseInt(hour) * 60 + parseInt(minute);

  function validateHourRanges(ranges: HourRange[]) {
    const sorted = [...ranges].sort(
      (a, b) =>
        toMinutes(a.startHour, a.startMinute) -
        toMinutes(b.startHour, b.startMinute)
    );

    for (let i = 0; i < sorted.length; i++) {
      const start = toMinutes(sorted[i].startHour, sorted[i].startMinute);
      const end = toMinutes(sorted[i].endHour, sorted[i].endMinute);
      if (end <= start) {
        return t("admin.availabilities.errors.invalidRange");
      }

      if (i > 0) {
        const prevEnd = toMinutes(
          sorted[i - 1].endHour,
          sorted[i - 1].endMinute
        );
        if (start < prevEnd) {
          return t("admin.availabilities.errors.overlap");
        }
      }
    }

    return null;
  }

  useEffect(() => {
    async function loadInitialValues() {
      try {
        const response = await fetch("/api/admin/week-availabilities", {
          credentials: "include",
        });
        if (!response.ok) {
          toast.error(t("admin.availabilities.errors.fetchAvailabilities"));
          return;
        }
        const data = (await response.json()) as fetchAvailabilities;

        const parsedAvailability: Partial<AvailabilityState> = {
          dateRange: {
            ...data.availability.dateRange,
            range: data.availability.dateRange.range
              ? {
                  startDate: data.availability.dateRange.range.startDate
                    ? new Date(data.availability.dateRange.range.startDate)
                    : null,
                  endDate: data.availability.dateRange.range.endDate
                    ? new Date(data.availability.dateRange.range.endDate)
                    : null,
                }
              : null,
          },
          exceptions: {
            ...data.availability.exceptions,
            dates: data.availability.exceptions.dates.map((ex) => ({
              ...ex,
              date: new Date(ex.date),
            })),
          },
        };

        if (
          data.availability.weekly &&
          Object.keys(data.availability.weekly).length > 0
        ) {
          const days = Object.keys(data.availability.weekly);

          const newWeekly: Record<string, WeekDay> = {};

          for (const day of days) {
            const weekDay = data.availability.weekly[day];

            let hoursRanges = weekDay.hoursRanges;
            if (!Array.isArray(hoursRanges) || hoursRanges.length === 0) {
              hoursRanges = [defaultHR];
            }

            newWeekly[day] = {
              ...weekDay,
              hoursRanges: hoursRanges,
            };
          }

          parsedAvailability.weekly = newWeekly;
        }

        setAvailabilityState((defaultAvailabilities) => ({
          ...defaultAvailabilities,
          ...parsedAvailability,
        }));
        setSpecificDates(
          data.specificDates.map((d) => ({
            ...d,
            date: new Date(d.date),
          }))
        );
      } catch {
        toast.error(t("admin.availabilities.errors.fetchAvailabilities"));
      }
    }

    loadInitialValues();
  }, []);

  useEffect(() => {
    const newErrors: string[] = [];

    for (const [day, { enabled, hoursRanges }] of Object.entries(
      availabilityState.weekly
    )) {
      if (!enabled) {
        continue;
      }

      const error = validateHourRanges(hoursRanges);
      if (error)
        newErrors.push(
          t("admin.availabilities.errors.exception", {
            date: t(`admin.availabilities.days.${day}`).toLowerCase(),
            error: error,
          })
        );
    }

    if (availabilityState.exceptions.enabled) {
      const exceptionsByDate = availabilityState.exceptions.dates.reduce(
        (acc, exception) => {
          const dateKey = exception.date.toLocaleDateString();
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(exception.timeRange);
          return acc;
        },
        {} as Record<string, HourRange[]>
      );

      for (const [dateStr, hourRanges] of Object.entries(exceptionsByDate)) {
        const err = validateHourRanges(hourRanges);
        if (err)
          newErrors.push(
            t("admin.availabilities.errors.exception", {
              date: dateStr,
              error: err,
            })
          );
      }
    }

    setErrors(newErrors);
  }, [availabilityState]);

  useEffect(() => {
    const newErrors: string[] = [];

    const exceptionsByDate = specificDates.reduce((acc, exception) => {
      const dateKey = exception.date.toLocaleDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(exception.timeRange);
      return acc;
    }, {} as Record<string, HourRange[]>);

    for (const [dateStr, hourRanges] of Object.entries(exceptionsByDate)) {
      const error = validateHourRanges(hourRanges);
      if (error) {
        newErrors.push(
          t("admin.availabilities.errors.exception", {
            date: dateStr,
            error: error,
          })
        );
      }

      setSpecificDatesErrors(newErrors);
    }
  }, [specificDates]);

  function updateWeekly(updatedWeekly: Record<string, WeekDay>) {
    setAvailabilityState((previous) => ({
      ...previous,
      weekly: updatedWeekly,
    }));
  }

  function updateDateRange(
    range: { startDate: Date | null; endDate: Date | null } | null
  ) {
    setAvailabilityState((previous) => ({
      ...previous,
      dateRange: { ...previous.dateRange, range: range },
    }));
  }

  function updateExceptions(updatedExceptions: Exception[]) {
    setAvailabilityState((previous) => ({
      ...previous,
      exceptions: { ...previous.exceptions, dates: updatedExceptions },
    }));
  }

  async function handleSubmitWeekly() {
    if (errors.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/week-availabilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(availabilityState),
        credentials: "include",
      });
      setIsLoading(false);

      if (!response.ok) {
        toast.error(t("admin.availabilities.errors.savingAvailabilities"));
        return;
      }

      toast.success(t("admin.availabilities.messages.savedWeekly"));
    } catch {
      setIsLoading(false);
      toast.error(t("admin.availabilities.errors.savingAvailabilities"));
    }
  }

  async function handleSubmitSpecificDates() {
    if (specificDatesErrors.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/specific-availabilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(specificDates),
        credentials: "include",
      });
      setIsLoading(false);

      if (!response.ok) {
        toast.error(t("admin.availabilities.errors.savingAvailabilities"));
        return;
      }

      toast.success(t("admin.availabilities.messages.savedSpecific"));
    } catch {
      setIsLoading(false);
      toast.error(t("admin.availabilities.errors.savingAvailabilities"));
    }
  }

  return (
    <TabsContent value="availabilities" className="max-w-5xl mx-auto">
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
            dateRange={availabilityState.dateRange.range}
            alwaysApplies={availabilityState.dateRange.alwaysApplies}
            onChange={updateDateRange}
            onToggleAlways={(value) =>
              setAvailabilityState((prev) => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  alwaysApplies: value,
                  ...(value ? { range: null } : {}),
                },
              }))
            }
          />
          <BlockSpecificDatesSelection
            blockEnabled={availabilityState.exceptions.enabled}
            onToggleBlock={(enabled) =>
              setAvailabilityState((prev) => ({
                ...prev,
                exceptions: {
                  ...prev.exceptions,
                  enabled: enabled,
                },
              }))
            }
            exceptions={availabilityState.exceptions.dates}
            onChange={updateExceptions}
          />
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          <Button
            disabled={
              isLoading ||
              (!availabilityState.dateRange.alwaysApplies &&
                availabilityState.dateRange.range == null) ||
              errors.length > 0
            }
            onClick={handleSubmitWeekly}
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
          >
            {isLoading
              ? t("admin.availabilities.actions.setting")
              : t("admin.availabilities.actions.set")}
          </Button>
        </Card>
      )}

      {selectedCard === "specific-dates" && (
        <Card className="p-6 mt-4">
          <SpecificDatesSelection
            exceptions={dateSelections}
            onChange={handleSpecificDatesChange}
            label={t("admin.availabilities.text.selectLabel")}
          />
          {specificDatesErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {specificDatesErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
          <Button
            disabled={isLoading || specificDatesErrors.length > 0}
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
            onClick={handleSubmitSpecificDates}
          >
            {isLoading
              ? t("admin.availabilities.actions.savingDates")
              : t("admin.availabilities.actions.saveDates")}
          </Button>
        </Card>
      )}
    </TabsContent>
  );
}
