"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

type TimeKey = "startHour" | "startMinute" | "endHour" | "endMinute";

export type DateSelection = {
  date: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type Props = {
  exceptions?: DateSelection[];
  onChange?: (dates: DateSelection[]) => void;
  label?: string;
};

export default function SpecificDatesSelection({
  exceptions = [],
  onChange = () => {},
  label,
}: Props) {
  const t = useTranslations();

  const [localDates, setLocalDates] = useState<DateSelection[]>(exceptions);

  useEffect(() => {
    setLocalDates(exceptions);
  }, [exceptions]);

  function updateDate(idx: number, value: Date) {
    const newDates = [...localDates];
    newDates[idx] = { ...newDates[idx], date: value };
    setLocalDates(newDates);
    onChange(newDates);
  }

  function updateTime(idx: number, key: TimeKey, value: string) {
    const newDates = [...localDates];
    newDates[idx] = { ...newDates[idx], [key]: value };
    setLocalDates(newDates);
    onChange(newDates);
  }

  function addDate() {
    const newDates = [
      ...localDates,
      {
        date: new Date(),
        startHour: "09",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ];
    setLocalDates(newDates);
    onChange(newDates);
  }

  function removeDate(idx: number) {
    const newDates = localDates.filter((_, i) => i !== idx);
    setLocalDates(newDates);
    onChange(newDates);
  }

  function duplicateDate(idx: number) {
    const newDates = [...localDates, { ...localDates[idx] }];
    setLocalDates(newDates);
    onChange(newDates);
  }

  return (
    <div>
      {label && <strong className="block text-lg mb-2">{label}</strong>}
      <div className="rounded-md border">
        {localDates.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-wrap gap-3 items-center p-3 border-b last:border-none"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-36 justify-start">
                  {item.date
                    ? format(item.date, "MM / dd / yyyy")
                    : t("admin.availabilities.specificDates.pickDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={item.date}
                  onSelect={(date) => date && updateDate(idx, date)}
                />
              </PopoverContent>
            </Popover>
            <Select
              value={item.startHour}
              onValueChange={(val) => updateTime(idx, "startHour", val)}
            >
              <SelectTrigger className="w-11 text-sm text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }).map((_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select
              value={item.startMinute}
              onValueChange={(val) => updateTime(idx, "startMinute", val)}
            >
              <SelectTrigger className="w-11 text-sm text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }).map((_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <span>-</span>
            <Select
              value={item.endHour}
              onValueChange={(val) => updateTime(idx, "endHour", val)}
            >
              <SelectTrigger className="w-11 text-sm text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }).map((_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select
              value={item.endMinute}
              onValueChange={(val) => updateTime(idx, "endMinute", val)}
            >
              <SelectTrigger className="w-11 text-sm text-center">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }).map((_, i) => {
                  const val = i.toString().padStart(2, "0");
                  return (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <button
              className="ml-3 text-muted-foreground text-xs hover:underline"
              type="button"
              onClick={() => duplicateDate(idx)}
            >
              {t("admin.availabilities.specificDates.duplicate")}
            </button>
            <button
              className="ml-1 text-red-600 text-xs hover:underline"
              type="button"
              onClick={() => removeDate(idx)}
            >
              {t("admin.availabilities.specificDates.remove")}
            </button>
          </div>
        ))}
        <button
          className="block w-full text-left text-[#02dcde] py-4 px-4 text-sm hover:underline"
          type="button"
          onClick={addDate}
        >
          {t("admin.availabilities.specificDates.addNew")}
        </button>
      </div>
    </div>
  );
}
