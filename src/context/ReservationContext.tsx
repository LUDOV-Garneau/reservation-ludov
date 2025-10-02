"use client"

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

  // Mutateurs
  setUserId: (id: number) => void; // définit l'ID utilisateur
  setSelectedConsole: (console: Console | null) => void; // définit la console sélectionnée
  setSelectedGames: (games: string[]) => void; // définit la liste des jeux sélectionnés
  setCurrentStep: (step: number) => void; // définit l'étape actuelle

  // Actions Réservation
  cancelReservation: () => Promise<void>; // annule la réservation côté serveur
  completeReservation: () => Promise<void>; // finalise la réservation côté serveur
  clearError: () => void; // efface le message d'erreur
  updateReservationConsole: (newConsoleId: number) => Promise<void>; // met à jour la console de la réservation

  selectedAccessories: number[];
  setSelectedAccessories: (ids: number[]) => void;
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

  const computeRemaining = (expiry: string): number => {
    const now = Date.now();
    const end = new Date(expiry).getTime();
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
          return;
        }

        // Restaure les infos
        console.log("Restauration réservation:", data);
        setReservationId(data.reservationId);
        setExpiresAt(data.expiresAt);
        setUserId(data.userId);
        setSelectedConsole(data.console)
        setSelectedGames(data.games || []);
        setSelectedAccessories(data.accessories || []);
        setCurrentStep(data.currentStep || 1);
        setIsTimerActive(true);
        setTimeRemaining(computeRemaining(data.expiresAt));
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
    if (!isTimerActive || !expiresAt) return;

    const tick = () => {
      const remaining = computeRemaining(expiresAt);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        handleTimeExpired();
      }
    };

    tick(); // première exécution immédiate
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, expiresAt]);

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

  const updateReservationGames = async (games: number[]) => {
    if (!reservationId) return;

    try {
      const res = await fetch(`/api/reservation/update-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          game1Id: games[0] || null,
          game2Id: games[1] || null,
          game3Id: games[2] || null,
        }),
      });

      if (!res.ok) throw new Error("Erreur update jeux");

      const data = await res.json();
      if (data.success) {
        setSelectedGames(games.map(String)); // on garde la sélection localement
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur update jeux");
    }
  };

  /**
   * --- Actions publiques ---
   */

  /** Crée une réservation temporaire */
  const startTimer = async (consoleId?: number) => {
    const cid = consoleId ?? selectedConsole?.id;
    if (!cid) {
      setError("Aucune console sélectionnée");
      return;
    }
    if (isTimerActive && timeRemaining > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservation/create-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, consoleId: cid }),
      });

      if (!res.ok) throw new Error("Erreur création réservation");

      const data = await res.json();
      if (!data.reservationId || !data.expiresAt)
        throw new Error("Réponse invalide du serveur");

      setReservationId(data.reservationId);
      setExpiresAt(data.expiresAt);
      setIsTimerActive(true);
      setTimeRemaining(computeRemaining(data.expiresAt));
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

  console.log("Mise à jour console réservation:", reservationId, newConsoleId);

  try {
    const res = await fetch(`/api/reservation/update-hold-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId, newConsoleId }),
    });

    if (!res.ok) throw new Error("Erreur modification console");

    const data = await res.json();
    if (data.success) {
      setSelectedConsole({ ...selectedConsole!, id: newConsoleId }); 
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : "Erreur update console");
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/reservation/complete-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          userId: userId || null,
          consoleId: selectedConsole?.id || null,
          games: selectedGames
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Erreur lors de la finalisation");
      }
      
      const data = await res.json();
      
      // Sauvegarder les détails pour la page de succès
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('last_reservation', JSON.stringify({
          reservationId: data.reservationId || reservationId,
          finalReservationId: data.finalReservationId,
          console: selectedConsole,
          games: selectedGames,
          date: new Date().toLocaleDateString('fr-CA'),
          heure: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
        }));
      }
      
      // Réinitialiser le contexte
      setIsTimerActive(false);
      setReservationId(null);
      setExpiresAt(null);
      clearStorage();
      
      // La navigation sera gérée par le composant appelant
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

