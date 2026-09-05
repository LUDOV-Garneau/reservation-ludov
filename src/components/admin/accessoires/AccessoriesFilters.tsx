"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
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
import {
  serializePlatformFilter,
  type AccessoriesFiltersState,
  type PlatformFilter,
  type VisibilityFilter,
} from "@/hooks/useAccessoriesFilters";
import type { ConsoleTypeOption } from "@/components/admin/accessoires/types";

const SEARCH_DEBOUNCE_MS = 350;

type Props = {
  filters: AccessoriesFiltersState;
  setFilters: (patch: Partial<AccessoriesFiltersState>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  consoleTypes: ConsoleTypeOption[];
  totalItems: number;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export default function AccessoriesFilters({
  filters,
  setFilters,
  clearFilters,
  activeFilterCount,
  consoleTypes,
  totalItems,
  isRefreshing,
  onRefresh,
}: Props) {
  const t = useTranslations("admin.accessories");

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

  const platformLabel = (platform: PlatformFilter): string => {
    if (platform === "none") return t("filter.withoutPlatform");
    const match = consoleTypes.find((option) => option.id === platform);
    return match?.name ?? t("filter.unknownPlatform");
  };

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search.trim() !== "") {
    chips.push({
      key: "search",
      label: `« ${filters.search.trim()} »`,
      onRemove: () => setFilters({ search: "" }),
    });
  }
  if (filters.platform !== "all") {
    chips.push({
      key: "platform",
      label: platformLabel(filters.platform),
      onRemove: () => setFilters({ platform: "all" }),
    });
  }
  if (filters.visibility !== "all") {
    chips.push({
      key: "visibility",
      label:
        filters.visibility === "visible"
          ? t("filter.visibleOnly")
          : t("filter.hiddenOnly"),
      onRemove: () => setFilters({ visibility: "all" }),
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

        <Select
          value={serializePlatformFilter(filters.platform)}
          onValueChange={(value) =>
            setFilters({
              platform:
                value === "all" || value === "none" ? value : Number(value),
            })
          }
        >
          <SelectTrigger
            className="w-full lg:w-[210px]"
            aria-label={t("table.consoles")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allPlatforms")}</SelectItem>
            <SelectItem value="none">{t("filter.withoutPlatform")}</SelectItem>
            {consoleTypes.length > 0 && <SelectSeparator />}
            {consoleTypes.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.visibility}
          onValueChange={(value) =>
            setFilters({ visibility: value as VisibilityFilter })
          }
        >
          <SelectTrigger
            className="w-full lg:w-[170px]"
            aria-label={t("table.visible")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allVisibility")}</SelectItem>
            <SelectItem value="visible">{t("filter.visibleOnly")}</SelectItem>
            <SelectItem value="hidden">{t("filter.hiddenOnly")}</SelectItem>
          </SelectContent>
        </Select>

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
              onClick={() => setFilters({ view: "table" })}
              aria-pressed={filters.view === "table"}
              aria-label={t("view.table")}
              className={cn(
                "h-8 w-8",
                filters.view === "table" &&
                  "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFilters({ view: "grid" })}
              aria-pressed={filters.view === "grid"}
              aria-label={t("view.grid")}
              className={cn(
                "h-8 w-8",
                filters.view === "grid" &&
                  "bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
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
                  className="flex-shrink-0"
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
            {t("filters.clearAll")}
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground sm:text-sm">
          {t("filters.resultCount", { count: totalItems })}
        </span>
      </div>
    </div>
  );
}
