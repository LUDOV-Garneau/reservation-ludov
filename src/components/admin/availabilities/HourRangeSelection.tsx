"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
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
  onModify: (updatedRange: {
    startHour: string;
    startMinute: string;
    endHour: string;
    endMinute: string;
  }) => void;
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
  onModify,
}: HourRangeSelectionProps) {
  const t = useTranslations();

  const [startHour, setStartHour] = useState(startH);
  const [startMinute, setStartMinute] = useState(startM);
  const [endHour, setEndHour] = useState(endH);
  const [endMinute, setEndMinute] = useState(endM);

  useEffect(() => {
    setStartHour(startH);
  }, [startH]);
  useEffect(() => {
    setStartMinute(startM);
  }, [startM]);
  useEffect(() => {
    setEndHour(endH);
  }, [endH]);
  useEffect(() => {
    setEndMinute(endM);
  }, [endM]);

  function onChange(
    newStartHour: string,
    newStartMinute: string,
    newEndHour: string,
    newEndMinute: string
  ) {
    onModify({
      startHour: newStartHour,
      startMinute: newStartMinute,
      endHour: newEndHour,
      endMinute: newEndMinute,
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 col-span-2">
        <Select
          value={startHour}
          onValueChange={(val) => {
            setStartHour(val);
            onChange(val, startMinute, endHour, endMinute);
          }}
        >
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
        <Select
          value={startMinute}
          onValueChange={(val) => {
            setStartMinute(val);
            onChange(startHour, val, endHour, endMinute);
          }}
        >
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
        <Select
          value={endHour}
          onValueChange={(val) => {
            setEndHour(val);
            onChange(startHour, startMinute, val, endMinute);
          }}
        >
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
        <Select
          value={endMinute}
          onValueChange={(val) => {
            setEndMinute(val);
            onChange(startHour, startMinute, endHour, val);
          }}
        >
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
            {t("admin.availabilities.actions.remove")}
          </Button>
        )}
        {showAddButton && (
          <Button
            variant="link"
            className="text-[#02dcde] text-xs !p-2"
            onClick={addRow}
          >
            {t("admin.availabilities.actions.add")}
          </Button>
        )}
      </div>
    </>
  );
}
