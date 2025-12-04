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
import { Copy, Trash2 } from "lucide-react";
import { DateSelection } from "@/types/availabilities";

type TimeKey = "startHour" | "startMinute" | "endHour" | "endMinute";

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
            className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center p-3 border-b last:border-none"
          >
            <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-fit justify-start whitespace-nowrap px-3"
                  >
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

              <div className="flex items-center gap-2">
                <Select
                  value={item.startHour}
                  onValueChange={(val) => updateTime(idx, "startHour", val)}
                >
                  <SelectTrigger className="text-sm text-center px-2 py-2">
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
                  <SelectTrigger className="text-sm text-center px-2 py-2">
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
                  <SelectTrigger className="text-sm text-center px-2 py-2">
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
                  <SelectTrigger className="text-sm text-center px-2 py-2">
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
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="text-muted-foreground text-xs hover:underline"
                type="button"
                onClick={() => duplicateDate(idx)}
              >
                <Copy className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">
                  {t("admin.availabilities.specificDates.duplicate")}
                </span>
              </button>
              <button
                className="text-red-600 text-xs hover:underline"
                type="button"
                onClick={() => removeDate(idx)}
              >
                <Trash2 className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">
                  {t("admin.availabilities.specificDates.remove")}
                </span>
              </button>
            </div>
          </div>
        ))}
        <button
          className="block w-full text-left text-cyan-500 hover:text-cyan-700 py-4 px-4 text-sm hover:underline"
          type="button"
          onClick={addDate}
        >
          {t("admin.availabilities.specificDates.addNew")}
        </button>
      </div>
    </div>
  );
}
