"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * État de la vue « Accessoires » (admin), stocké dans le query string pour
 * survivre à un rechargement, à un aller-retour vers un autre onglet et au
 * partage d'un lien. Mêmes deux règles que les onglets Jeux et Plateformes :
 *
 * - une valeur par défaut n'est jamais écrite dans l'URL ;
 * - une valeur invalide retombe silencieusement sur le défaut, pour qu'une URL
 *   trafiquée à la main ne casse jamais la page.
 *
 * La sélection des actions groupées n'est délibérément pas ici : elle ne
 * survit pas à un changement de filtre, et un lien partagé ne doit pas
 * pré-cocher des lignes chez la personne qui l'ouvre.
 */

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;
export const DEFAULT_PAGE_SIZE = 24;

/** `all` = toutes, `none` = sans plateforme, un nombre = cet id de plateforme. */
export type PlatformFilter = "all" | "none" | number;
export type VisibilityFilter = "all" | "visible" | "hidden";
export type AccessoriesSort = "name" | "koha" | "consoles" | "visibility";
export type SortDirection = "asc" | "desc";
export type AccessoriesView = "grid" | "table";

export type AccessoriesFiltersState = {
  search: string;
  platform: PlatformFilter;
  visibility: VisibilityFilter;
  sort: AccessoriesSort;
  dir: SortDirection;
  view: AccessoriesView;
  page: number;
  pageSize: number;
};

/** Clés dont la modification renvoie à la première page. */
const PAGE_RESETTING_KEYS = [
  "search",
  "platform",
  "visibility",
  "pageSize",
] as const satisfies readonly (keyof AccessoriesFiltersState)[];

const VISIBILITY_VALUES: readonly VisibilityFilter[] = [
  "all",
  "visible",
  "hidden",
];
const SORT_VALUES: readonly AccessoriesSort[] = [
  "name",
  "koha",
  "consoles",
  "visibility",
];
const DIR_VALUES: readonly SortDirection[] = ["asc", "desc"];
const VIEW_VALUES: readonly AccessoriesView[] = ["grid", "table"];

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parsePlatform(raw: string | null): PlatformFilter {
  if (raw === "none") return "none";
  return parsePositiveInt(raw) ?? "all";
}

/** Sérialisation inverse de `parsePlatform`. */
export function serializePlatformFilter(platform: PlatformFilter): string {
  return typeof platform === "number" ? String(platform) : platform;
}

export function useAccessoriesFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<AccessoriesFiltersState>(() => {
    const visibility = searchParams.get("visibility") as VisibilityFilter | null;
    const sort = searchParams.get("sort") as AccessoriesSort | null;
    const dir = searchParams.get("dir") as SortDirection | null;
    const view = searchParams.get("view") as AccessoriesView | null;
    const size = parsePositiveInt(searchParams.get("size"));

    return {
      search: searchParams.get("q") ?? "",
      platform: parsePlatform(searchParams.get("platform")),
      visibility:
        visibility && VISIBILITY_VALUES.includes(visibility) ? visibility : "all",
      sort: sort && SORT_VALUES.includes(sort) ? sort : "name",
      dir: dir && DIR_VALUES.includes(dir) ? dir : "asc",
      view: view && VIEW_VALUES.includes(view) ? view : "table",
      page: parsePositiveInt(searchParams.get("page")) ?? 1,
      pageSize:
        size !== null && (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
          ? size
          : DEFAULT_PAGE_SIZE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<AccessoriesFiltersState>) => {
      const resetsPage = PAGE_RESETTING_KEYS.some((key) => key in patch);
      const next: AccessoriesFiltersState = {
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
      write(
        "platform",
        serializePlatformFilter(next.platform),
        next.platform === "all",
      );
      write("visibility", next.visibility, next.visibility === "all");
      write("sort", next.sort, next.sort === "name");
      write("dir", next.dir, next.dir === "asc");
      write("view", next.view, next.view === "table");
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
    setFilters({ search: "", platform: "all", visibility: "all" });
  }, [setFilters]);

  /**
   * Cliquer une colonne déjà triée inverse le sens ; en changer remet le sens
   * ascendant, qui est celui qu'on attend en arrivant sur une nouvelle clé.
   */
  const toggleSort = useCallback(
    (sort: AccessoriesSort) => {
      if (filters.sort === sort) {
        setFilters({ dir: filters.dir === "asc" ? "desc" : "asc" });
      } else {
        setFilters({ sort, dir: "asc" });
      }
    },
    [filters.sort, filters.dir, setFilters],
  );

  const activeFilterCount =
    (filters.search.trim() === "" ? 0 : 1) +
    (filters.platform === "all" ? 0 : 1) +
    (filters.visibility === "all" ? 0 : 1);

  return { filters, setFilters, clearFilters, toggleSort, activeFilterCount };
}
