"use client";

import { useState } from "react";
import AccessorySelectionGrid from "@/components/select-accessories/AccessoriesSelectionGrid";
import SelectedAccessoryCard from "@/components/select-accessories/SelectedAccessoryCard";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

export default function Page() {
  const [selected, setSelected] = useState<Accessory | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {}
      <div className="md:col-span-1">
        <div className="sticky top-4">
          <h2 className="text-xl font-bold mb-2">Accessoire sélectionné</h2>
          <SelectedAccessoryCard
            accessory={selected}
            onClear={() => setSelected(null)}
          />
        </div>
      </div>

      {}
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-2">
          Sélection de l&apos;accessoire
        </h2>
        <AccessorySelectionGrid
          selectedId={selected ? selected.id : null}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
}
