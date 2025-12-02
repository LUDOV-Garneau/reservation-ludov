"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";

type Props = {
  dateRange: { startDate: Date | null; endDate: Date | null } | null;
  alwaysApplies: boolean;
  onChange: (
    range: { startDate: Date | null; endDate: Date | null } | null
  ) => void;
  onToggleAlways: (enabled: boolean) => void;
};

export default function DateRangeSelection({
  dateRange,
  alwaysApplies,
  onChange,
  onToggleAlways,
}: Props) {
  const t = useTranslations();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [localRange, setLocalRange] = useState<DateRange>({
    from: dateRange?.startDate ?? undefined,
    to: dateRange?.endDate ?? undefined,
  });

  useEffect(() => {
    setLocalRange({
      from: dateRange?.startDate ?? undefined,
      to: dateRange?.endDate ?? undefined,
    });
  }, [dateRange]);

  function handleSelectDate(range: DateRange | undefined) {
    if (range) {
      setLocalRange(range);
      onChange({ startDate: range.from ?? null, endDate: range.to ?? null });
    } else {
      setLocalRange({ from: undefined, to: undefined });
      onChange(null);
    }
  }

  useEffect(() => {
    if (alwaysApplies) {
      onChange(null);
    } else if (localRange.from !== undefined || localRange.to !== undefined) {
      onChange({
        startDate: localRange.from ?? null,
        endDate: localRange.to ?? null,
      });
    }
  }, [alwaysApplies]);

  return (
    <>
      <strong className="block text-lg mb-2 mt-8">
        {t("admin.availabilities.dateRange.title")}
      </strong>
      <div className="mx-auto flex flex-col md:flex-row gap-4 md:gap-10 items-start md:items-center">
        <Popover
          open={alwaysApplies ? false : isPopoverOpen}
          onOpenChange={(open) => {
            if (!alwaysApplies) setIsPopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-fit justify-between"
              disabled={alwaysApplies}
            >
              {localRange.from
                ? localRange.to
                  ? `${localRange.from.toLocaleDateString()} - ${localRange.to.toLocaleDateString()}`
                  : localRange.from.toLocaleDateString()
                : t("admin.availabilities.dateRange.select")}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={localRange.from}
              selected={localRange}
              onSelect={handleSelectDate}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </PopoverContent>
        </Popover>
        <Label className="w-full md:w-auto hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-cyan-700 has-[[aria-checked=true]]:bg-cyan-500/10 cursor-pointer">
          <Checkbox
            id="toggle-always"
            className="data-[state=checked]:border-cyan-700 data-[state=checked]:bg-cyan-700 data-[state=checked]:text-white"
            checked={alwaysApplies}
            onCheckedChange={onToggleAlways}
          />
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm leading-none font-medium">
              {t("admin.availabilities.dateRange.alwaysApplies")}
            </p>
          </div>
        </Label>
      </div>
    </>
  );
}
