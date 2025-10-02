"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Accessory {
  id: number;
  name: string;
  console_id: number[];
}

interface AccessorySelectionGridProps {
  selectedIds: number[];
  onSelect: (a: Accessory) => void;
}

export default function AccessorySelectionGrid({
  selectedIds,
  onSelect,
}: AccessorySelectionGridProps) {
  const t = useTranslations();

  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/reservation/accessories");
        const data = await res.json();
        setAccessories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur fetch accessories :", err);
      }
    };
    load();
  }, []);

  const filtered = accessories.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
    </div>
  );
}
