"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useReservation } from "@/context/ReservationContext";
import GameSelectionGrid from "@/components/reservation/components/GamesSelectionGrid";
import { AlertCircle, Loader2, Gamepad2, MoveLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Game = {
  id: number;
  titre: string;
  author?: string;
  picture: string;
  biblio_id?: number;
};

export default function GamesSelection() {
  const {
    selectedGames,
    setSelectedGames,
    setCurrentStep,
    selectedConsole,
    reservationId,
    error,
    clearError,
    currentStep,
  } = useReservation();

  const [selectedGameObjects, setSelectedGameObjects] = useState<Game[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sélection courante déjà résolue en objets, et clé (« 12,7,3 ») de ce qui a
  // été chargé : elles évitent de rappeler l'API à chaque clic et gardent
  // l'ordre de sélection, qui est celui enregistré dans game1/game2/game3.
  const loadedKeyRef = useRef<string>("");

  const applySelection = useCallback(
    (next: Game[]) => {
      loadedKeyRef.current = next.map((g) => String(g.id)).join(",");
      setSelectedGameObjects(next);
      setSelectedGames(next.map((g) => String(g.id)));
    },
    [setSelectedGames]
  );

  useEffect(() => {
    const wanted = selectedGames.map(String);
    const key = wanted.join(",");

    // Sélection déjà à l'écran (clic local) : rien à recharger.
    if (loadedKeyRef.current === key) return;

    if (!reservationId || wanted.length === 0) {
      loadedKeyRef.current = key;
      setSelectedGameObjects([]);
      return;
    }

    let cancelled = false;

    const restoreSelectedGames = async () => {
      setIsLoadingSelected(true);
      try {
        const res = await fetch(
          `/api/reservation/games/details?ids=${encodeURIComponent(key)}`
        );
        if (!res.ok) return;

        const rows: Game[] = await res.json();
        if (cancelled) return;

        const byId = new Map(rows.map((g) => [String(g.id), g]));
        const ordered = wanted
          .map((id) => byId.get(id))
          .filter((g): g is Game => g !== undefined);

        loadedKeyRef.current = key;
        setSelectedGameObjects(ordered);
      } catch (err) {
        console.error(t("games.error.games_restore"), err);
      } finally {
        if (!cancelled) setIsLoadingSelected(false);
      }
    };

    restoreSelectedGames();

    return () => {
      cancelled = true;
    };
  }, [reservationId, selectedGames, t]);

  const toggleSelect = (game: Game) => {
    const isSelected = selectedGameObjects.find((g) => g.id === game.id);

    if (isSelected) {
      applySelection(selectedGameObjects.filter((g) => g.id !== game.id));
    } else if (selectedGameObjects.length < 3) {
      applySelection([...selectedGameObjects, game]);
    } else {
      setLocalError(t("games.error.max_3_games"));
    }
    clearError();
  };

  const clearGame = (gameId: number) => {
    applySelection(selectedGameObjects.filter((g) => g.id !== gameId));
    clearError();
    setLocalError(null);
  };

  const clearAllGames = () => {
    applySelection([]);
    clearError();
    setLocalError(null);
  };

  const handleContinue = async () => {
    if (selectedGameObjects.length === 0) {
      setLocalError(t("games.error.selecte_at_least_one"));
      return;
    }

    if (!reservationId) {
      setLocalError(t("games.error.no_active_reservation"));
      return;
    }

    setIsSaving(true);
    setLocalError(null);

    try {
      const gameIds = selectedGameObjects.map((g) => g.id);
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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        // Le serveur explique pourquoi (jeu déjà retenu, hold expiré…) :
        // ce message est plus utile qu'un échec générique.
        throw new Error(data?.message || t("games.error.save_failed"));
      }

      setCurrentStep(3);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : t("games.error.save_failed")
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!reservationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium text-gray-700">
          {t("games.error.no_active_reservation")}
        </p>
        <Button onClick={() => setCurrentStep(1)} variant="outline">
          {t("reservation.games.error.select_console_first")}
        </Button>
      </div>
    );
  }

  const displayError = error || localError;

  return (
    <div className="grid xl:grid-cols-4 grid-cols-2 gap-6">
      <div className="col-span-2 xl:col-span-1">
        <div className="bg-[white] sticky top-10 rounded-2xl p-6 shadow-lg max-h-[100vh] overflow-y-auto">
          {currentStep > 1 && (
            <div
              onClick={() => setCurrentStep(currentStep - 1)}
              className="cursor-pointer flex flex-row items-center mb-3 w-fit"
            >
              <MoveLeft className="h-6 w-6 mr-2" />
              <p>{t("reservation.layout.previousStep")}</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {t("reservation.games.your_games")}
            </h2>
            <span
              className={`text-sm font-medium px-2 py-1 rounded-full ${
                selectedGameObjects.length === 3
                  ? "bg-green-50 text-green-700"
                  : "bg-cyan-50 text-cyan-500"
              }`}
            >
              {selectedGameObjects.length}/3
            </span>
          </div>

          {selectedConsole && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                {t("reservation.games.selected_platform")}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {selectedConsole.name}
              </p>
            </div>
          )}

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-4 min-h-[fit-content]">
            {isLoadingSelected ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : selectedGameObjects.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-xl">
                  {t("reservation.games.select_up_to_3")}
                </p>
                <p className="text-lg text-gray-400 mt-2">
                  {t("reservation.games.go_through_library")}
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
                      {game.picture === null ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Gamepad2 className="h-10 w-10 text-gray-400" />
                        </div>
                      ) : (
                        <Image
                          src={game.picture}
                          alt={game.titre}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {game.titre}
                      </p>
                    </div>
                    <button
                      onClick={() => clearGame(game.id)}
                      className="2xl:opacity-0 2xl:group-hover:opacity-100 transition-all
                      h-8 w-8 flex items-center justify-center rounded-lg border
                      bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50"
                      aria-label={`Retirer ${game.titre}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {selectedGameObjects.length > 0 && (
                  <button
                    onClick={clearAllGames}
                    className="w-full text-sm text-gray-500 hover:text-red-500 py-2 transition-colors flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-300 bg-gray-50 hover:bg-red-50"
                  >
                    <Trash2 className="inline-block h-4 w-4 mr-1" />
                    {t("reservation.games.buttonClearAll")}
                  </button>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleContinue}
            disabled={selectedGameObjects.length === 0 || isSaving}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition-colors text-white h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("reservation.games.saving")}
              </>
            ) : (
              <>
                {t("reservation.games.continue", {
                  count: selectedGameObjects.length,
                })}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="xl:col-span-3 col-span-2">
        <div className="bg-[white] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {t("reservation.games.game_library")}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("reservation.games.select_up_to_3")}
              </p>
            </div>
          </div>

          <GameSelectionGrid
            selectedIds={selectedGameObjects.map((g) => g.id)}
            onSelect={toggleSelect}
            maxReached={selectedGameObjects.length >= 3}
            consoleSelectedId={selectedConsole ? selectedConsole.id : null}
          />
        </div>
      </div>
    </div>
  );
}
