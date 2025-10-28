"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "@/components/reservation/components/DatePicker";
import { TimePicker } from "@/components/reservation/components/TimePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useReservation } from "@/context/ReservationContext";
import { Loader2, AlertCircle, Calendar, Clock, MoveLeft } from "lucide-react";

type TimeSlot = {
  time: string;
  available: boolean;
};

export default function DateSelection() {
  const t = useTranslations();

  const {
    setSelectedDate,
    selectedDate,
    setSelectedTime,
    selectedTime,
    setCurrentStep,
    currentStep,
    reservationId,
    selectedConsoleId,
    selectedGames,
    selectedAccessories,
  } = useReservation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [time, setTime] = useState<string>(selectedTime || "");
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        `/api/reservation/calendar?date=${encodeURIComponent(
          dateString
        )}&consoleId=${encodeURIComponent(
          selectedConsoleId
        )}&gameIds=${encodeURIComponent(
          selectedGames.join(",")
        )}&accessoryIds=${encodeURIComponent(selectedAccessories.join(","))}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur chargement des horaires");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur serveur");
      }

      setAvailableTimes(data.availability || []);

      if (time && !data.availability.includes(time)) {
        setTime("");
        setSelectedTime("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les horaires disponibles"
      );
      setAvailableTimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectDate = async (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      setSelectedDate(undefined);
      setTime("");
      setSelectedTime("");
      setAvailableTimes([]);
      return;
    }

    setTime("");
    setSelectedTime("");
    setDate(newDate);
    setSelectedDate(newDate);

    await loadAvailableTimes(newDate);
  };

  const onSelectTime = (selectedTime: string) => {
    setTime(selectedTime);
    setSelectedTime(selectedTime);
    setError(null);
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
      const dateString = date.toISOString().split("T")[0];

      const response = await fetch("/api/reservation/update-hold-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          date: dateString,
          time: time,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la sauvegarde");
      }

      const data = await response.json();

      if (data.success) {
        setCurrentStep(currentStep + 1);
      } else {
        throw new Error(data.message || "Échec de la sauvegarde");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde de la réservation"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto sm:p-6">
      <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10">
        <div className="mb-8">
          <div
            onClick={() => setCurrentStep(currentStep - 1)}
            className="cursor-pointer flex flex-row items-center mb-8 w-fit"
          >
            <MoveLeft className="h-6 w-6 mr-2" />
            <p>{t("reservation.layout.previousStep")}</p>
          </div>
          <h2 className="text-4xl font-bold mb-2">
            {t("reservation.calendar.title")}
          </h2>
          <p className="text-gray-600">
            Sélectionnez une date et une heure pour votre réservation
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 sm:items-start sm:justify-center gap-10 mb-8">
          <div className="col-span-2 md:col-span-1 mx-auto lg:mx-0">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold">Date de réservation</h3>
            </div>
            <DatePicker selected={date} onSelect={onSelectDate} />
          </div>

          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold">Heure de début</h3>
            </div>

            {!date ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Veuillez dabord sélectionner une date
                </p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {Array(9)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-16 w-full rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
                    />
                  ))}
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">
                  {t("reservation.calendar.noValidDate")}
                </p>
                <p className="text-sm text-gray-500">
                  Toutes les plages horaires sont réservées pour cette date
                </p>
              </div>
            ) : (
              <TimePicker
                times={availableTimes}
                selectedTime={time}
                onSelect={onSelectTime}
              />
            )}
          </div>
        </div>

        {date && time && (
          <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
            <p className="text-sm font-medium text-cyan-900 mb-1">
              Résumé de votre sélection
            </p>
            <p className="text-cyan-700">
              {date.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              à {time.slice(0, 5)}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={isSaving}
          >
            Retour
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!date || !time || isSaving}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>{t("reservation.calendar.continueBtn")}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}