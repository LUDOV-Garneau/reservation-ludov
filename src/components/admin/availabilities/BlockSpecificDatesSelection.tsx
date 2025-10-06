"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SpecificDatesSelection from "./SpecificDatesSelection";

export default function BlockSpecificDatesSelection() {
  const [blockEnabled, setBlockEnabled] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 mt-8">
        <Switch
          checked={blockEnabled}
          onCheckedChange={setBlockEnabled}
          id="block-dates"
        />
        <Label htmlFor="block-dates" className="font-bold">
          Block off specific dates (overrides)
        </Label>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Define specific dates that will be{" "}
        <span className="font-semibold">excluded</span> from your weekly
        availability.
      </p>
      {blockEnabled && <SpecificDatesSelection />}
    </div>
  );
}
