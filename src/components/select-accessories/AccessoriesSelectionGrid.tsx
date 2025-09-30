"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Accessory {
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
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/accessories");
        const data = await res.json();

        if (Array.isArray(data)) {
          setAccessories(data);
        } else {
          setAccessories([]);
        }
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
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Nom de l'accessoire"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <Card
            key={a.id}
            onClick={() => onSelect(a)}
            className={`cursor-pointer transition ${
              selectedIds.includes(a.id)
                ? "ring-2 ring-green-500"
                : "hover:ring-2 hover:ring-gray-300"
            }`}
          >
            <CardContent className="p-4 text-center">
              <p className="font-semibold">{a.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
