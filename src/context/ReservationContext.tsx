"use client";

import { Console } from "@/types/console";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ReservationContextType {
  timeRemaining: number;
  isTimerActive: boolean;
  isReservationCancelled: boolean;
  isLoading: boolean;
  error: string | null;
  reservationId: string | null;
  userId: number;
  expiresAt: string | null;

  selectedConsole: Console | null;
  selectedConsoleId: number;
  selectedGames: string[];
  selectedAccessories: number[];
  selectedCours: number | null;
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  currentStep: number;

  startTimer: (consoleId?: number) => Promise<void>;
  stopTimer: () => void;
  resetTimer: () => void;

  cancelReservation: () => Promise<void>;
  completeReservation: () => Promise<ReservationCompletedData | undefined>;
  updateReservationConsole: (newConsoleId: number) => Promise<void>;
  updateReservationAccessories: (ids: number[]) => Promise<void>;

  setUserId: (id: number) => void;
  setSelectedConsole: (console: Console | null) => void;
  setSelectedGames: (games: string[]) => void;
  setSelectedAccessories: React.Dispatch<React.SetStateAction<number[]>>;
  setCurrentStep: (step: number) => void;
  setSelectedDate: (date: Date | undefined) => void;
  setSelectedTime: (time: string | undefined) => void;
  setSelectedCours: (coursId: number | null) => void;
  clearError: () => void;
}

type ReservationCompletedData = {
  reservationId: string;
  consoleId: number;
  consoleTypeId: number;
  game1Id: number;
  game2Id: number | null;
  game3Id: number | null;
  accessoryIds: number[] | null;
  coursId: number;
  date: string;
  time: string;
};

interface ReservationProviderProps {
  children: ReactNode;
  timerDuration?: number;
}

