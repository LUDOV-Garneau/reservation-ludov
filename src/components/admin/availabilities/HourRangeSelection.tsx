"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

interface HourRangeSelectionProps {
  startH: string;
  startM: string;
  endH: string;
  endM: string;
  showRemoveButton: boolean;
  showAddButton: boolean;
  addRow: () => void;
  removeRow: () => void;
}

export default function HourRangeSelection({
  startH,
  startM,
  endH,
  endM,
  addRow,
  removeRow,
  showRemoveButton,
  showAddButton,
}: HourRangeSelectionProps) {
  const t = useTranslations();

  const [startHour, setStartHour] = useState(startH);
  const [startMinute, setStartMinute] = useState(startM);
  const [endHour, setEndHour] = useState(endH);
  const [endMinute, setEndMinute] = useState(endM);

  return (
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
        </Select>
        {showRemoveButton && (
          <Button
            variant="link"
            className="text-red-400 text-xs !p-2"
            onClick={removeRow}
          >
            Remove
          </Button>
        )}
        {showAddButton && (
          <Button
            variant="link"
            className="text-[#02dcde] text-xs !p-2"
            onClick={addRow}
          >
            + Add
          </Button>
        )}
      </div>
    </>
  );
}
