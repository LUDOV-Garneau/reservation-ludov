"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

type Game = {
  id: number;
  titre: string;
  picture: string;
};

interface SelectedGameCardProps {
  game: Game;
  onClear: () => void;
}

export default function SelectedGameCard({ game, onClear }: SelectedGameCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="relative w-full aspect-square">
          <Image
            src={game.picture || "/placeholder_games.png"}
            alt={game.titre}
            fill
            className="object-cover rounded-xl"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2"
          >
            ✕
          </button>
        </div>
        <h2 className="text-lg font-semibold text-center">{game.titre}</h2>
      </CardContent>
    </Card>
  );
}