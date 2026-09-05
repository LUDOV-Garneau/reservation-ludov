"use client";

import { toast } from "sonner";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/admin/EmptyState";
import { Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";
import PaginationControls from "@/components/admin/Pagination";
import {
  PAGE_SIZE_OPTIONS,
  useGamesImagesFilters,
} from "@/hooks/useGamesImagesFilters";
import GamesImagesFilters from "@/components/admin/games/GamesImagesFilters";
import GamesImagesGrid from "@/components/admin/games/GamesImagesGrid";
import GamesImagesTable from "@/components/admin/games/GamesImagesTable";
import GameImageDialog from "@/components/admin/games/GameImageDialog";
import type { FilterOption, GameRow } from "@/components/admin/games/types";

/**
 * Onglet « Images des jeux » : orchestre les filtres (portés par l'URL), le
 * chargement des jeux et le rendu de la vue choisie. Les vues ne reçoivent que
 * des données et des rappels ; seul le hook touche au routeur.
 */
export default function GamesImagesManager() {
  const t = useTranslations("admin.gamesImages");
  const { filters, setFilters, clearFilters, activeFilterCount } =
    useGamesImagesFilters();

  const [gamesList, setGamesList] = useState<GameRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingGame, setEditingGame] = useState<GameRow | null>(null);
  const [consoleOptions, setConsoleOptions] = useState<FilterOption[]>([]);
  const [stationOptions, setStationOptions] = useState<FilterOption[]>([]);

  // Garde anti-course : seule la dernière requête émise peut écrire l'état.
  const requestIdRef = useRef(0);

  const showAlert = useCallback(
    (type: "success" | "destructive", message: string) => {
      if (type === "success") {
        toast.success(t("alerts.successTitle"), { description: message });
      } else {
        toast.error(t("alerts.errorTitle"), { description: message });
      }
    },
    [t],
  );

  const { search, hasImage, consoleTypeId, stationId, page, pageSize, view } =
    filters;

  const fetchGames = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        hasImage,
      });
      if (search.trim()) params.set("search", search.trim());
      if (consoleTypeId !== null) params.set("consoleTypeId", String(consoleTypeId));
      if (stationId !== null) params.set("stationId", String(stationId));

      const res = await fetch(`/api/admin/games?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

      if (requestId !== requestIdRef.current) return;
      setGamesList(data.games);
      setTotal(data.total);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      showAlert("destructive", t("alerts.fetchError"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, pageSize, search, hasImage, consoleTypeId, stationId, showAlert, t]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Listes des menus déroulants : chargées une fois, endpoints existants.
  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [consolesRes, stationsRes] = await Promise.all([
          fetch("/api/admin/console-type"),
          fetch("/api/admin/stations?all=1"),
        ]);

        if (consolesRes.ok) {
          const rows = (await consolesRes.json()) as FilterOption[];
          if (!cancelled && Array.isArray(rows)) {
            setConsoleOptions(rows.map(({ id, name }) => ({ id, name })));
          }
        }

        if (stationsRes.ok) {
          const payload = await stationsRes.json();
          const rows = payload?.data?.stations;
          if (!cancelled && Array.isArray(rows)) {
            setStationOptions(
              rows.map((station: { id: number; name: string | null }) => ({
                id: station.id,
                name: station.name || `#${station.id}`,
              })),
            );
          }
        }
      } catch (err) {
        // Les filtres restent utilisables sans leurs listes : on n'alerte pas.
        console.error("Chargement des options de filtre:", err);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Page devenue hors bornes (URL modifiée à la main, ou données réduites
  // depuis le dernier chargement) : on ramène à la dernière page réelle.
  useEffect(() => {
    if (loading || total === 0) return;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) setFilters({ page: totalPages });
  }, [loading, total, page, pageSize, setFilters]);

  const handleImageUploaded = useCallback(
    async (game: GameRow, path: string) => {
      try {
        const res = await fetch(`/api/admin/games/${game.id}/image`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setGamesList((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, picture: path } : g)),
        );
        setEditingGame(null);
        showAlert("success", t("alerts.updateSuccess"));
      } catch (err) {
        console.error(err);
        showAlert("destructive", t("alerts.updateError"));
      }
    },
    [showAlert, t],
  );

  const handleImageRemoved = useCallback(
    async (game: GameRow) => {
      try {
        const res = await fetch(`/api/admin/games/${game.id}/image`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: null }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setGamesList((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, picture: null } : g)),
        );
        setEditingGame(null);
        showAlert("success", t("alerts.removeSuccess"));
      } catch (err) {
        console.error(err);
        showAlert("destructive", t("alerts.removeError"));
      }
    },
    [showAlert, t],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGames();
    setIsRefreshing(false);
  };

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <GamesImagesFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            consoleOptions={consoleOptions}
            stationOptions={stationOptions}
            totalItems={total}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )
          ) : gamesList.length === 0 ? (
            <EmptyState icon={Gamepad2} title={t("empty")} />
          ) : view === "grid" ? (
            <GamesImagesGrid games={gamesList} onEdit={setEditingGame} />
          ) : (
            <GamesImagesTable games={gamesList} onEdit={setEditingGame} />
          )}

          {total > 0 && (
            <PaginationControls
              page={page}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={(next) => setFilters({ page: next })}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(next) => setFilters({ pageSize: next })}
              siblingCount={1}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <GameImageDialog
        game={editingGame}
        onClose={() => setEditingGame(null)}
        onUploaded={handleImageUploaded}
        onRemove={handleImageRemoved}
      />
    </div>
  );
}
