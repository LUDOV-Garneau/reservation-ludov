"use client";
import { useState } from "react";
import { DatePicker } from "@/components/reservation/DatePicker";
import { TimePicker } from "@/components/reservation/TimePicker";

export default function Calendrier() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");

  const onSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    setTime("");
  };

  return (
    <div className="flex flex-row gap-10">
      <div>
        <h2 className="text-2xl mb-4">Sélectionner une date:</h2>
        <DatePicker selected={date} onSelect={onSelectDate} />
      </div>
      <div>
        <h2 className="text-2xl mb-4">Sélectionnez l&apos;heure:</h2>
        <TimePicker selectedTime={time} onSelect={setTime} />
      </div>
    </div>
  );
}
