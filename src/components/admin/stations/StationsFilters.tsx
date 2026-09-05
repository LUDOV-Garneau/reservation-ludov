"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Plus, RefreshCw, Search, X } from "lucide-react";
import type { StationsFiltersState } from "@/hooks/useStationsFilters";
import type { StationStatusFilter } from "@/lib/stationsQuery";

const SEARCH_DEBOUNCE_MS = 350;

type Props = {
  filters: StationsFiltersState;
  setFilters: (patch: Partial<StationsFiltersState>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  totalItems: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function StationsFilters({
  filters,
  setFilters,
  clearFilters,
  activeFilterCount,
  totalItems,
  isRefreshing,
  onRefresh,
  onCreate,
}: Props) {
  const t = useTranslations("admin.stations");

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

  const statusLabel = (status: StationStatusFilter): string =>
    ({
      all: t("filter.allStatuses"),
      active: t("table.active"),
      inactive: t("table.inactive"),
    })[status];

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search.trim() !== "") {
    chips.push({
      key: "search",
      label: `« ${filters.search.trim()} »`,
      onRemove: () => setFilters({ search: "" }),
    });
  }
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: statusLabel(filters.status),
      onRemove: () => setFilters({ status: "all" }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("actionBar.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ status: value as StationStatusFilter })
          }
        >
          <SelectTrigger
            className="w-full lg:w-[170px]"
            aria-label={t("table.header.isActive")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("table.active")}</SelectItem>
            <SelectItem value="inactive">{t("table.inactive")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex-shrink-0"
                  aria-busy={isRefreshing}
                  aria-live="polite"
                  aria-label={t("actionBar.toolTipRefresh")}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("actionBar.toolTipRefresh")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={onCreate}
            className="flex-1 gap-2 lg:flex-none bg-cyan-500 text-white transition-colors hover:bg-cyan-600"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden md:inline">
              {t("actionBar.addStation")}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            aria-label={t("filter.remove", { label: chip.label })}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 transition-colors hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 dark:hover:bg-cyan-900"
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
            {t("filter.clearAll")}
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground sm:text-sm">
          {t("filter.resultCount", { count: totalItems })}
        </span>
      </div>
    </div>
  );
}
