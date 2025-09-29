"use client";

import { useState } from "react";
import SelectedGameCard from "@/components/select-games/SelectedGamesCard";
import GameSelectionGrid from "@/components/select-games/GamesSelectionGrid";

type Game = {
  id: number;
  titre: string;
  picture: string;
  available: number;
};

export default function Page() {
  const [selected, setSelected] = useState<Game[]>([]);

  const toggleSelect = (game: Game) => {
    if (selected.find(g => g.id === game.id)) {
      setSelected(selected.filter(g => g.id !== game.id));
    } else if (selected.length < 3) {
      setSelected([...selected, game]);
    }
  };

  const clearGame = (id: number) => setSelected(selected.filter(g => g.id !== id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4 sticky top-4">
        <h2 className="text-xl font-bold">Jeux sélectionnés ({selected.length}/3)</h2>
        {selected.length === 0
          ? <p className="text-gray-500">Aucun jeu sélectionné</p>
          : selected.map(g => (
              <SelectedGameCard
                key={g.id}
                game={g}
                onClear={() => clearGame(g.id)}
              />
            ))
        }
        {selected.length > 0 && (
          <button className="w-full bg-blue-600 text-white py-2 rounded mt-2">
            Continuer
          </button>
        )}
      </div>

      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-2">Sélection de jeux</h2>
        <GameSelectionGrid
          selectedIds={selected.map(g => g.id)}
          onSelect={toggleSelect}
        />
      </div>
    </div>
  );
}