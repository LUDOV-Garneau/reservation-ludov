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
    selectedConsole,
    startTimer,
    isTimerActive,
    setCurrentStep,
  } = useReservation();

  const handleConsoleSelect = (console: Console) => {
    setSelected(console);
    setSelectedConsole(console.id);
  }

  const handleContinue = async () => {
    if (!selected) {
      return;
    }

    try {
      if (!isTimerActive) {
        await startTimer();
      }

      setCurrentStep(2);
    } catch(error) {
      console.error("Erreur lors de la continuation:", error);
    }
  }

  const handleClear = () => {
    setSelected(null);
    setSelectedConsole(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-[white] sticky top-10 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Console sélectionnée
          </h2>
          <SelectedConsoleCard
            console={selected}
            onClear={() => setSelected(null)}
            onSuccess={handleContinue}
          />
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="bg-[white] rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            Sélection de la console
          </h2>
          <ConsoleSelectionGrid
            selectedId={selected?.id ?? null}
            onSelect={handleConsoleSelect}
          />
        </div>
      </div>
    </div>
  );
}