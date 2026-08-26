"use client";

import { Console } from "@/types/console";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
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
    setCurrentStep,
    selectedConsole,
    error,
    clearError,
  } = useReservation();

  const handleConsoleSelect = (console: Console) => {
    clearError();
    setSelected(console);
  };

  const handleContinue = async () => {
    const consoleToUse = selected || selectedConsole;
    if (!consoleToUse) return;

    clearError();

    // Le hold doit exister (ou avoir basculé sur la nouvelle plateforme) avant
    // de passer à l'étape suivante : avancer malgré un échec laisserait le
    // parcours sans réservation temporaire, et la confirmation échouerait.
    const isConsoleChange =
      selectedConsole !== null && selectedConsole.id !== consoleToUse.id;

    const ok = isConsoleChange
      ? await updateReservationConsole(consoleToUse.id)
      : await startTimer(consoleToUse.id);

    if (!ok) {
      // Remonté à SelectedConsoleCard pour interrompre son état de chargement ;
      // le message d'erreur vient du contexte et s'affiche ci-dessous.
      throw new Error("hold_failed");
    }

    setSelectedConsole(consoleToUse);
    setCurrentStep(2);
  };

  const isModification =
    selected && selectedConsole && selected.id !== selectedConsole.id;

  const displayedConsole = selected || selectedConsole;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="col-span-1">
        <div className="bg-[white] sticky top-10 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-center">
            {t("reservation.console.selectedConsole")}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

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

      <div className="col-span-1 xl:col-span-3">
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
