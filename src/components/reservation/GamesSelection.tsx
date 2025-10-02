"use client";

import { useState, useEffect } from "react";
import { useReservation } from "@/context/ReservationContext";
import GameSelectionGrid from "@/components/reservation/components/GamesSelectionGrid";
import { AlertCircle, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Game = {
  id: number;
  titre: string;
  author?: string;
  picture: string;
  available: number;
  biblio_id?: number;
};

export default function GamesSelection() {
  const { 
    selectedGames,       // IDs des jeux sauvegardés en BD
    setSelectedGames, 
    setCurrentStep,
    selectedConsole,
    reservationId,
    error,
    clearError
  } = useReservation();

  const [selectedGameObjects, setSelectedGameObjects] = useState<Game[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  /**
   * Restaure les jeux déjà sauvegardés dans le contexte
   */
  useEffect(() => {
    const restoreSelectedGames = async () => {
      if (!reservationId || selectedGames.length === 0) {
        setSelectedGameObjects([]);
        return;
      }

      setIsLoadingSelected(true);
      try {
        // Récupère les détails des jeux déjà sélectionnés
        const gameIds = selectedGames.join(",");
        const res = await fetch(`/api/reservation/games/details?ids=${gameIds}`);
        if (res.ok) {
          const games = await res.json();
          setSelectedGameObjects(games);
        }
      } catch (err) {
        console.error("Erreur restauration jeux:", err);
      } finally {
        setIsLoadingSelected(false);
      }
    };

    restoreSelectedGames();
  }, [reservationId, selectedGames]);

  /**
   * Toggle sélection/désélection
   */
  const toggleSelect = (game: Game) => {
    const isSelected = selectedGameObjects.find(g => g.id === game.id);
    
    if (isSelected) {
      const newSelection = selectedGameObjects.filter(g => g.id !== game.id);
      setSelectedGameObjects(newSelection);
      setSelectedGames(newSelection.map(g => String(g.id))); // update contexte
    } else if (selectedGameObjects.length < 3) {
      const newSelection = [...selectedGameObjects, game];
      setSelectedGameObjects(newSelection);
      setSelectedGames(newSelection.map(g => String(g.id)));
    } else {
      setLocalError("Maximum 3 jeux peuvent être sélectionnés");
    }
    clearError();
  };

  /**
   * Supprimer un jeu
   */
  const clearGame = (gameId: number) => {
    const newSelection = selectedGameObjects.filter(g => g.id !== gameId);
    setSelectedGameObjects(newSelection);
    setSelectedGames(newSelection.map(g => String(g.id)));
    clearError();
    setLocalError(null);
  };

  /**
   * Sauvegarder en BD et passer à l’étape suivante
   */
  const handleContinue = async () => {
    if (selectedGameObjects.length === 0) {
      setLocalError("Sélectionnez au moins un jeu");
      return;
    }

    if (!reservationId) {
      setLocalError("Aucune réservation active");
      return;
    }

    setIsSaving(true);
    setLocalError(null);

    try {
      const gameIds = selectedGameObjects.map(g => g.id);
      const res = await fetch("/api/reservation/update-hold-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          game1Id: gameIds[0] || null,
          game2Id: gameIds[1] || null,
          game3Id: gameIds[2] || null,
        }),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde");

      const data = await res.json();
      if (data.success) {
        setCurrentStep(3);
      }
    } catch (err) {
      setLocalError("Erreur lors de la sauvegarde");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!reservationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium text-gray-700">
          Aucune réservation active
        </p>
        <Button onClick={() => setCurrentStep(1)} variant="outline">
          Sélectionner une console d&#39;abord
        </Button>
      </div>
    );
  }

  const displayError = error || localError;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panneau latéral - Sélection */}
      <div className="lg:col-span-1">
        <div className="bg-[white] sticky top-24 rounded-2xl p-6 shadow-lg max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Vos jeux</h2>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              selectedGameObjects.length === 3 
                ? 'bg-green-50 text-green-700' 
                : 'bg-cyan-50 text-cyan-700'
            }`}>
              {selectedGameObjects.length}/3
            </span>
          </div>

          {/* Info console si disponible */}
          {selectedConsole && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Console réservée</p>
              <p className="text-sm font-medium text-gray-700">{selectedConsole.name}</p>
            </div>
          )}

          {/* Erreurs */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            </div>
          )}

          {/* Liste des jeux sélectionnés */}
          <div className="space-y-3 mb-4 min-h-[300px]">
            {isLoadingSelected ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : selectedGameObjects.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Sélectionnez jusqu&#39;à 3 jeux
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Parcourez la liste pour choisir
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedGameObjects.map((game) => (
                  <div 
                    key={game.id} 
                    className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 group hover:shadow-md transition-shadow"
                  >
                    <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={game.picture || "/placeholder_games.jpg"}
                        alt={game.titre}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {game.titre}
                      </p>
                    </div>
                    <button
                      onClick={() => clearGame(game.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                      aria-label={`Retirer ${game.titre}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bouton continuer */}
          <Button
            onClick={handleContinue}
            disabled={selectedGameObjects.length === 0 || isSaving}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                Continuer
                {selectedGameObjects.length > 0 && 
                  ` (${selectedGameObjects.length} jeu${selectedGameObjects.length > 1 ? 'x' : ''})`
                }
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grille principale */}
      <div className="lg:col-span-3">
        <div className="bg-[white] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Bibliothèque de jeux
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choisissez jusqu&#39;à 3 jeux pour votre réservation
              </p>
            </div>
            
          </div>

          <GameSelectionGrid
            selectedIds={selectedGameObjects.map(g => g.id)}
            onSelect={toggleSelect}
            maxReached={selectedGameObjects.length >= 3}
          />
        </div>
      </div>
    </div>
  );
}