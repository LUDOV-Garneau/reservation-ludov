"use client";

import { Calendar } from "@/components/ui/calendar";
import { DatesBlocked } from "@/types/availabilities";
import { frCA, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

type DisabledMatcher =
  | [{ before: Date }, { after: Date }, { dayOfWeek: number[] }]
  | [{ before: Date }, { after: Date }]
  | [{ dayOfWeek: number[] }];

type DatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  unavailableDates: DatesBlocked | null;
};

export function DatePicker({
  selected,
  onSelect,
  unavailableDates,
}: DatePickerProps) {
  const locale = useLocale();
  const datesBlocked: DisabledMatcher | null = () => {
    if (!unavailableDates) {
      return null;
    }

    const matcher = [];

    if (unavailableDates.after && unavailableDates.before) {
      if (unavailableDates.after > new Date()) {
        matcher.push({ after: unavailableDates.after });
      } else {
        matcher.push({ after: new Date() });
      }
      matcher.push({ before: unavailableDates.before });
    }

    if (unavailableDates.dayOfWeek.length > 0) {
      matcher.push({ dayOfWeek: unavailableDates.dayOfWeek });
    }

    return matcher;
  };

  return (
    <Calendar
      mode="single"
      locale={locale === "fr" ? frCA : enUS}
      defaultMonth={selected}
      selected={selected}
      onSelect={onSelect}
      disabled={datesBlocked}
      className="rounded-lg border shadow-sm text-lg p-4 sm:[&_button]:h-12 sm:[&_button]:w-12 sm:[&_button]:text-lg"
    />
  );
}
