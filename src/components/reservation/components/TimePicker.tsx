"use client";

import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TimeSlot = {
  time: string;
  available: boolean;
  conflicts?: {
    console?: boolean;
    games?: number[];
    accessories?: number[];
    station?: boolean;
    past?: boolean;
  };
};

type TimePickerProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  times: TimeSlot[];
};

export const TimePicker = memo(function TimePicker({
  selectedTime,
  onSelect,
  times,
}: TimePickerProps) {
  const t = useTranslations();

  const formatTime = (time: string): string => {
    return time.slice(0, 5);
  };

  const getConflictReason = (slot: TimeSlot) => {
    if (!slot.conflicts) return null;
    if (slot.conflicts.past) return t("reservation.calendar.conflicts.past");
    if (slot.conflicts.console)
      return t("reservation.calendar.conflicts.console");
    if (slot.conflicts.games) return t("reservation.calendar.conflicts.games");
    if (slot.conflicts.accessories)
      return t("reservation.calendar.conflicts.accessories");
    if (slot.conflicts.station)
      return t("reservation.calendar.conflicts.station");
    return t("reservation.calendar.conflicts.unavailable");
  };

  if (times.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">
          {t("reservation.calendar.noValidTimeSlot")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-4">
        {t("reservation.calendar.nSlotsAvailable", {
          count: times.filter((t) => t.available).length,
          plural: times.filter((t) => t.available).length > 1 ? "s" : "",
        })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
        <TooltipProvider>
          {times.map((time) => {
            const isSelected = selectedTime === time.time;
            const conflictReason = getConflictReason(time);

            return (
              <Tooltip key={time.time} delayDuration={300}>
                <TooltipTrigger asChild>
                  <span tabIndex={!time.available ? 0 : -1} className="w-full">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        w-full h-14 text-base font-semibold transition-all
                        ${isSelected
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md scale-105"
                          : "hover:border-cyan-400 hover:bg-cyan-50"
                        }
                        ${!time.available
                          ? "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100 hover:border-gray-200"
                          : ""
                        }
                      `}
                      onClick={() => time.available && onSelect(time.time)}
                      disabled={!time.available}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {formatTime(time.time)}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!time.available && conflictReason && (
                  <TooltipContent>
                    <p>{conflictReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {selectedTime && (
        <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <p className="text-sm text-cyan-900">
            <span className="font-semibold">
              {t("reservation.calendar.durationLabel")} :
            </span>{" "}
            {t("reservation.calendar.durationValue")}
            <span className="mx-2">•</span>
            <span className="font-semibold">
              {t("reservation.calendar.endLabel")} :
            </span>{" "}
            {formatTime(addTwoHours(selectedTime))}
          </p>
        </div>
      )}
    </div>
  );
});

function addTwoHours(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + 120;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMinutes
    .toString()
    .padStart(2, "0")}:00`;
}