interface MinimalReservationState {
  reservationId: string;
  timestamp: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEY = "reservation_hold";
const DEFAULT_TIMER_DURATION = 15; // minutes
const MAX_STORAGE_AGE = 15 * 60 * 1000; // 15 minutes
const API_TIMEOUT = 10000; // 10 secondes

// ============================================================================
// UTILITAIRES
// ============================================================================

const toLocalYmd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const tzAwareIso = (s: string): string =>
  /Z$|[+-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;

const computeRemaining = (expiry: string): number => {
  const now = Date.now();
  const end = new Date(tzAwareIso(expiry)).getTime();
  return Math.max(0, Math.floor((end - now) / 1000));
};

const createAbortSignal = (timeout: number): AbortSignal => {
  if ("AbortSignal" in window && "timeout" in AbortSignal) {
    return AbortSignal.timeout(timeout);
  }
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), timeout);
  return ctrl.signal;
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const StorageService = {
  save: (reservationId: string) => {
    const state: MinimalReservationState = {
      reservationId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  load: (): MinimalReservationState | null => {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    try {
      const parsed: MinimalReservationState = JSON.parse(data);
      if (Date.now() - parsed.timestamp > MAX_STORAGE_AGE) {
        StorageService.clear();
        return null;
      }
      return parsed;
    } catch {
      StorageService.clear();
      return null;
    }
  },

  clear: () => {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

// ============================================================================
// API SERVICE
// ============================================================================

const ReservationAPI = {
  async getActiveReservation(id: string) {
    const res = await fetch(
      `/api/reservation/get-active-reservation?id=${id}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) throw new Error("Réservation non trouvée");
    return res.json();
  },

  async createHold(consoleTypeId: number, minutes: number) {
    const res = await fetch(`/api/reservation/create-hold-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consoleTypeId, minutes }),
      signal: createAbortSignal(API_TIMEOUT),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Erreur création réservation");
    }

    return res.json();
  },

  async cancelHold(reservationId: string) {
    const res = await fetch(`/api/reservation/cancel-hold-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });

    if (!res.ok) throw new Error("Erreur annulation");
    return res.json();
  },

  async updateHold(payload: {
    reservationId: string;
    newConsoleId?: number;
    accessories?: number[];
  }) {
    const res = await fetch(`/api/reservation/update-hold-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Erreur mise à jour");
    }

    return res.json();
  },

  async confirmReservation(payload: {
    reservationHoldId: string;
    consoleId: number;
    consoleTypeId: number;
    game1Id: number | null;
    game2Id: number | null;
    game3Id: number | null;
    accessoryIds: number[];
    coursId: number;
    date: string;
    time: string;
  }) {
    const res = await fetch(`/api/reservation/confirm-reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || "Erreur lors de la finalisation");
    }

    return res.json();
  },
};

// ============================================================================
// CONTEXTE
// ============================================================================

const ReservationContext = createContext<ReservationContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================

export function ReservationProvider({
  children,
  timerDuration = DEFAULT_TIMER_DURATION,
}: ReservationProviderProps) {
  // --- États ---
  const [timeRemaining, setTimeRemaining] = useState(timerDuration * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isReservationCancelled, setIsReservationCancelled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Données de réservation
  const [userId, setUserId] = useState(0);
  const [selectedConsole, setSelectedConsole] = useState<Console | null>(null);
  const [selectedConsoleId, setSelectedConsoleId] = useState<number>(0);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<number[]>([]);
  const [selectedCours, setSelectedCours] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined
  );
  const [currentStep, setCurrentStep] = useState(1);

  // État de restauration
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const handleTimeExpired = useCallback(async () => {
    setIsReservationCancelled(true);
    setIsTimerActive(false);
    StorageService.clear();

    if (reservationId) {
      try {
        await ReservationAPI.cancelHold(reservationId);
      } catch (e) {
        console.error("Erreur annulation expiration:", e);
      }
    }
  }, [reservationId]);

  const startTimer = useCallback(
    async (consoleId?: number) => {
      const consoleTypeId = consoleId ?? selectedConsole?.id;
      if (!consoleTypeId) {
        setError("Aucune plateforme sélectionnée");
        return;
      }
      if (isTimerActive && timeRemaining > 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await ReservationAPI.createHold(
          consoleTypeId,
          timerDuration
        );

        const expiresAtIso = String(
          data.expiresAt ?? data.expires_at ?? data.expireAt ?? ""
        );
        const expiresInSrv = Number(data.expiresIn);

        if (!data.reservationId && !data.holdId) {
          throw new Error("Réponse invalide (reservationId manquant)");
        }
        if (!expiresAtIso && !Number.isFinite(expiresInSrv)) {
          throw new Error("Réponse invalide (expiresAt/expiresIn manquant)");
        }

        const newReservationId = String(data.reservationId ?? data.holdId);

        setSelectedConsoleId(Number(data.consoleStockId));
        setReservationId(newReservationId);
        setExpiresAt(expiresAtIso || null);
        setIsTimerActive(true);

        if (Number.isFinite(expiresInSrv)) {
          setTimeRemaining(
            Math.max(0, Math.min(timerDuration * 60, expiresInSrv))
          );
        } else {
          setTimeRemaining(computeRemaining(expiresAtIso));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
        setIsTimerActive(false);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedConsole, isTimerActive, timeRemaining, timerDuration]
  );

  const stopTimer = useCallback(() => {
    setIsTimerActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeRemaining(timerDuration * 60);
    setIsTimerActive(false);
    setIsReservationCancelled(false);
    setReservationId(null);
    setExpiresAt(null);
    setError(null);
    setSelectedConsole(null);
    setSelectedConsoleId(0);
    setSelectedGames([]);
    setSelectedAccessories([]);
    setSelectedCours(null);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setCurrentStep(1);
    setUserId(0);
    StorageService.clear();
  }, [timerDuration]);

  const cancelReservation = useCallback(async () => {
    if (!reservationId) return;

    setIsLoading(true);
    try {
      await ReservationAPI.cancelHold(reservationId);
      setIsReservationCancelled(true);
      setIsTimerActive(false);
      setReservationId(null);
      setExpiresAt(null);
      StorageService.clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur annulation");
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  const updateReservationConsole = useCallback(
    async (newConsoleId: number) => {
      if (!reservationId) return;

      try {
        const data = await ReservationAPI.updateHold({
          reservationId,
          newConsoleId,
        });

        if (!data.success) throw new Error("Échec côté serveur");

        if (data.consoleId) {
          setSelectedConsoleId(Number(data.consoleId));
        }

        setSelectedGames([]);
        setSelectedAccessories([]);
        setSelectedCours(null);
        setSelectedDate(undefined);
        setSelectedTime(undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur update plateforme");
      }
    },
    [reservationId]
  );

  const updateReservationAccessories = useCallback(
    async (accessories: number[]) => {
      if (!reservationId) return;

      // Mise à jour optimiste
      setSelectedAccessories(accessories);

      try {
        const data = await ReservationAPI.updateHold({
          reservationId,
          accessories,
        });

        if (!data.success) throw new Error("Échec côté serveur");
      } catch (e) {
        console.error("Erreur update accessoires:", e);
        setError(e instanceof Error ? e.message : "Erreur update accessoires");
      }
    },
    [reservationId]
  );

  const completeReservation = useCallback(async (): Promise<
    ReservationCompletedData | undefined
  > => {
    // Validations
    if (!reservationId) {
      setError("Aucune réservation à finaliser");
      return;
    }
    if (!selectedConsole || !selectedConsoleId) {
      setError("Aucune plateforme sélectionnée");
      return;
    }
    if (selectedGames.length === 0) {
      setError("Aucun jeu sélectionné");
      return;
    }
    if (!selectedCours || !selectedDate || !selectedTime) {
      setError("Informations de réservation incomplètes");
      return;
    }

    console.log("🔍 DEBUG completeReservation:", {
      reservationId,
      selectedConsoleId,
      selectedGames,
      selectedAccessories, // ← Vérifie cette valeur
      selectedCours,
      selectedDate,
      selectedTime,
    });

    setIsLoading(true);
    setError(null);

    try {
      const data = await ReservationAPI.confirmReservation({
        reservationHoldId: reservationId,
        consoleId: selectedConsoleId,
        consoleTypeId: selectedConsole.id,
        game1Id: selectedGames[0] ? Number(selectedGames[0]) : null,
        game2Id: selectedGames[1] ? Number(selectedGames[1]) : null,
        game3Id: selectedGames[2] ? Number(selectedGames[2]) : null,
        accessoryIds: selectedAccessories,
        coursId: selectedCours,
        date: toLocalYmd(selectedDate),
        time: selectedTime,
      });

      // Sauvegarder pour la page de succès
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

      // Reset
      setIsTimerActive(false);
      setReservationId(null);
      setExpiresAt(null);
      StorageService.clear();

      return data.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur finalisation");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [
    reservationId,
    selectedConsole,
    selectedConsoleId,
    selectedGames,
    selectedAccessories,
    selectedCours,
    selectedDate,
    selectedTime,
  ]);

  const clearError = useCallback(() => setError(null), []);

  // ============================================================================
  // EFFETS
  // ============================================================================

  // Restauration au montage
  useEffect(() => {
    const restoreReservation = async () => {
      const savedState = StorageService.load();
      if (!savedState) {
        setIsRestoring(false);
        setIsHydrated(true);
        return;
      }

      try {
        const data = await ReservationAPI.getActiveReservation(
          savedState.reservationId
        );

        if (!data.success || data.status === "expired") {
          StorageService.clear();
          setIsReservationCancelled(true);
          return;
        }

        // Restaurer l'état
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

        if (
          typeof data.expiresIn === "number" &&
          !Number.isNaN(data.expiresIn)
        ) {
          setTimeRemaining(
            Math.max(0, Math.min(timerDuration * 60, data.expiresIn))
          );
        } else if (data.expiresAt) {
          setTimeRemaining(computeRemaining(String(data.expiresAt)));
        }
      } catch (e) {
        console.error("Erreur restauration:", e);
        StorageService.clear();
      } finally {
        setIsRestoring(false);
        setIsHydrated(true);
      }
    };

    restoreReservation();
  }, [timerDuration]);

  // Sauvegarde dans sessionStorage
  useEffect(() => {
    if (!isHydrated) return;

    if (reservationId && !isReservationCancelled) {
      StorageService.save(reservationId);
    } else {
      StorageService.clear();
    }
  }, [isHydrated, reservationId, isReservationCancelled]);

  // Gestion du timer
  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, handleTimeExpired]);

  // ============================================================================
  // VALEUR DU CONTEXTE
  // ============================================================================

  const value: ReservationContextType = {
    // État
    timeRemaining,
    isTimerActive,
    isReservationCancelled,
    isLoading,
    error,
    reservationId,
    expiresAt,
    userId,
    selectedConsole,
    selectedConsoleId,
    selectedGames,
    selectedAccessories,
    selectedCours,
    selectedDate,
    selectedTime,
    currentStep,

    // Actions
    startTimer,
    stopTimer,
    resetTimer,
    cancelReservation,
    completeReservation,
    updateReservationConsole,
    updateReservationAccessories,

    // Mutateurs
    setUserId,
    setSelectedConsole,
    setSelectedGames,
    setSelectedAccessories,
    setCurrentStep,
    setSelectedDate,
    setSelectedTime,
    setSelectedCours,
    clearError,
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  if (isRestoring) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent mb-4" />
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

// ============================================================================
// HOOK
// ============================================================================

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error("useReservation must be used within a ReservationProvider");
  }
  return context;
}
