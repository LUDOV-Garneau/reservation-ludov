"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

const days = [
  { id: "sunday", label: "Sunday" },
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
];

export default function WeekAvailabilitiesSelection() {
  const t = useTranslations();

  const [enabled, setEnabled] = useState(false);
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");

  return (
    <>
      <strong className="block text-lg mb-2">
        Define your weekly availability below:
      </strong>
      {days.map(({ id, label }) => (
        <div
          key={id}
          className="grid grid-cols-3 py-4 px-2 border-b last:border-0"
        >
          <div className="flex items-center gap-3">
            <Switch id={id} checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor={id} className="font-medium">
              {label}
            </Label>
          </div>
          {enabled ? (
            <>
              <div className="flex items-center gap-2 col-span-2">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger className="w-11 text-sm text-center">
                    <SelectValue placeholder="08" />
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
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger className="w-11 text-sm text-center">
                    <SelectValue placeholder="00" />
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
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger className="w-11 text-sm text-center">
                    <SelectValue placeholder="17" />
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
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger className="w-11 text-sm text-center">
                    <SelectValue placeholder="00" />
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
                </Select>{" "}
                <Button variant="link" className="text-[#02dcde]">
                  + Add window
                </Button>
              </div>
            </>
          ) : (
            <span className="italic text-muted-foreground col-span-2">
              Unavailable on {label}s
            </span>
          )}
        </div>
      ))}
    </>
  );
}
