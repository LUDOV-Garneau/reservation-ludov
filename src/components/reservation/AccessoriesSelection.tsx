"use client";

import { useState, useEffect } from "react";
import AccessorySelectionGrid, { Accessory } from "@/components/reservation/components/AccessoriesSelectionGrid";
import SelectedAccessoryCard from "@/components/reservation/components/SelectedAccessoryCard";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

export default function AccessoriesSelection() {
  const t = useTranslations();

  const [selected, setSelected] = useState<Accessory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les accessoires sélectionnés (si on revient sur la page)
  useEffect(() => {
    const loadSelected = async () => {
      try {
        const res = await fetch("/api/reservation/accessories?selected=true");
        if (!res.ok) throw new Error("Erreur chargement");
        const data = await res.json();
        setSelected(data || []);
      } catch (err) {
        console.error("Erreur restore accessories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSelected();
  }, []);

  const handleSelect = (accessory: Accessory) => {
    setSelected((prev) =>
      prev.some((a) => a.id === accessory.id)
        ? prev.filter((a) => a.id !== accessory.id)
        : [...prev, accessory]
    );
  };

  const handleClear = (id: number) => {
    setSelected((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError("Sélectionnez au moins un accessoire");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/reservation/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryIds: selected.map((a) => a.id) }),
      });

      if (!res.ok) throw new Error("Erreur de sauvegarde");

      console.log("Accessoires sauvegardés ✅");
    } catch (err) {
      setError("Impossible de sauvegarder les accessoires.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-[white] rounded-2xl p-6 m-6">
        <div className="sticky top-4 space-y-4">
          <h2 className="text-xl font-bold mb-2">
            {t("reservation.accessory.selectedAccessories")}
          </h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : selected.length === 0 ? (
              <p className="text-gray-500">
                {t("reservation.accessory.noneSelected")}
              </p>
            ) : (
              selected.map((a) => (
                <SelectedAccessoryCard
                  key={a.id}
                  accessory={a}
                  onClear={() => handleClear(a.id)}
                />
              ))
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || selected.length === 0}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSaving ? "Enregistrement..." : "Continuer"}
          </Button>
        </div>
      </div>

      <div className="md:col-span-2 bg-[white] rounded-2xl p-6 m-6 shadow">
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
