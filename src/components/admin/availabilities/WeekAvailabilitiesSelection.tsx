"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import HourRangeSelection from "./HourRangeSelection";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type WeekDay = {
  label: string;
  enabled: boolean;
  hoursRanges: HourRange[];
};

const daysDict: Record<string, WeekDay> = {
  sunday: {
    label: "Sunday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  monday: {
    label: "Monday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  tuesday: {
    label: "Tuesday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  wednesday: {
    label: "Wednesday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  thursday: {
    label: "Thursday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  friday: {
    label: "Friday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
  saturday: {
    label: "Saturday",
    enabled: false,
    hoursRanges: [
      {
        id: 1,
        startHour: "08",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
      },
    ],
  },
};

export default function WeekAvailabilitiesSelection() {
  const t = useTranslations();

  const [days, setDays] = useState<Record<string, WeekDay>>(daysDict);

  function setEnabled(id: string, value: boolean) {
    setDays((prevDays) => ({
      ...prevDays,
      [id]: { ...prevDays[id], enabled: value },
    }));
  }

  function addHoursRange(id: string, newId: number) {
    setDays((prevDays) => ({
      ...prevDays,
      [id]: {
        ...prevDays[id],
        hoursRanges: [
          ...prevDays[id].hoursRanges,
          {
            id: newId,
            startHour: "08",
            startMinute: "00",
            endHour: "17",
            endMinute: "00",
          },
        ],
      },
    }));
  }

  function removeHoursRange(id: string, idHourRange: number) {
    setDays((prevDays) => ({
      ...prevDays,
      [id]: {
        ...prevDays[id],
        hoursRanges: prevDays[id].hoursRanges.filter(
          (range) => range.id !== idHourRange
        ),
      },
    }));
  }

  return (
    <>
      <strong className="block text-lg mb-2">
        Define your weekly availability below:
      </strong>
      {Object.entries(days).map(([id, { label, enabled, hoursRanges }]) => {
        const minId = Math.min(...hoursRanges.map((r) => r.id));
        const maxId = Math.max(...hoursRanges.map((r) => r.id));

        return (
          <div
            key={id}
            className="grid grid-cols-3 py-4 px-2 border-b last:border-0 items-start"
          >
            <div className="flex items-center gap-3 mt-2">
              <Switch
                id={id}
                checked={enabled}
                onCheckedChange={(checked: boolean) => setEnabled(id, checked)}
              />
              <Label htmlFor={id} className="font-medium">
                {label}
              </Label>
            </div>

            {enabled ? (
              <div className="col-span-2 flex flex-col gap-2">
                {hoursRanges.map((timeRange) => (
                  <HourRangeSelection
                    key={timeRange.id}
                    startH={timeRange.startHour}
                    startM={timeRange.startMinute}
                    endH={timeRange.endHour}
                    endM={timeRange.endMinute}
                    showRemoveButton={
                      hoursRanges.length > 1 && timeRange.id !== minId
                    }
                    showAddButton={timeRange.id === maxId}
                    addRow={() => addHoursRange(id, maxId + 1)}
                    removeRow={() => removeHoursRange(id, timeRange.id)}
                  />
                ))}
              </div>
            ) : (
              <span className="italic text-muted-foreground col-span-2">
                Unavailable on {label}s
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
