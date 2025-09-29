"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Game = {
  id: number;
  titre: string;
  picture: string;
  available: number;
};

interface GameSelectionGridProps {
  selectedIds: number[];
  onSelect: (g: Game) => void;
}

export default function GameSelectionGrid({ selectedIds, onSelect }: GameSelectionGridProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
      const res = await fetch("/api/games");
        if (!res.ok) {
          throw new Error(`Erreur serveur : ${res.status} ${res.statusText}`);
        }
        const data: Game[] = await res.json();
        setGames(data);
        setLoading(false);
        } catch (err) {
          console.error("Erreur fetch games :", err);
          setLoading(false);
          }
    };
    load();
  }, []);

  const filtered = games.filter(g => (g.titre ?? "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p>Chargement des jeux...</p>;

  return (
    <div className="space-y-4">
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Nom du jeu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(game => (
          <Card
            key={game.id}
            onClick={() => onSelect(game)}
            className={`cursor-pointer transition ${selectedIds.includes(game.id) ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-gray-300"}`}
          >
            <CardContent className="p-2 flex flex-col items-center">
              <div className="relative w-full aspect-video">
                <Image
                  src={game.picture || "/placeholder_games.png"}
                  alt={game.titre}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <p className="mt-2 font-semibold">{game.titre}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}