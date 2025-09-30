"use client";
import { useState } from "react";
import { DatePicker } from "@/components/reservation/DatePicker";
import { TimePicker } from "@/components/reservation/TimePicker";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Calendrier() {
  const t = useTranslations();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");

  const onSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    setTime("");
  };

  return (
    <div className="bg-[white] rounded-2xl px-10 py-10">
      <div className="flex justify-between items-start">
        <h2 className="text-4xl mb-4">{t("reservation.calendar.title")}</h2>
        <Button>{t("reservation.calendar.continueBtn")}</Button>
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-10">
        <DatePicker selected={date} onSelect={onSelectDate} />
        <TimePicker selectedTime={time} onSelect={setTime} />
      </div>
    </div>
  );
}
