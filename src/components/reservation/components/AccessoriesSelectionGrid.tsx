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
  accessories: Accessory[];       // <- fourni par le parent
  selectedIds: number[];
  onSelect: (a: Accessory) => void;
}

export default function AccessorySelectionGrid({
  accessories,
  selectedIds,
  onSelect,
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
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("reservation.accessory.accessoryName")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">Aucun accessoire trouvé</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => onSelect(a)}
              className={`p-4 rounded-lg border text-center cursor-pointer transition ${
                selectedIds.includes(a.id)
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <p className="font-semibold">{a.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
