"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";

export default function DateRangeSelection() {
  const t = useTranslations();

  const [alwaysApplies, setAlwaysApplies] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });

  function handleSelectDate(range: DateRange | undefined) {
    if (range) {
      setDateRange(range);
    } else {
      // Handle clearing or reset if needed
    }
  }

  return (
    <>
      <strong className="block text-lg mb-2 mt-8">
        Define the date range for which these availabilities apply:
      </strong>
      <div className="mx-auto flex gap-10 items-center">
        <Popover
          open={alwaysApplies ? false : isPopoverOpen}
          onOpenChange={(open) => {
            if (!alwaysApplies) setIsPopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-fit justify-between"
              disabled={alwaysApplies}
            >
              {dateRange.from
                ? dateRange.to
                  ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  : dateRange.from.toLocaleDateString()
                : "Select date range"}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={handleSelectDate}
            />
          </PopoverContent>
        </Popover>
        <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-[#02dcde] has-[[aria-checked=true]]:bg-blue-50">
          <Checkbox
            id="toggle-always"
            className="data-[state=checked]:border-[#02dcde] data-[state=checked]:bg-[#02dcde] data-[state=checked]:text-white"
            onCheckedChange={(checked: boolean) => setAlwaysApplies(checked)}
          />
          <div className="grid gap-1.5 font-normal">
            <p className="text-sm leading-none font-medium">Always applies</p>
          </div>
        </Label>
      </div>
    </>
  );
}
