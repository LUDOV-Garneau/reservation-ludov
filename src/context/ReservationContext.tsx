"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ReservationContextType {
  timeRemaining: number;
  isTimerActive: boolean;
  isReservationCancelled: boolean;
  isLoading: boolean;
  error: string | null;
  reservationId: string | null;
  
  startTimer: () => Promise<void>;
  stopTimer: () => void;
  resetTimer: () => void;
  
  userId: number;
  selectedConsole: number | null;
  selectedGames: string[];
  currentStep: number;
  
  setUserId: (id: number) => void;
  setSelectedConsole: (console: number) => void;
  setSelectedGames: (games: string[]) => void;
  setCurrentStep: (step: number) => void;
  
  cancelReservation: () => Promise<void>;
  completeReservation: () => Promise<void>;
  clearError: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

interface ReservationProviderProps {
  children: ReactNode;
  timerDuration?: number;
}

export function ReservationProvider({ 
  children, 
  timerDuration = 15 
}: ReservationProviderProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(timerDuration * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isReservationCancelled, setIsReservationCancelled] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<number>(0);
  const [selectedConsole, setSelectedConsole] = useState<number | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) {
      if (timeRemaining <= 0 && !isReservationCancelled) {
        handleTimeExpired();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  const handleTimeExpired = async () => {
    setIsReservationCancelled(true);
    setIsTimerActive(false);
    
    if (reservationId) {
      try {
        await fetch(`/api/reservations/${reservationId}/cancel`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
        });
      } catch (error) {
        console.error("Failed to cancel expired reservation:", error);
      }
    }
  };

  const startTimer = async (): Promise<void> => {
    if (!userId || !selectedConsole) {
      setError("Informations manquantes pour démarrer la réservation");
      return;
    }

    if (isTimerActive && timeRemaining > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reservation/create-hold-reservation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: userId, 
          consoleId: selectedConsole
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la réservation');
      }

      const data = await res.json();
      setReservationId(data.reservationId);
      setIsTimerActive(true);
      
    } catch (error) {
      console.error("Failed to create hold reservation:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setIsTimerActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopTimer = () => {
    setIsTimerActive(false);
  };

  const resetTimer = () => {
    setTimeRemaining(timerDuration * 60);
    setIsTimerActive(false);
    setIsReservationCancelled(false);
    setReservationId(null);
    setError(null);
  };

  const cancelReservation = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      if (reservationId) {
        const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
        });

        if (!res.ok) {
          throw new Error('Erreur lors de l\'annulation');
        }
      }

      setIsReservationCancelled(true);
      setIsTimerActive(false);
      setReservationId(null);
      
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      setError(error instanceof Error ? error.message : "Erreur d'annulation");
    } finally {
      setIsLoading(false);
    }
  };

  const completeReservation = async (): Promise<void> => {
    if (!reservationId || selectedGames.length === 0) {
      setError("Informations manquantes pour finaliser la réservation");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reservations/${reservationId}/complete`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          games: selectedGames,
          userId: userId,
          console: selectedConsole
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la finalisation');
      }

      setIsTimerActive(false);
      // Redirection ou success state ici
      
    } catch (error) {
      console.error("Failed to complete reservation:", error);
      setError(error instanceof Error ? error.message : "Erreur de finalisation");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: ReservationContextType = {
    timeRemaining,
    isTimerActive,
    isReservationCancelled,
    
    isLoading,
    error,
    reservationId,
    
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

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}