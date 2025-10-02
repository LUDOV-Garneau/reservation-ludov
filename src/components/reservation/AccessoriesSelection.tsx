"use client";

import { useState } from "react";
import AccessorySelectionGrid from "@/components/reservation/components/AccessoriesSelectionGrid";
import SelectedAccessoryCard from "@/components/reservation/components/SelectedAccessoryCard";
import { useTranslations } from "next-intl";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

export default function AccessoriesSelection() {
  const t = useTranslations();

  const [selected, setSelected] = useState<Accessory[]>([]);

  const handleSelect = (accessory: Accessory) => {
    setSelected((prev) => {
      if (prev.some((a) => a.id === accessory.id)) {
        return prev.filter((a) => a.id !== accessory.id);
      }
      return [...prev, accessory];
    });
  };

  const handleClear = (id: number) => {
    setSelected((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-[white] rounded-2xl p-6 m-6">
        <div className="sticky top-4">
          <h2 className="text-xl font-bold mb-2">
            {t("reservation.accessory.selectedAccessories")}
          </h2>
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
            {selected.length === 0 && (
              <p className="text-gray-500">
                {t("reservation.accessory.noneSelected")}
              </p>
            )}
            {selected.map((a) => (
              <SelectedAccessoryCard
                key={a.id}
                accessory={a}
                onClear={() => handleClear(a.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-2 bg-[white] rounded-2xl p-6 m-6">
        <h2 className="text-xl font-bold mb-2">
          {t("reservation.accessory.accessorySelection")}
        </h2>
        <AccessorySelectionGrid
          selectedIds={selected.map((a) => a.id)}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
