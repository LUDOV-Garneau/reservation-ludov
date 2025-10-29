"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Search, Check, Gamepad2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Game = {
  id: number;
  titre: string;
  author?: string;
  picture: string;
  available: number;
  biblio_id?: number;
  platform: string;
};

interface GameSelectionGridProps {
  selectedIds: number[];
  onSelect: (game: Game) => void;
  maxReached: boolean;
  consoleSelectedId: number | null;
}

const ITEMS_PER_PAGE = 12;

export default function GameSelectionGrid({ 
  selectedIds, 
  onSelect, 
  maxReached,
  consoleSelectedId
}: GameSelectionGridProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState("");
  const [totalGames, setTotalGames] = useState(0);
  const [consoleId] = useState<number | null>(consoleSelectedId || null);
  
  // Ref pour l'intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour charger les jeux
  const loadGames = useCallback(async (pageNum: number, searchQuery: string, reset: boolean = false, consoleId: number | null) => {
    if (loading || (!hasMore && !reset)) return;

    
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(ITEMS_PER_PAGE),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/reservation/games?${params}&consoleId=${consoleId}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des jeux");
      
      const data = await res.json();

      
      if (reset) {
        setGames(data.games || []);
        setPage(1);
      } else {
        setGames(prev => [...prev, ...(data.games || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setTotalGames(data.pagination?.total || 0);
      
    } catch (err) {
      console.error("Erreur chargement jeux:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    setGames([]);
    setPage(1);
    setHasMore(true);
    loadGames(1, searchDebounce, true, consoleId);
  }, [searchDebounce]);

  // Intersection Observer pour l'infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !search){
        setPage(prev => {
          const next = prev + 1;
          loadGames(next, searchDebounce, false, consoleId);
          return next;
        });
      }},
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [page, hasMore, loading, search, searchDebounce, loadGames]);

  // Gestion du scroll manuel pour la recherche
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadGames(nextPage, searchDebounce, false, consoleId);
    }
  };

  return (
    <div className="space-y-">
      <div className="bg-[white] z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher un jeu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-base rounded-lg"
          />
        </div>
        
        {/* Statistiques */}
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <div>
            {search && loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Recherche...
              </span>
            ) : totalGames > 0 ? (
              <span>{totalGames} jeu{totalGames > 1 ? 'x' : ''} disponible{totalGames > 1 ? 's' : ''}</span>
            ) : null}
          </div>
          {games.length > 0 && (
            <span>Affiché: {games.length}</span>
          )}
        </div>
      </div>

      {/* État de chargement initial */}
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mb-4" />
          <p className="text-gray-600">Chargement des jeux...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            {search ? `Aucun jeu trouvé pour "${search}"` : "Aucun jeu disponible"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-cyan-500 hover:text-cyan-600 text-sm underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grille des jeux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {games.map((game) => {
              const isSelected = selectedIds.includes(game.id);
              const isDisabled = !isSelected && maxReached;

              return (
                <div
                  key={game.id}
                  onClick={() => {
                    if (!isDisabled) {
                      onSelect(game);
                    }
                  }}
                  className={`
                    relative group rounded-xl overflow-hidden shadow-md
                    transition-all duration-200
                    ${isSelected ? 'ring-2 ring-cyan-500 scale-[0.98]' : ''}
                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:scale-[1.02]'}
                  `}
                >
                  {/* Image du jeu */}
                  <div className="relative h-96">
                    {game.picture === null ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Gamepad2 className="h-20 w-20 text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-full h-96 relative">
                        <Image
                          src={game.picture}
                          alt={game.titre}
                          fill
                          className="object-cover object-top sm:h-52"
                          loading="lazy"
                        />
                      </div>

                    )}
                    
                    {/* Overlay au hover */}
                    <div className={`${game.picture !== null && "2xl:opacity-0 2xl:group-hover:opacity-100 2xl:transition-opacity"} absolute inset-0 bg-gradient-to-t from-black/100 via-black to-transparent top-40`} />

                    {/* Badge sélectionné */}
                    {isSelected && (
                      <div className="absolute top-2 right-1 bg-cyan-500 rounded-full p-2 shadow-lg animate-in zoom-in-50">
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                    )}

                    <div className={`${game.picture !== null && ("2xl:opacity-0 2xl:group-hover:opacity-100 2xl:transition-opacity")} absolute top-2 left-2`}>
                      <div className="bg-black/70 text-white rounded-full px-2 py-1 font-medium flex items-center gap-2">
                        <img src="/ConsoleLogos/Playstation.png" className="w-5"></img>
                        {game.platform}
                      </div>
                    </div>

                    <div className={`${game.picture !== null && ("2xl:group-hover:opacity-100 2xl:transition-opacity 2xl:opacity-0")} absolute bottom-0 left-0 right-0 p-4`}>
                      <div className="flex flex-col gap-4 items-center">
                        <p className="text-white text-lg font-bold line-clamp-2">
                          {game.titre}
                        </p>
                        <Link href={`https://ludov.inlibro.net/cgi-bin/koha/opac-detail.pl?biblionumber=${game.biblio_id}`} target="_blank" rel="noopener noreferrer">
                          <Button   
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs lg:text-sm">
                              Plus de détails
                          </Button>
                        </Link>

                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Observer target pour l'infinite scroll */}
          {!search && (
            <div 
              ref={observerTarget} 
              className="flex justify-center py-4"
            >
              {loading && hasMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Chargement de plus de jeux...</span>
                </div>
              )}
              
              {!hasMore && games.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Fin de la liste • {games.length} jeux affichés
                </p>
              )}
            </div>
          )}

          {/* Bouton "Charger plus" pour la recherche */}
          {search && hasMore && !loading && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
              >
                Charger plus de résultats
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}