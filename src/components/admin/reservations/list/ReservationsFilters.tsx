"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CalendarIcon, RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseYmdLocal, toLocalYmd } from "@/lib/dates";
import type { ReservationsFiltersState } from "@/hooks/useReservationsFilters";
import type { ReservationStatusFilter } from "@/lib/reservationsQuery";

const SEARCH_DEBOUNCE_MS = 350;

/** Affichage d'une borne ; le stockage reste `YYYY-MM-DD`. */
function formatYmd(ymd: string | null, locale: string): string | null {
  if (!ymd) return null;
  return parseYmdLocal(ymd).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DateBoundPicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  locale,
}: {
  value: string | null;
  onChange: (ymd: string | null) => void;
  placeholder: string;
  ariaLabel: string;
  locale: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "w-full justify-start gap-2 font-normal lg:w-[190px]",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {formatYmd(value, locale) ?? placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseYmdLocal(value) : undefined}
          onSelect={(date) => {
            onChange(date ? toLocalYmd(date) : null);
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

type Props = {
  filters: ReservationsFiltersState;
  setFilters: (patch: Partial<ReservationsFiltersState>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  totalItems: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  locale: string;
};

export default function ReservationsFilters({
  filters,
  setFilters,
  clearFilters,
  activeFilterCount,
  totalItems,
  isRefreshing,
  onRefresh,
  locale,
}: Props) {
  const t = useTranslations("admin.reservations");

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

  const statusLabel = (status: ReservationStatusFilter): string =>
    ({
      all: t("filter.allStatuses"),
      upcoming: t("status.upcoming"),
      past: t("status.past"),
      cancelled: t("status.cancelled"),
    })[status];

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search.trim() !== "") {
    chips.push({
      key: "search",
      label: `« ${filters.search.trim()} »`,
      onRemove: () => setFilters({ search: "" }),
    });
  }
  if (filters.from) {
    chips.push({
      key: "from",
      label: `${t("filter.fromLabel")} ${formatYmd(filters.from, locale)}`,
      onRemove: () => setFilters({ from: null }),
    });
  }
  if (filters.to) {
    chips.push({
      key: "to",
      label: `${t("filter.toLabel")} ${formatYmd(filters.to, locale)}`,
      onRemove: () => setFilters({ to: null }),
    });
  }
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: statusLabel(filters.status),
      onRemove: () => setFilters({ status: "all" }),
    });
  }

  // Un intervalle inversé ne renvoie rien : on le dit ici, plutôt que de
  // laisser l'état vide se faire passer pour « aucune réservation ».
  const invertedRange =
    filters.from !== null && filters.to !== null && filters.from > filters.to;

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

        <DateBoundPicker
          value={filters.from}
          onChange={(from) => setFilters({ from })}
          placeholder={t("filter.fromPlaceholder")}
          ariaLabel={t("filter.fromLabel")}
          locale={locale}
        />
        <DateBoundPicker
          value={filters.to}
          onChange={(to) => setFilters({ to })}
          placeholder={t("filter.toPlaceholder")}
          ariaLabel={t("filter.toLabel")}
          locale={locale}
        />

        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ status: value as ReservationStatusFilter })
          }
        >
          <SelectTrigger
            className="w-full lg:w-[170px]"
            aria-label={t("table.header.status")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
            <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
            <SelectItem value="past">{t("status.past")}</SelectItem>
            <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
          </SelectContent>
        </Select>

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

      {invertedRange && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t("filter.invertedRange")}
        </p>
      )}

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
