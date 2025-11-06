"use client";

import { Console } from "@/types/console";

/// Contexte de réservation
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/**
 * Types
 */
interface ReservationContextType {
  timeRemaining: number; // en secondes
  isTimerActive: boolean; // indique si le timer est actif
  isReservationCancelled: boolean; // indique si la réservation a été annulée
  isLoading: boolean; // indique si une opération est en cours
  error: string | null; // message d'erreur s'il y en a
  reservationId: string | null; // ID de la réservation temporaire
  expiresAt: string | null; // date d'expiration de la réservation (ISO)

  // Actions Timer
  startTimer: (consoleId?: number) => Promise<void>; // démarre une réservation temporaire
  stopTimer: () => void; // stoppe le timer localement
  resetTimer: () => void; // reset complet

  // Données liées à la réservation
  userId: number; // ID de l'utilisateur
  selectedConsole: Console | null; // console sélectionnée
  selectedGames: string[]; // liste des jeux sélectionnés
  currentStep: number; // étape actuelle du processus de réservation
  selectedDate: Date | undefined; // date sélectionnée
  selectedTime: string | undefined; // heure sélectionnée
  selectedCours: number | null;
  selectedAccessories: number[];
  selectedConsoleId: number;

  // Mutateurs
  setUserId: (id: number) => void; // définit l'ID utilisateur
  setSelectedConsole: (console: Console | null) => void; // définit la console sélectionnée
  setSelectedGames: (games: string[]) => void; // définit la liste des jeux sélectionnés
  setCurrentStep: (step: number) => void; // définit l'étape actuelle
  setSelectedDate: (date: Date | undefined) => void; // définit la date sélectionnée
  setSelectedTime: (time: string | undefined) => void; // définit l'heure sélectionnée
  setSelectedCours: (coursId: number | null) => void; // définit le cours sélectionné
  setSelectedAccessories: React.Dispatch<React.SetStateAction<number[]>>;

  // Actions Réservation
  cancelReservation: () => Promise<void>; // annule la réservation côté serveur
  completeReservation: () => Promise<void>; // finalise la réservation côté serveur
  clearError: () => void; // efface le message d'erreur
  updateReservationConsole: (newConsoleId: number) => Promise<void>; // met à jour la console de la réservation

  updateReservationAccessories: (ids: number[]) => Promise<void>;
}

// Contexte
const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);

// Props du provider
interface ReservationProviderProps {
  children: ReactNode;
  timerDuration?: number; // durée du timer en minutes
}

// État minimal pour la sauvegarde/restauration
interface MinimalReservationState {
  reservationId: string;
  timestamp: number;
}

const STORAGE_KEY = "reservation_hold"; // clé pour sessionStorage

const toLocalYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

/**
 * Provider principal pour gérer tout le cycle de vie d'une réservation
 */
