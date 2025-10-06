"use client";

import { useState } from "react";
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

type TimeKey = "startHour" | "startMinute" | "endHour" | "endMinute";

type DateSelection = {
  date: Date;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

export default function SpecificDatesSelection() {
  const [selectedDates, setSelectedDates] = useState<DateSelection[]>([]);

  function updateDate(idx: number, value: Date) {
    setSelectedDates((dates) => {
      const newDates = [...dates];
      newDates[idx].date = value;
      return newDates;
    });
  }

  function updateTime(idx: number, key: TimeKey, value: string) {
    setSelectedDates((dates) => {
      const newDates = [...dates];
      newDates[idx][key] = value;
      return newDates;
    });
  }

  function addDate() {
    setSelectedDates((dates) => [
      ...dates,
      {
        date: new Date(),
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ]);
  }

  function removeDate(idx: number) {
    setSelectedDates((dates) => dates.filter((_, i) => i !== idx));
  }

  function duplicateDate(idx: number) {
    setSelectedDates((dates) => [...dates, { ...dates[idx] }]);
  }

  return (
    <div className="rounded-md border">
      {selectedDates.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-wrap gap-3 items-center p-3 border-b last:border-none"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-36 justify-start">
                {item.date ? format(item.date, "MM / dd / yyyy") : "Pick date"}
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
            Duplicate
          </button>
          <button
            className="ml-1 text-red-600 text-xs hover:underline"
            type="button"
            onClick={() => removeDate(idx)}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="block w-full text-left text-[#02dcde] py-4 px-4 text-sm hover:underline"
        type="button"
        onClick={addDate}
      >
        + Add new date
      </button>
    </div>
  );
}
