"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_SIZE,
  RESERVATIONS_PAGE_SIZES,
  type ReservationStatusFilter,
  type ReservationsSort,
  type SortDirection,
} from "@/lib/reservationsQuery";

/**
 * État de la vue « Réservations » (admin), stocké dans le query string pour
 * survivre à un rechargement, à un aller-retour vers un autre onglet et au
 * partage d'un lien. Mêmes deux règles que les onglets Accessoires, Jeux et
 * Plateformes :
 *
 * - une valeur par défaut n'est jamais écrite dans l'URL ;
 * - une valeur invalide retombe silencieusement sur le défaut, pour qu'une URL
 *   trafiquée à la main ne casse jamais la page.
 *
 * Les noms de paramètres sont ceux de l'API (`from`, `to`, `status`, `sort`,
 * `dir`) : l'URL de la page et celle de la requête disent la même chose, ce
 * qui rend un signalement de bogue lisible tel quel.
 */

export { RESERVATIONS_PAGE_SIZES, DEFAULT_PAGE_SIZE };

export type ReservationsFiltersState = {
  search: string;
  /** Bornes incluses au format `YYYY-MM-DD`, `null` quand la borne est ouverte. */
  from: string | null;
  to: string | null;
  status: ReservationStatusFilter;
  sort: ReservationsSort;
  dir: SortDirection;
  page: number;
  pageSize: number;
};

/** Clés dont la modification renvoie à la première page. */
const PAGE_RESETTING_KEYS = [
  "search",
  "from",
  "to",
  "status",
  "sort",
  "dir",
  "pageSize",
] as const satisfies readonly (keyof ReservationsFiltersState)[];

const STATUS_VALUES: readonly ReservationStatusFilter[] = [
  "all",
  "upcoming",
  "past",
  "cancelled",
];
const SORT_VALUES: readonly ReservationsSort[] = [
  "schedule",
  "user",
  "console",
  "status",
];
const DIR_VALUES: readonly SortDirection[] = ["asc", "desc"];

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Même exigence que côté serveur : format ET existence au calendrier. */
function parseYmd(raw: string | null): string | null {
  if (!raw || !YMD_PATTERN.test(raw)) return null;

  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? raw
    : null;
}

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseOneOf<T extends string>(
  raw: string | null,
  values: readonly T[],
  fallback: T,
): T {
  return values.includes(raw as T) ? (raw as T) : fallback;
}

export function useReservationsFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<ReservationsFiltersState>(() => {
    const size = parsePositiveInt(searchParams.get("size"));

    return {
      search: searchParams.get("q") ?? "",
      from: parseYmd(searchParams.get("from")),
      to: parseYmd(searchParams.get("to")),
      status: parseOneOf(searchParams.get("status"), STATUS_VALUES, "all"),
      sort: parseOneOf(searchParams.get("sort"), SORT_VALUES, "schedule"),
      dir: parseOneOf(searchParams.get("dir"), DIR_VALUES, "asc"),
      page: parsePositiveInt(searchParams.get("page")) ?? 1,
      pageSize:
        size !== null &&
        (RESERVATIONS_PAGE_SIZES as readonly number[]).includes(size)
          ? size
          : DEFAULT_PAGE_SIZE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ReservationsFiltersState>) => {
      const resetsPage = PAGE_RESETTING_KEYS.some((key) => key in patch);
      const next: ReservationsFiltersState = {
        ...filters,
        ...patch,
        page: patch.page ?? (resetsPage ? 1 : filters.page),
      };

      // Les params étrangers au hook sont préservés, à commencer par `tab`.
      const params = new URLSearchParams(searchParams.toString());
      const write = (key: string, value: string, isDefault: boolean) => {
        if (isDefault) params.delete(key);
        else params.set(key, value);
      };

      write("q", next.search, next.search.trim() === "");
      write("from", next.from ?? "", next.from === null);
      write("to", next.to ?? "", next.to === null);
      write("status", next.status, next.status === "all");
      write("sort", next.sort, next.sort === "schedule");
      write("dir", next.dir, next.dir === "asc");
      write("page", String(next.page), next.page === 1);
      write("size", String(next.pageSize), next.pageSize === DEFAULT_PAGE_SIZE);

      const query = params.toString();
      // `replace` et non `push` : la recherche est débouncée mais reste
      // frappe-à-frappe, et inonderait l'historique du navigateur.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    setFilters({ search: "", from: null, to: null, status: "all" });
  }, [setFilters]);

  /**
   * Cliquer une colonne déjà triée inverse le sens ; en changer remet le sens
   * ascendant, qui est celui qu'on attend en arrivant sur une nouvelle clé.
   */
  const toggleSort = useCallback(
    (sort: ReservationsSort) => {
      if (filters.sort === sort) {
        setFilters({ dir: filters.dir === "asc" ? "desc" : "asc" });
      } else {
        setFilters({ sort, dir: "asc" });
      }
    },
    [filters.sort, filters.dir, setFilters],
  );

  /** Compte les filtres actifs — le tri n'en est pas un, il ne cache rien. */
  const activeFilterCount =
    (filters.search.trim() === "" ? 0 : 1) +
    (filters.from === null ? 0 : 1) +
    (filters.to === null ? 0 : 1) +
    (filters.status === "all" ? 0 : 1);

  /** Chaîne de requête envoyée à l'API, dérivée du même état. */
  const toApiQuery = useCallback((state: ReservationsFiltersState): string => {
    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.pageSize),
      sort: state.sort,
      dir: state.dir,
      status: state.status,
    });
    if (state.search.trim() !== "") params.set("search", state.search.trim());
    if (state.from) params.set("from", state.from);
    if (state.to) params.set("to", state.to);
    return params.toString();
  }, []);

  return {
    filters,
    setFilters,
    clearFilters,
    toggleSort,
    activeFilterCount,
    toApiQuery,
  };
}
