"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Game = {
  id: number;
  titre: string;
  picture: string;
  available: number;
  biblio_id: number;
};

interface GameSelectionGridProps {
  selectedIds: number[];
  onSelect: (g: Game) => void;
}

export default function GameSelectionGrid({ selectedIds, onSelect }: GameSelectionGridProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const totalRef = useRef(0);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchGames = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/games?page=${page}&limit=12`);
      if (!res.ok) throw new Error("Erreur serveur");

      const { data, total } = await res.json();
      totalRef.current = total;

      setGames((prev) => [...prev, ...data]);
      setHasMore(games.length + data.length < total);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Erreur fetch games :", err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, games.length]);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchGames();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchGames, hasMore, loading]);

  const filtered = games.filter((g) =>
    (g.titre ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
        {filtered.map((game) => (
          <Card
            key={game.id}
            onClick={() => onSelect(game)}
            className={`cursor-pointer transition ${
              selectedIds.includes(game.id)
                ? "ring-2 ring-blue-500"
                : "hover:ring-2 hover:ring-gray-300"
            }`}
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
              <a
                href={`https://ludov.inlibro.net/cgi-bin/koha/opac-detail.pl?biblionumber=${game.biblio_id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-block bg-blue-800 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-900 transition"
              >
                Plus de détails
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {loading && <p>Chargement...</p>}
        {!hasMore && <p>Fin des jeux</p>}
      </div>
    </div>
  );
}
