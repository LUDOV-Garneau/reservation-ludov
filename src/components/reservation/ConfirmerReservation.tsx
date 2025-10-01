"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock9 } from "lucide-react";
import CarteElement from "@/components/reservation/components/CarteElement";
import { useReservation } from "@/context/ReservationContext";
import { useRouter } from "next/navigation";

type Jeu = { nom: string };
type Console = { nom: string; id: number };
type Accessoire = { nom: string };

type ReservationData = {
  jeux: Jeu[];
  console: Console;
  accessoires?: Accessoire[];
  cours: string;
  date: string;
  heure: string;
};

export default function ConfirmerReservation() {
  const {
    reservationId,
    completeReservation,
    isLoading,
    error,
    clearError,
  } = useReservation();

  const [jeux, setJeux] = useState<Jeu[]>([]);
  const [console, setConsole] = useState<Console | null>(null);
  const [accessoires, setAccessoires] = useState<Accessoire[]>([]);
  const [cours, setCours] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");

  const [loadingData, setLoadingData] = useState(false);

  const router = useRouter();

  /**
   * Fetch des données détaillées de la réservation
   */
  useEffect(() => {
    if (reservationId) {
      getReservation(reservationId);
    }
  }, [reservationId]);

  async function getReservation(id: string) {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/reservation/get-reservation?id=${id}`);
      if (!res.ok) throw new Error("Impossible de charger la réservation");
      const data: ReservationData = await res.json();

      setJeux(data.jeux || []);
      setConsole(data.console || null);
      setAccessoires(data.accessoires || []);
      setCours(data.cours || "");
      setDate(data.date || "");
      setHeure(data.heure || "");
    } catch (err) {

    } finally {
      setLoadingData(false);
    }
  }

  /**
   * Confirmation finale
   */
  const handleConfirm = async () => {
    if (!reservationId) {
      return;
    }

    try {
      await completeReservation();
      router.push("/reservation/success"); // adapte le chemin à ton app
    } catch {
    }
  };

  /**
   * Gestion d’erreur provenant du contexte
   */
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  /**
   * Loading global
   */
  if (loadingData) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">
            Chargement de votre réservation...
          </p>
          <p className="text-sm text-gray-400 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  /**
   * UI principale
   */
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      {/* --- Header réservation --- */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-3xl font-bold">Votre réservation</h2>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {/* Date + heure */}
          {date && heure && (
            <span className="inline-flex items-center gap-3 rounded-md border bg-white px-3 py-1 text-sm shadow-sm">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock9 className="h-4 w-4" />
                {heure}
              </span>
            </span>
          )}

          {/* Bouton confirmer */}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className="h-11 w-full sm:w-auto bg-cyan-300 text-black hover:bg-cyan-500"
          >
            {isLoading ? "Confirmation..." : "Confirmer ma réservation"}
          </Button>
        </div>
      </div>

      {/* --- Jeux & console --- */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
        <h3 className="text-xl font-medium">Jeux sélectionnés</h3>
        <h3 className="text-xl font-medium hidden md:block">Console</h3>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Jeux */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {jeux.length > 0 ? (
            jeux.map((jeu, index) => (
              <CarteElement key={`${jeu.nom}-${index}`} nom={jeu.nom} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">Aucun jeu sélectionné</p>
          )}
        </div>

        {/* Console */}
        <div className="md:hidden mb-4">
          <h3 className="text-xl font-medium mb-3">Console</h3>
        </div>
        {console ? (
          <CarteElement nom={console.nom} />
        ) : (
          <p className="text-gray-500">Aucune console sélectionnée</p>
        )}
      </div>

      {/* --- Accessoires --- */}
      {!!accessoires.length && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-medium">Accessoires :</h3>
            {accessoires.map((acc, index) => (
              <p key={`${acc.nom}-${index}`}>
                {acc.nom}
                {index < accessoires.length - 1 && ", "}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* --- Cours --- */}
      {cours && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-medium">Cours :</h3>
            <p>{cours}</p>
          </div>
        </div>
      )}

      {/* --- Bouton confirmer bas de page --- */}
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={isLoading}
        aria-busy={isLoading}
        className="h-11 w-full bg-cyan-300 text-black hover:bg-cyan-500"
      >
        {isLoading ? "Confirmation..." : "Confirmer ma réservation"}
      </Button>
    </div>
  );
}
