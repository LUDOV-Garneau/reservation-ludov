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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KeyRound, MoreVertical, RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import AddUserDialog from "./AddUserDialog";
import ResetAllPasswordsDialog from "./ResetAllPasswordsDialog";
import type {
  RoleFilter,
  StatusFilter,
  UsersFiltersState,
} from "@/hooks/useAdminUsersFilters";

const SEARCH_DEBOUNCE_MS = 350;

type AlertType = "success" | "destructive" | "info" | "warning";

type Props = {
  filters: UsersFiltersState;
  setFilters: (patch: Partial<UsersFiltersState>) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  totalItems: number;
  /** Total réel de comptes, indépendant des filtres : sert à la réinitialisation globale. */
  totalUsers: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSuccess: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
};

export default function UsersFilters({
  filters,
  setFilters,
  clearFilters,
  activeFilterCount,
  totalItems,
  totalUsers,
  isRefreshing,
  onRefresh,
  onSuccess,
  onAlert,
}: Props) {
  const t = useTranslations("admin.users");
  const [resetAllOpen, setResetAllOpen] = useState(false);

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

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.search.trim() !== "") {
    chips.push({
      key: "search",
      label: `« ${filters.search.trim()} »`,
      onRemove: () => setFilters({ search: "" }),
    });
  }
  if (filters.role !== "all") {
    chips.push({
      key: "role",
      label: `${t("filters.role")} : ${
        filters.role === "admin" ? t("filters.admins") : t("filters.regularUsers")
      }`,
      onRemove: () => setFilters({ role: "all" }),
    });
  }
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: `${t("filters.status")} : ${
        filters.status === "active"
          ? t("filters.statusActive")
          : t("filters.statusPending")
      }`,
      onRemove: () => setFilters({ status: "all" }),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("actionBar.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:items-center">
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters({ role: value as RoleFilter })}
          >
            <SelectTrigger
              className="w-full lg:w-[180px]"
              aria-label={t("filters.role")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
              <SelectItem value="admin">{t("filters.admins")}</SelectItem>
              <SelectItem value="user">{t("filters.regularUsers")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ status: value as StatusFilter })}
          >
            <SelectTrigger
              className="w-full lg:w-[180px]"
              aria-label={t("filters.status")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("filters.statusActive")}</SelectItem>
              <SelectItem value="pending">{t("filters.statusPending")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 lg:flex-shrink-0">
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

          <AddUserDialog onSuccess={onSuccess} onAlert={onAlert} />

          {/* La réinitialisation globale touche tous les comptes, celui de
              l'admin connecté compris : elle n'a rien à faire au premier plan
              à côté des actions courantes. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
                aria-label={t("moreActions")}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={() => setResetAllOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {t("resetAll.menuItem")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ResetAllPasswordsDialog
            open={resetAllOpen}
            onOpenChange={setResetAllOpen}
            totalUsers={totalUsers}
            onDone={onRefresh}
            onAlert={onAlert}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            aria-label={t("filters.remove", { label: chip.label })}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 transition-colors hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200 dark:hover:bg-cyan-900"
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
