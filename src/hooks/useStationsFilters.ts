"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_SIZE,
  STATIONS_PAGE_SIZES,
  type SortDirection,
  type StationStatusFilter,
  type StationsSort,
} from "@/lib/stationsQuery";

/**
 * État de la vue « Stations » (admin), stocké dans le query string pour
 * survivre à un rechargement, à un aller-retour vers un autre onglet et au
 * partage d'un lien. Mêmes deux règles que les onglets Accessoires, Jeux,
 * Plateformes et Réservations :
 *
 * - une valeur par défaut n'est jamais écrite dans l'URL ;
 * - une valeur invalide retombe silencieusement sur le défaut, pour qu'une URL
 *   trafiquée à la main ne casse jamais la page.
 */

export { STATIONS_PAGE_SIZES, DEFAULT_PAGE_SIZE };

export type StationsFiltersState = {
  search: string;
  status: StationStatusFilter;
  sort: StationsSort;
  dir: SortDirection;
  page: number;
  pageSize: number;
};

/** Clés dont la modification renvoie à la première page. */
const PAGE_RESETTING_KEYS = [
  "search",
  "status",
  "sort",
  "dir",
  "pageSize",
] as const satisfies readonly (keyof StationsFiltersState)[];

const STATUS_VALUES: readonly StationStatusFilter[] = [
  "all",
  "active",
  "inactive",
];
const SORT_VALUES: readonly StationsSort[] = [
  "name",
  "created",
  "platforms",
  "status",
];
const DIR_VALUES: readonly SortDirection[] = ["asc", "desc"];

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

export function useStationsFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<StationsFiltersState>(() => {
    const size = parsePositiveInt(searchParams.get("size"));

    return {
      search: searchParams.get("q") ?? "",
      status: parseOneOf(searchParams.get("status"), STATUS_VALUES, "all"),
      sort: parseOneOf(searchParams.get("sort"), SORT_VALUES, "name"),
      dir: parseOneOf(searchParams.get("dir"), DIR_VALUES, "asc"),
      page: parsePositiveInt(searchParams.get("page")) ?? 1,
      pageSize:
        size !== null &&
        (STATIONS_PAGE_SIZES as readonly number[]).includes(size)
          ? size
          : DEFAULT_PAGE_SIZE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<StationsFiltersState>) => {
      const resetsPage = PAGE_RESETTING_KEYS.some((key) => key in patch);
      const next: StationsFiltersState = {
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
      write("status", next.status, next.status === "all");
      write("sort", next.sort, next.sort === "name");
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
    setFilters({ search: "", status: "all" });
  }, [setFilters]);

  /**
   * Cliquer une colonne déjà triée inverse le sens ; en changer remet le sens
   * ascendant, qui est celui qu'on attend en arrivant sur une nouvelle clé.
   */
  const toggleSort = useCallback(
    (sort: StationsSort) => {
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
    (filters.search.trim() === "" ? 0 : 1) + (filters.status === "all" ? 0 : 1);

  /** Chaîne de requête envoyée à l'API, dérivée du même état. */
  const toApiQuery = useCallback((state: StationsFiltersState): string => {
    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.pageSize),
      status: state.status,
      sort: state.sort,
      dir: state.dir,
    });
    if (state.search.trim() !== "") params.set("search", state.search.trim());
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
