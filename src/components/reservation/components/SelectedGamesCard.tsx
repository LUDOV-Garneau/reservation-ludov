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
    <div>
      <div>
        <Image
          src={game.picture || "/placeholder_games.jpg"}
          alt={game.titre}
          width={200}
          height={200}
        />
      </div>
    </div>
    // <Card className="w-full shadow-md hover:shadow-lg transition-shadow">
    //   <CardContent className="flex flex-col gap-4 p-4">
    //     <div className="relative w-full aspect-square rounded-xl overflow-hidden">
    //       <Image
    //         src={game.picture || "/placeholder_games.png"}
    //         alt={game.titre}
    //         fill
    //         className="object-cover"
    //       />
    //       <button
    //         onClick={onClear}
    //         aria-label={`Supprimer ${game.titre}`}
    //         className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full px-2 transition"
    //       >
    //         ✕
    //       </button>
    //     </div>
    //     <h2 className="text-lg font-semibold text-center truncate">
    //       {game.titre}
    //     </h2>
    //   </CardContent>
    // </Card>
  );
}
