"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "@/components/reservation/components/DatePicker";
import { TimePicker } from "@/components/reservation/components/TimePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useReservation } from "@/context/ReservationContext";
import { Loader2, AlertCircle } from "lucide-react";

export default function DateSelection() {
  const t = useTranslations();

  const { 
    setSelectedDate,
    selectedDate,
    setSelectedTime,
    selectedTime,
    setCurrentStep,
    currentStep,
    reservationId
  } = useReservation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [time, setTime] = useState<string>(selectedTime || "");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger les heures disponibles au montage
  useEffect(() => {
    if (date) {
      loadAvailableTimes(date);
    }
  }, []);

  const loadAvailableTimes = async (selectedDate: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const dateString = selectedDate.toISOString().split("T")[0];
      const response = await fetch(
        `/api/reservation/calendar?date=${encodeURIComponent(dateString)}`
      );
      
      if (!response.ok) throw new Error("Erreur chargement des horaires");
      
      const data = await response.json();
      setAvailableTimes(data.availableTimes || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les horaires disponibles");
      setAvailableTimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectDate = async (newDate: Date | undefined) => {
    if (!newDate) return;

    // Réinitialiser l'heure si on change de date
    setTime("");
    setSelectedTime("");
    setDate(newDate);
    setSelectedDate(newDate);
    
    // Charger les nouvelles heures disponibles
    await loadAvailableTimes(newDate);
  };

  const onSelectTime = (selectedTime: string) => {
    setTime(selectedTime);
    setSelectedTime(selectedTime);
  };

  const handleContinue = async () => {
    if (!date) {
      setError("Veuillez sélectionner une date");
      return;
    }

    if (!time) {
      setError("Veuillez sélectionner une heure");
      return;
    }

    if (!reservationId) {
      setError("Aucune réservation active");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/reservation/update-hold-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          date: date.toISOString().split("T")[0],
          time: time,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      const data = await response.json();
      if (data.success) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la sauvegarde de la réservation");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[white] rounded-2xl px-10 py-10">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <h2 className="text-4xl mb-4">{t("reservation.calendar.title")}</h2>
        <Button 
          onClick={handleContinue}
          disabled={!date || !time || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            t("reservation.calendar.continueBtn")
          )}
        </Button>
      </div>
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-10">
        <DatePicker selected={date} onSelect={onSelectDate} />

        {isLoading ? (
          <div className="grid grid-flow-col gap-2 justify-center grid-rows-[repeat(7,auto)]">
            {Array(9)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-9 w-25 rounded-md bg-gray-300" />
              ))}
          </div>
        ) : availableTimes.length === 0 ? (
          <p>{t("reservation.calendar.noValidDate")}</p>
        ) : (
          <TimePicker
            times={availableTimes}
            selectedTime={time}
            onSelect={onSelectTime}
          />
        )}
      </div>
    </div>
  );
}