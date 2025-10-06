"use client";

import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../../ui/button";
import SpecificDatesSelection from "./SpecificDatesSelection";
import WeekAvailabilitiesSelection from "./WeekAvailabilitiesSelection";
import AvailabilitiesTypeSelection from "./AvailabilitiesTypeSelection";
import DateRangeSelection from "./DateRangeSelection";
import BlockSpecificDatesSelection from "./BlockSpecificDatesSelection";

export default function AvailabilitiesTab() {
  const t = useTranslations();

  const [selectedCard, setSelectedCard] = useState<string>("weekly");

  return (
    <TabsContent value="availabilities" className="mx-auto">
      <AvailabilitiesTypeSelection
        selectedCard={selectedCard}
        setSelectedCard={(id: string) => setSelectedCard(id)}
      />
      {selectedCard === "weekly" && (
        <Card className="p-6 mt-4">
          <WeekAvailabilitiesSelection />
          <DateRangeSelection />
          <BlockSpecificDatesSelection />
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
