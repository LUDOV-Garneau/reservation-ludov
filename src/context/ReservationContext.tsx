
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
  timeRemaining: number;
  isTimerActive: boolean;
  isReservationCancelled: boolean;
  isLoading: boolean;
  error: string | null;
  reservationId: string | null;
  expiresAt: string | null;

  // Actions Timer
  startTimer: () => Promise<void>;
  stopTimer: () => void;
  resetTimer: () => void;

  // Données liées à la réservation
  userId: number;
  selectedConsole: number | null;
  selectedGames: string[];
  currentStep: number;

  // Mutateurs
  setUserId: (id: number) => void;
  setSelectedConsole: (console: number) => void;
  setSelectedGames: (games: string[]) => void;
  setCurrentStep: (step: number) => void;

  // Actions Réservation
  cancelReservation: () => Promise<void>;
  completeReservation: () => Promise<void>;
  clearError: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);

interface ReservationProviderProps {
  children: ReactNode;
  timerDuration?: number; // durée du timer en minutes
}

interface MinimalReservationState {
  reservationId: string;
  timestamp: number;
}

const STORAGE_KEY = "reservation_hold";

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
  const [selectedConsole, setSelectedConsole] = useState<number | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

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

        // Vérifie si la sauvegarde est trop ancienne (>20 min)
        if (Date.now() - timestamp > 20 * 60 * 1000) {
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
        setReservationId(data.reservationId);
        setExpiresAt(data.expiresAt);
        setUserId(data.userId);
        setSelectedConsole(data.consoleId);
        setSelectedGames(data.games || []);
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

  /**
   * --- Actions publiques ---
   */

  /** Crée une réservation temporaire */
  const startTimer = async () => {
    const
    if (!userId || !selectedConsole) {
      console.log("Console sélectionnée:", selectedConsole, "UserId:", userId);
      console.error("Informations manquantes pour démarrer la réservation");
      setError("Informations manquantes pour démarrer la réservation");
      return;
    }
    if (isTimerActive && timeRemaining > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservation/create-hold-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, consoleId: selectedConsole }),
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

  /** Finalise la réservation côté serveur */
  const completeReservation = async () => {
    if (!reservationId || selectedGames.length === 0) {
      setError("Informations manquantes");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservation/complete-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          games: selectedGames,
          userId,
          consoleId: selectedConsole,
        }),
      });
      if (!res.ok) throw new Error("Erreur finalisation");
      setIsTimerActive(false);
      clearStorage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur finalisation");
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
