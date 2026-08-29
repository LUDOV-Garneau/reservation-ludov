"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  GamesImagesFiltersState,
  HasImageFilter,
} from "@/hooks/useGamesImagesFilters";
import type { FilterOption } from "@/components/admin/games/types";

/** Valeur sentinelle : shadcn/Select refuse une chaîne vide comme valeur. */
const ANY = "any";
const SEARCH_DEBOUNCE_MS = 350;

type Props = {
  filters: GamesImagesFiltersState;
  setFilters: (patch: Partial<GamesImagesFiltersState>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  consoleOptions: FilterOption[];
  stationOptions: FilterOption[];
  totalItems: number;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export default function GamesImagesFilters({
  filters,
  setFilters,
  clearFilters,
  activeFilterCount,
  consoleOptions,
  stationOptions,
  totalItems,
  isRefreshing,
  onRefresh,
}: Props) {
  const t = useTranslations("admin.gamesImages");

  // La recherche est débouncée avant d'atteindre l'URL, donc le champ garde son
  // propre état. `lastWritten` distingue nos écritures des changements venus
  // d'ailleurs (puce retirée, retour arrière) : sans lui, une URL en retard
  // écraserait la frappe en cours.
  const [searchInput, setSearchInput] = useState(filters.search);
  const lastWritten = useRef(filters.search);

  useEffect(() => {
    if (filters.search !== lastWritten.current) {
      lastWritten.current = filters.search;
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  useEffect(() => {
    if (searchInput === lastWritten.current) return;
    const timer = setTimeout(() => {
      lastWritten.current = searchInput;
      setFilters({ search: searchInput });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const consoleName = consoleOptions.find(
    (option) => option.id === filters.consoleTypeId,
  )?.name;
  const stationName = stationOptions.find(
    (option) => option.id === filters.stationId,
  )?.name;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search.trim() !== "") {
    chips.push({
      key: "search",
      label: `« ${filters.search.trim()} »`,
      onRemove: () => setFilters({ search: "" }),
    });
  }
  if (filters.consoleTypeId !== null) {
    chips.push({
      key: "console",
      label: `${t("filters.console")} : ${consoleName ?? filters.consoleTypeId}`,
      onRemove: () => setFilters({ consoleTypeId: null }),
    });
  }
  if (filters.stationId !== null) {
    chips.push({
      key: "station",
      label: `${t("filters.station")} : ${stationName ?? filters.stationId}`,
      onRemove: () => setFilters({ stationId: null }),
    });
  }
  if (filters.hasImage !== "all") {
    chips.push({
      key: "img",
      label:
        filters.hasImage === "yes"
          ? t("filter.withImage")
          : t("filter.withoutImage"),
      onRemove: () => setFilters({ hasImage: "all" }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
          <Select
            value={
              filters.consoleTypeId === null ? ANY : String(filters.consoleTypeId)
            }
            onValueChange={(value) =>
              setFilters({ consoleTypeId: value === ANY ? null : Number(value) })
            }
          >
            <SelectTrigger
              className="w-full lg:w-[180px]"
              aria-label={t("filters.console")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("filters.allConsoles")}</SelectItem>
              {consoleOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.stationId === null ? ANY : String(filters.stationId)}
            onValueChange={(value) =>
              setFilters({ stationId: value === ANY ? null : Number(value) })
            }
          >
            <SelectTrigger
              className="w-full lg:w-[180px]"
              aria-label={t("filters.station")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("filters.allStations")}</SelectItem>
              {stationOptions.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.hasImage}
            onValueChange={(value) =>
              setFilters({ hasImage: value as HasImageFilter })
            }
          >
            <SelectTrigger
              className="w-full lg:w-[170px]"
              aria-label={t("table.status")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all")}</SelectItem>
              <SelectItem value="yes">{t("filter.withImage")}</SelectItem>
              <SelectItem value="no">{t("filter.withoutImage")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 lg:flex-shrink-0">
          <div
            className="flex rounded-md border p-0.5"
            role="group"
            aria-label={t("view.label")}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFilters({ view: "grid" })}
              aria-pressed={filters.view === "grid"}
              aria-label={t("view.grid")}
              className={cn(
                "h-8 w-8",
                filters.view === "grid" && "bg-cyan-50 text-cyan-600",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFilters({ view: "table" })}
              aria-pressed={filters.view === "table"}
              aria-label={t("view.table")}
              className={cn(
                "h-8 w-8",
                filters.view === "table" && "bg-cyan-50 text-cyan-600",
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="hover:bg-gray-100 flex-shrink-0"
                  aria-busy={isRefreshing}
                  aria-live="polite"
                  aria-label={t("refresh")}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("refresh")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            aria-label={t("filters.remove", { label: chip.label })}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 transition-colors hover:bg-cyan-100"
          >
            {chip.label}
            <X className="h-3 w-3" />
          </button>
        ))}
        {activeFilterCount > 1 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            {t("filters.clearAll")}
          </button>
        )}
        <span className="ml-auto text-xs sm:text-sm text-muted-foreground">
          {t("filters.resultCount", { count: totalItems })}
        </span>
      </div>
    </div>
  );
}
