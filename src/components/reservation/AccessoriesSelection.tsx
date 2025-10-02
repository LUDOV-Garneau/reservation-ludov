"use client";

import { useState, useEffect } from "react";
import AccessorySelectionGrid, { Accessory as ImportedAccessory } from "@/components/reservation/components/AccessoriesSelectionGrid";
import SelectedAccessoryCard from "@/components/reservation/components/SelectedAccessoryCard";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useReservation } from "@/context/ReservationContext";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

export default function AccessoriesSelection() {
  const { 
    selectedAccessories, 
    setSelectedAccessories, 
    updateReservationAccessories,
    setCurrentStep 
  } = useReservation();

  const [allAccessories, setAllAccessories] = useState<Accessory[]>([]);
  const t = useTranslations();
  const [selected, setSelected] = useState<Accessory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger tous les accessoires une seule fois
  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        const res = await fetch("/api/reservation/accessories");
        if (!res.ok) throw new Error("Erreur fetch accessoires");
        const data = await res.json();
        setAllAccessories(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les accessoires");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccessories();
  }, []);

  // Sélection unique
  const handleSelect = (accessory: Accessory) => {
    if (selectedAccessories.includes(accessory.id)) {
      setSelectedAccessories([]); // désélection
    } else {
      setSelectedAccessories([accessory.id]); // un seul accessoire max
    }
  };

  const handleClear = () => {
    setSelectedAccessories([]);
  };

  // 🔹 Sauvegarde uniquement au clic sur "Continuer"
  const handleSave = async () => {
    if (selectedAccessories.length === 0) {
      setError("Sélectionnez au moins un accessoire");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateReservationAccessories(selectedAccessories);
      console.log("Accessoires sauvegardés ✅");

      // Passer à l’étape suivante
      setCurrentStep(4);
    } catch (err) {
      setError("Impossible de sauvegarder les accessoires.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Panneau gauche */}
      <div className="md:col-span-1 bg-[white] rounded-2xl p-6 m-6 shadow">
        <div className="sticky top-4 space-y-4">
          <h2 className="text-xl font-bold">
            {t("reservation.accessory.selectedAccessories")}
          </h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : selectedAccessories.length === 0 ? (
              <p className="text-gray-500">{t("reservation.accessory.noneSelected")}</p>
            ) : (
              selectedAccessories.map((id) => {
                const accessory = allAccessories.find((a) => a.id === id);
                return (
                  accessory && (
                    <SelectedAccessoryCard
                      key={id}
                      accessory={accessory}
                      onClear={handleClear}
                    />
                  )
                );
              })
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || selectedAccessories.length === 0}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSaving ? "Enregistrement..." : "Continuer"}
          </Button>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="md:col-span-2 bg-[white] rounded-2xl p-6 m-6 shadow">
        <h2 className="text-xl font-bold mb-2">{t("reservation.accessory.accessorySelection")}</h2>
        <AccessorySelectionGrid
          accessories={allAccessories}
          selectedIds={selectedAccessories}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
