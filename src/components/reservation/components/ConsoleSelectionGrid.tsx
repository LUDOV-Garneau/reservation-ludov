"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Search, Loader2, AlertCircle, Check, RefreshCw, Gamepad2 } from "lucide-react";

interface Console {
  id: number;
  name: string;
  nombre: number;
  image: string;
}

interface ConsoleSelectionGridProps {
  selectedId: number | null;
  onSelect: (console: Console) => void;
}

type LoadingState = "idle" | "loading" | "success" | "error";

export default function ConsoleSelectionGrid({
  selectedId,
  onSelect,
}: ConsoleSelectionGridProps) {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [search, setSearch] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchConsoles = useCallback(async () => {
    try {
      setLoadingState("loading");
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/reservation/consoles", {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || `Erreur ${res.status}: ${res.statusText}`
        );
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide");
      }

      const validatedConsoles: Console[] = data.map((c: Console) => {
        if (!c.id || !c.name) {
          console.warn("Console avec données manquantes:", c);
        }

        return {
          id: Number(c.id) || 0,
          name: c.name || "Console inconnue",
          nombre: Number(c.nombre) || Number(c.nombre) || 0,
          image: c.image || "/placeholder_consoles.jpg",
        };
      }).filter(c => c.id > 0);

      setConsoles(validatedConsoles);
      setLoadingState("success");
      
      console.log(`${validatedConsoles.length} consoles chargées avec succès`);
      
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      
      let errorMessage = "Une erreur est survenue";
      
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Le chargement a pris trop de temps";
        } else if (err.message.includes("fetch")) {
          errorMessage = "Problème de connexion au serveur";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoadingState("error");
    }
  }, []);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchConsoles();
  }, [fetchConsoles]);

  useEffect(() => {
    fetchConsoles();
  }, [fetchConsoles]);

  const filteredConsoles = useMemo(() => {
    if (!search.trim()) return consoles;
    
    const searchLower = search.toLowerCase();
    return consoles.filter((c) =>
      c.name.toLowerCase().includes(searchLower)
    );
  }, [consoles, search]);

  const handleSelect = useCallback((console: Console) => {
    onSelect(console);
  }, [onSelect]);

  if (loadingState === "loading" && consoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <p className="text-gray-600 font-medium">Chargement des consoles...</p>
        <p className="text-sm text-gray-500">Cela peut prendre quelques secondes</p>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg mb-1">{error}</p>
          <p className="text-sm text-gray-500">
            {retryCount > 0 && `Tentative ${retryCount} échouée`}
          </p>
        </div>
        <button
          onClick={retry}
          className="mt-2 px-6 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }

  if (consoles.length === 0 && loadingState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Gamepad2 className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600 font-medium">Aucune console disponible</p>
        <button
          onClick={retry}
          className="text-cyan-500 hover:text-cyan-600 text-sm underline"
        >
          Actualiser
        </button>
      </div>
    );
  }

  const availableConsoles = filteredConsoles.filter(c => c.nombre > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher une console..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-base rounded-lg"
            aria-label="Rechercher une console"
          />
        </div>
        {search && (
          <p className="text-sm text-gray-500 px-1">
            {availableConsoles.length} console{availableConsoles.length > 1 ? 's' : ''} disponible{availableConsoles.length > 1 ? 's' : ''} trouvée{availableConsoles.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {availableConsoles.length === 0 && search && (
        <div className="text-center py-12">
          <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Aucune console disponible pour {search}
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 text-cyan-500 hover:text-cyan-600 text-sm underline"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {availableConsoles.length === 0 && !search && consoles.length > 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Aucune console est actuellement disponible
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Toutes les consoles sont réservées
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {availableConsoles.map((console) => {
          const isSelected = selectedId === console.id;
          
          return (
            <div
              key={console.id}
              onClick={() => handleSelect(console)}
              className={`
                relative group
                rounded-xl overflow-hidden shadow-md
                transition-all duration-200 cursor-pointer 
                hover:scale-[1.02]
                ${isSelected ? 'ring-2 ring-cyan-500 scale-[1.02]' : ''}
              `}
            >
              <div className="relative w-full h-48 bg-gray-100">
                <Image
                  src={console.image}
                  alt={console.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder_consoles.jpg";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-lg font-bold line-clamp-2">
                    {console.name}
                  </p>
                  <p className="text-white/90 text-sm mt-1">
                    {console.nombre} disponible{console.nombre > 1 ? 's' : ''}
                  </p>
                </div>

                 {isSelected && (
                  <div className="absolute top-3 right-3 bg-cyan-500 rounded-full p-2 shadow-lg animate-in zoom-in-50">
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}