"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Accessory {
  id: number;
  name: string;
}

interface AccessorySelectionGridProps {
  accessories: Accessory[];
  selectedIds: number[];
  onSelect: (a: Accessory) => void;
  requiredIds?: number[];
}

export default function AccessorySelectionGrid({
  accessories,
  selectedIds,
  onSelect,
  requiredIds = [],
}: AccessorySelectionGridProps) {
  const t = useTranslations();

  const [search, setSearch] = useState("");

  // Optimisation: filtrage mémoïsé
  const filtered = useMemo(() => {
    return accessories.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [accessories, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("reservation.accessory.accessoryName")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">
          {t("reservation.accessory.noAccessoryFound")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                if (!requiredIds.includes(a.id)) {
                  onSelect(a);
                }
              }}
              className={`relative p-4 rounded-lg border text-center transition
                ${
                  requiredIds.includes(a.id)
                    ? "border-cyan-500 bg-cyan-50 cursor-not-allowed opacity-80"
                    : selectedIds.includes(a.id)
                    ? "border-green-500 bg-green-50 cursor-pointer"
                    : "border-gray-200 hover:border-gray-400 cursor-pointer"
                }
              `}
            >
              <p className="font-semibold">{a.name}</p>
              {requiredIds.includes(a.id) && (
                <span className="absolute top-1 right-1 text-[10px] bg-blue-500 text-white px-2 py-px rounded-full">
                  {t("reservation.accessory.required")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
