"use client";

import { useState } from "react";
import SelectedConsoleCard from "@/components/reservation/components/SelectedConsoleCard";
import ConsoleSelectionGrid from "@/components/reservation/components/ConsoleSelectionGrid";

type Console = {
  id: number;
  name: string;
  available: number;
  image: string;
};

export default function ConsolesSelection() {
  const [selected, setSelected] = useState<Console | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-[white] rounded-2xl p-6 m-6">
        <div className="sticky top-4">
          <h2 className="text-xl font-bold mb-2">Console sélectionnée</h2>
          <SelectedConsoleCard
            console={selected}
            onClear={() => setSelected(null)}
          />
        </div>
      </div>

      <div className="md:col-span-2 bg-[white] rounded-2xl p-6 m-6">
        <h2 className="text-xl font-bold mb-2">Sélection de la console</h2>
        <ConsoleSelectionGrid
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
}
