"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import SpecificDatesSelection from "./SpecificDatesSelection";

const days = [
  { id: "sunday", label: "Sunday" },
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
];

export default function AvailabilitiesTab() {
  const t = useTranslations();

  const [selectedCard, setSelectedCard] = useState<string>("weekly");
  const [enabled, setEnabled] = useState(false);
  const [blockEnabled, setBlockEnabled] = useState(false);
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });

  function onSelectCard(id: string) {
    setSelectedCard(id);
  }

  function handleSelectDate(range: DateRange | undefined) {
    if (range) {
      setDateRange(range);
    } else {
      // Handle clearing or reset if needed
    }
  }

  return (
    <TabsContent value="availabilities" className="mx-auto">
      <div className="flex gap-10 text-center">
        <Card
          id="weekly"
          className={`min-w-[300px] p-4 hover:cursor-pointer group ${
            selectedCard === "weekly"
              ? "border-[#02dcde]"
              : "hover:border-[#02dcde] transition-colors"
          }`}
          onClick={() => onSelectCard("weekly")}
        >
          <CardHeader>
            <CardTitle
              className={`${
                selectedCard !== "weekly" &&
                "group-hover:text-[#02dcde] transition-colors"
              }`}
            >
              Par semaine
            </CardTitle>
            <CardDescription>
              Ajoutez des disponibilités récurrentes à chaque semaine.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card
          id="specific-dates"
          className={`min-w-[300px] p-4 hover:cursor-pointer group ${
            selectedCard === "specific-dates"
              ? "border-[#02dcde]"
              : "hover:border-[#02dcde] transition-colors"
          }`}
          onClick={() => onSelectCard("specific-dates")}
        >
          <CardHeader>
            <CardTitle
              className={`${
                selectedCard !== "specific-dates" &&
                "group-hover:text-[#02dcde] transition-colors"
              }`}
            >
              Dates spécifiques
            </CardTitle>
            <CardDescription>
              Ajoutez des disponibilités spécifiques.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      {selectedCard === "weekly" && (
        <Card className="p-6 mt-4">
          <strong className="block text-lg mb-2">
            Define your weekly availability below:
          </strong>
          {days.map(({ id, label }) => (
            <div
              key={id}
              className="grid grid-cols-3 py-4 px-2 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <Switch
                  id={id}
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
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
          <strong className="block text-lg mb-2 mt-8">
            Define the date range for which these availabilities apply:
          </strong>
          <div className="mx-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-fit justify-between">
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
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <Switch
                checked={blockEnabled}
                onCheckedChange={setBlockEnabled}
                id="block-dates"
              />
              <Label htmlFor="block-dates" className="font-bold">
                Block off specific dates (overrides)
              </Label>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Define specific dates that will be{" "}
              <span className="font-semibold">excluded</span> from your weekly
              availability.
            </div>
            {blockEnabled && <SpecificDatesSelection />}
          </div>
          <Button
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
          >
            Set availabilities
          </Button>
        </Card>
      )}
      {selectedCard === "specific-dates" && (
        <Card className="p-6 mt-4">
          <strong className="block text-lg mb-2">
            Define the dates you&apos;re available below:
          </strong>
          <SpecificDatesSelection />
          <Button
            type="submit"
            className="mt-4 w-fit mx-auto font-semibold text-base"
          >
            Set availabilities
          </Button>
        </Card>
      )}
    </TabsContent>
  );
}
