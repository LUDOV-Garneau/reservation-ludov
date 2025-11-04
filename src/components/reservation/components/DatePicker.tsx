"use client";

import { Calendar } from "@/components/ui/calendar";
import { DatesBlocked } from "@/types/availabilities";
import { frCA, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Matcher } from "react-day-picker";

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
  const datesBlocked = getDatesBlocked();

  function getDatesBlocked(): Matcher[] | boolean {
    const blocks: Matcher[] = [];

    if (!unavailableDates) {
      return true;
    }

    if (unavailableDates.before && unavailableDates.before > new Date()) {
      blocks.push({ before: unavailableDates.before });
    } else {
      blocks.push({ before: new Date(Date.now() + 60 * 60 * 24 * 1000) });
    }

    if (unavailableDates.after) {
      blocks.push({ after: unavailableDates.after });
    }

    if (unavailableDates.dayOfWeek.length > 0) {
      blocks.push({ dayOfWeek: unavailableDates.dayOfWeek });
    }

    return blocks;
  }

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
