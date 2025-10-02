"use client";

import { Console } from "@/types/console";
import { useState } from "react";
import { useReservation } from "@/context/ReservationContext";
import SelectedConsoleCard from "@/components/reservation/components/SelectedConsoleCard";
import ConsoleSelectionGrid from "@/components/reservation/components/ConsoleSelectionGrid";

export default function ConsolesSelection() {
  const [selected, setSelected] = useState<Console | null>(null);

  const {
    setSelectedConsole,
    startTimer,
    updateReservationConsole,
    isTimerActive,
    setCurrentStep,
    selectedConsole, // console déjà réservée en BD
  } = useReservation();

  const handleConsoleSelect = (console: Console) => {
    setSelected(console);
  };

  const handleContinue = async () => {
    if (!selected) return;

    try {
      // Cas 1 : aucune réservation encore en BD → création
      if (!selectedConsole) {
        setSelectedConsole(selected);
        if (!isTimerActive) {
          await startTimer(selected.id);
        }
      }
      // Cas 2 : une réservation existe déjà et on change de console → update
      else if (selectedConsole.id !== selected.id) {
        await updateReservationConsole(selected.id);
        setSelectedConsole(selected); // update local
      }

      setCurrentStep(2);
    } catch (error) {
      console.error("Erreur lors de la continuation:", error);
    }
  };

  // Détermine si on doit afficher "Continuer" ou "Modifier"
  const isModification =
    selected && selectedConsole && selected.id !== selectedConsole.id;

  const displayedConsole = selected || selectedConsole;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-[white] sticky top-10 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Console sélectionnée
          </h2>
          <SelectedConsoleCard
            console={displayedConsole}
            onClear={() => setSelected(null)}
            onSuccess={handleContinue}
            buttonLabel={isModification ? "Modifier" : "Continuer"}
          />
        </div>
      </div>

      <div className="lg:col-span-3 md:col-span-2">
        <div className="bg-[white] rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Sélection de la console</h2>
          <ConsoleSelectionGrid
            selectedId={selected?.id ?? null}
            reservedId={selectedConsole?.id ?? null}
            onSelect={handleConsoleSelect}
          />
        </div>
      </div>
    </div>
  );
}