export function ReservationProvider({
  children,
  timerDuration = 15,
}: ReservationProviderProps) {
  /**
   * --- États globaux ---
   */
  const [timeRemaining, setTimeRemaining] = useState(timerDuration * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isReservationCancelled, setIsReservationCancelled] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [userId, setUserId] = useState(0);
  const [selectedConsole, setSelectedConsole] = useState<Console | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAccessories, setSelectedAccessories] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined
  );
  const [selectedCours, setSelectedCours] = useState<number | null>(null);
  const [selectedConsoleId, setSelectedConsoleId] = useState<number>(0);

  const [isHydrated, setIsHydrated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  /**
   * --- Utils internes ---
   */
  const clearStorage = () => sessionStorage.removeItem(STORAGE_KEY);

  const saveStorage = (id: string) => {
    const state: MinimalReservationState = {
      reservationId: id,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const tzAwareIso = (s: string) =>
    /Z$|[+-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;

  const computeRemaining = (expiry: string): number => {
    const now = Date.now();
    const end = new Date(tzAwareIso(expiry)).getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  };

  /**
   * --- Effet de restauration (au montage) ---
   */
  useEffect(() => {
    const restoreReservation = async () => {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (!savedData) {
        setIsRestoring(false);
        setIsHydrated(true);
        return;
      }

      try {
        const { reservationId: savedId, timestamp }: MinimalReservationState =
          JSON.parse(savedData);

        if (Date.now() - timestamp > 15 * 60 * 1000) {
          clearStorage();
          return;
        }

        // Vérifie auprès du serveur
        const res = await fetch(
          `/api/reservation/get-active-reservation?id=${savedId}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) {
          clearStorage();
          return;
        }

        const data = await res.json();
        if (!data.success || data.status === "expired") {
          clearStorage();
          setIsReservationCancelled(true);
          setIsRestoring(false);
          setIsHydrated(true);
          return;
        }

        setReservationId(String(data.reservationId));
        setExpiresAt(data.expiresAt);
        setUserId(data.userId);

        if (data.console) {
          setSelectedConsole({
            id: Number(data.console.id),
            name: String(data.console.name),
            active_units: Number(data.console.active_units || 0),
            picture: data.console.picture,
          });

          setSelectedConsoleId(data.consoleStockId);
        }

        setSelectedCours(data.cours || null);

        setSelectedGames(data.games || []);

        setSelectedAccessories(data.accessories || []);

        setSelectedDate(
          data.selectedDate ? new Date(data.selectedDate) : undefined
        );
        setSelectedTime(data.selectedTime || undefined);

        setCurrentStep(data.currentStep || 1);

        setIsTimerActive(true);
        if (typeof data.expiresIn === "number" && !Number.isNaN(data.expiresIn)) {
          // TTL côté serveur → on s'y fie en priorité
          setTimeRemaining(Math.max(0, Math.min(timerDuration * 60, data.expiresIn)));
        } else if (data.expiresAt) {
          // Fallback (ancien backend)
          setTimeRemaining(computeRemaining(String(data.expiresAt)));
        } else {
          // Si rien n'est fourni (cas extrême), évite un état incohérent
          setTimeRemaining(timerDuration * 60);
        }
      } catch (e) {
        console.error("Erreur restauration réservation:", e);
        clearStorage();
      } finally {
        setIsRestoring(false);
        setIsHydrated(true);
      }
    };

    restoreReservation();
  }, []);

  /**
   * --- Effet de sauvegarde (dans sessionStorage) ---
   */
  useEffect(() => {
    if (!isHydrated) return;
    if (reservationId && !isReservationCancelled) {
      saveStorage(reservationId);
    } else {
      clearStorage();
    }
  }, [isHydrated, reservationId, isReservationCancelled]);

  /**
   * --- Effet Timer ---
   */
  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive]);

  /**
   * --- Gestion expiration ---
   */
  const handleTimeExpired = async () => {
    setIsReservationCancelled(true);
    setIsTimerActive(false);
    clearStorage();

    if (!reservationId) return;
    try {
      await fetch(`/api/reservation/cancel-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
    } catch (e) {
      console.error("Erreur annulation expiration:", e);
    }
  };

  /**
   * --- Actions publiques ---
   */

  /** Crée une réservation temporaire */
  const startTimer = async (consoleId?: number) => {
  const consoleTypeId = consoleId ?? selectedConsole?.id;
  if (!consoleTypeId) {
    setError("Aucune plateforme sélectionnée");
    return;
  }
  if (isTimerActive && timeRemaining > 0) return;

  setIsLoading(true);
  try {
    const res = await fetch(`/api/reservation/create-hold-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consoleTypeId, minutes: timerDuration }),
      signal:
        "AbortSignal" in window && "timeout" in AbortSignal
          ? AbortSignal.timeout(10000)
          : (() => {
              const ctrl = new AbortController();
              setTimeout(() => ctrl.abort(), 10000);
              return ctrl.signal;
            })(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Erreur création réservation");
    }

    const data = await res.json();

    // on lit tout ce qui peut arriver depuis le backend
    const expiresAtIso = String(
      data.expiresAt ?? data.expires_at ?? data.expireAt ?? ""
    );
    const expiresInSrv = Number(data.expiresIn); // <<< TTL côté serveur (en secondes)

    if (!data.reservationId && !data.holdId) {
      throw new Error("Réponse invalide du serveur (reservationId manquant)");
    }
    if (!expiresAtIso && !Number.isFinite(expiresInSrv)) {
      throw new Error("Réponse invalide du serveur (expiresAt/expiresIn manquant)");
    }

    setSelectedConsoleId(Number(data.consoleStockId));
    setReservationId(String(data.reservationId ?? data.holdId));
    setExpiresAt(expiresAtIso || null);
    setIsTimerActive(true);

    // <<< NE PLUS DÉPENDRE DE L'HORLOGE DU NAVIGATEUR
    if (Number.isFinite(expiresInSrv)) {
      setTimeRemaining(Math.max(0, Math.min(timerDuration * 60, expiresInSrv)));
    } else {
      // Fallback si jamais expiresIn n’est pas renvoyé (ancien backend)
      setTimeRemaining(computeRemaining(expiresAtIso));
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : "Erreur inconnue");
    setIsTimerActive(false);
  } finally {
    setIsLoading(false);
  }
};


  const updateReservationAccessories = async (accessories: number[]) => {
    if (!reservationId) return;

    // Optimistic update
    setSelectedAccessories(accessories);

    try {
      const res = await fetch(`/api/reservation/update-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, accessories }),
      });

      if (!res.ok) throw new Error("Erreur update accessoires");

      const data = await res.json();
      if (!data.success) {
        throw new Error("Échec côté serveur");
      }
    } catch (e) {
      console.error("Erreur update accessoires:", e);
      setError(e instanceof Error ? e.message : "Erreur update accessoires");

      // rollback (optionnel)
      // ici tu pourrais remettre l’ancien state si tu veux
    }
  };

  /** Stoppe le timer local (sans annuler la réservation) */
  const stopTimer = () => setIsTimerActive(false);

  /** Reset complet de la réservation */
  const resetTimer = () => {
    setTimeRemaining(timerDuration * 60);
    setIsTimerActive(false);
    setIsReservationCancelled(false);
    setReservationId(null);
    setExpiresAt(null);
    setError(null);
    setSelectedConsole(null);
    setSelectedGames([]);
    setCurrentStep(1);
    clearStorage();
    setSelectedAccessories([]);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setUserId(0);
    setIsHydrated(true);
    setIsRestoring(false);
    setSelectedCours(null);
  };

  /** Annule la réservation côté serveur */
  const cancelReservation = async () => {
    if (!reservationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservation/cancel-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      if (!res.ok) throw new Error("Erreur annulation");
      setIsReservationCancelled(true);
      setIsTimerActive(false);
      setReservationId(null);
      setExpiresAt(null);
      clearStorage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur annulation");
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservationConsole = async (newConsoleId: number) => {
    if (!reservationId) return;

    setSelectedGames([]);

    try {
      const res = await fetch(`/api/reservation/update-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, newConsoleId }),
      });

      if (!res.ok) throw new Error("Erreur modification plateforme");

      const data = await res.json();
      if (data.success) {
        setSelectedConsole({ ...selectedConsole!, id: newConsoleId });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur update plateforme");
    }
  };

  /** Finalise la réservation côté serveur */
  // Extrait de la fonction completeReservation corrigée pour le ReservationContext

  /** Finalise la réservation côté serveur */
  const completeReservation = async () => {
    if (!reservationId) {
      setError("Aucune réservation à finaliser");
      return;
    }

    if (!selectedConsole) {
      setError("Aucune plateforme sélectionnée");
      return;
    }

    if (!selectedConsoleId) {
      setError("Aucune plateforme en stock sélectionnée");
      return;
    }

    if (selectedGames.length === 0) {
      setError("Aucun jeu sélectionné");
      return;
    }

    if (!selectedCours) {
      setError("Aucun cours sélectionné");
      return;
    }

    if (!selectedDate) {
      setError("Aucune date sélectionnée");
      return;
    }

    if (!selectedTime) {
      setError("Aucune heure sélectionnée");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reservation/confirm-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationHoldId: reservationId,
          consoleId: selectedConsoleId,
          consoleTypeId: selectedConsole?.id,
          game1Id: selectedGames[0] ? Number(selectedGames[0]) : null,
          game2Id: selectedGames[1] ? Number(selectedGames[1]) : null,
          game3Id: selectedGames[2] ? Number(selectedGames[2]) : null,
          accessoryIds: selectedAccessories,
          coursId: selectedCours,
          date: selectedDate ? toLocalYmd(selectedDate) : null,
          time: selectedTime || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Erreur lors de la finalisation");
      }

      const data = await res.json();

      // Sauvegarder les détails pour la page de succès
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "last_reservation",
          JSON.stringify({
            reservationId: data.reservationId || reservationId,
            finalReservationId: data.finalReservationId,
            console: selectedConsole,
            games: selectedGames,
            date: new Date().toLocaleDateString("fr-CA"),
            heure: new Date().toLocaleTimeString("fr-CA", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        );
      }

      // Réinitialiser le contexte
      setIsTimerActive(false);
      setReservationId(null);
      setExpiresAt(null);
      clearStorage();

      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur finalisation");
      throw e; // Re-throw pour que le composant puisse gérer l'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  /**
   * --- Contexte exposé ---
   */
  const value: ReservationContextType = {
    timeRemaining,
    isTimerActive,
    isReservationCancelled,
    isLoading,
    error,
    reservationId,
    expiresAt,
    startTimer,
    stopTimer,
    resetTimer,
    userId,
    selectedConsole,
    selectedGames,
    currentStep,
    setUserId,
    setSelectedConsole,
    setSelectedGames,
    setCurrentStep,
    cancelReservation,
    completeReservation,
    clearError,
    updateReservationConsole,
    selectedAccessories,
    setSelectedAccessories,
    updateReservationAccessories,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedCours,
    setSelectedCours,
    selectedConsoleId,
  };

  if (isRestoring) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent mb-4"></div>
          <p className="text-lg text-gray-600">
            Chargement de votre réservation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

/** Hook pour accéder au contexte */
export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error("useReservation must be used within a ReservationProvider");
  }
  return context;
}
