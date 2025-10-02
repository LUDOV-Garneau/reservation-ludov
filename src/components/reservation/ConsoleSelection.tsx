"use client";

import { Console } from "@/types/console";
import { useState } from "react";
import { useReservation } from "@/context/ReservationContext";
import SelectedConsoleCard from "@/components/reservation/components/SelectedConsoleCard";
import ConsoleSelectionGrid from "@/components/reservation/components/ConsoleSelectionGrid";
import { useTranslations } from "next-intl";

export default function ConsolesSelection() {
  const t = useTranslations();

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
    const consoleToUse = selected || selectedConsole;
    if (!consoleToUse) return;

    try {
      // Cas 1 : aucune réservation encore en BD → création
      if (!selectedConsole) {
        setSelectedConsole(selected);
        if (!isTimerActive) {
          await startTimer(consoleToUse.id);
        }
      }
      // Cas 2 : une réservation existe déjà et on change de console → update
      else if (selectedConsole.id !== consoleToUse.id) {
        await updateReservationConsole(consoleToUse.id);
        setSelectedConsole(consoleToUse); // update local
      }
      else {
        setSelectedConsole(consoleToUse); // même console, juste pour s'assurer
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
            {t("reservation.console.selectedConsole")}
          </h2>
          <SelectedConsoleCard
            console={displayedConsole}
            onClear={() => setSelected(null)}
            onSuccess={handleContinue}
            buttonLabel={
              isModification
                ? t("reservation.console.modify")
                : t("reservation.console.continue")
            }
          />
        </div>
      </div>

      <div className="lg:col-span-3 md:col-span-2">
        <div className="bg-[white] rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">
            {t("reservation.console.consoleSelection")}
          </h2>
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
