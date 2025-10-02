"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "@/components/reservation/components/DatePicker";
import { TimePicker } from "@/components/reservation/components/TimePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function DateSelection() {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    if (date) {
      onSelectDate(date);
    }
  }, []);

  const onSelectDate = async (newDate: Date | undefined) => {
    if (newDate === undefined) return;

    setIsLoading(true);
    setTime("");
    setAvailableTimes([]);
    setDate(newDate);

    try {
      const dateString = newDate.toISOString().split("T")[0];
      const response = await fetch(
        `/api/reservation/calendar?date=${encodeURIComponent(dateString)}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableTimes(data.availableTimes);
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[white] rounded-2xl px-10 py-10">
      <div className="flex justify-between items-start">
        <h2 className="text-4xl mb-4">{t("reservation.calendar.title")}</h2>
        <Button>{t("reservation.calendar.continueBtn")}</Button>
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-10">
        <DatePicker selected={date} onSelect={onSelectDate} />

        {isLoading ? (
          <div className="grid grid-flow-col gap-2 justify-center grid-rows-[repeat(7,auto)]">
            {Array(9)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-9 w-25 rounded-md bg-gray-300" />
              ))}
          </div>
        ) : availableTimes.length === 0 ? (
          <p>{t("reservation.calendar.noValidDate")}</p>
        ) : (
          <TimePicker
            times={availableTimes}
            selectedTime={time}
            onSelect={setTime}
          />
        )}
      </div>
    </div>
  );
}
