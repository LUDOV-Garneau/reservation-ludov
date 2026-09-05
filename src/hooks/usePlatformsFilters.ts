"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * État de la vue « Plateformes » (admin), stocké dans le query string pour
 * survivre à un rechargement, à un aller-retour vers un autre onglet et au
 * partage d'un lien. Mêmes deux règles que l'onglet Jeux :
 *
 * - une valeur par défaut n'est jamais écrite dans l'URL ;
 * - une valeur invalide retombe silencieusement sur le défaut, pour qu'une URL
 *   trafiquée à la main ne casse jamais la page.
 */

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;
export const DEFAULT_PAGE_SIZE = 24;

export type PhotoFilter = "all" | "yes" | "no";
export type PlatformsView = "grid" | "table";

export type PlatformsFiltersState = {
  search: string;
  photo: PhotoFilter;
  view: PlatformsView;
  page: number;
  pageSize: number;
};

/** Clés dont la modification renvoie à la première page. */
const PAGE_RESETTING_KEYS = [
  "search",
  "photo",
  "pageSize",
] as const satisfies readonly (keyof PlatformsFiltersState)[];

const PHOTO_VALUES: readonly PhotoFilter[] = ["all", "yes", "no"];
const VIEW_VALUES: readonly PlatformsView[] = ["grid", "table"];

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function usePlatformsFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<PlatformsFiltersState>(() => {
    const photo = searchParams.get("photo") as PhotoFilter | null;
    const view = searchParams.get("view") as PlatformsView | null;
    const size = parsePositiveInt(searchParams.get("size"));

    return {
      search: searchParams.get("q") ?? "",
      photo: photo && PHOTO_VALUES.includes(photo) ? photo : "all",
      view: view && VIEW_VALUES.includes(view) ? view : "grid",
      page: parsePositiveInt(searchParams.get("page")) ?? 1,
      pageSize:
        size !== null && (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
          ? size
          : DEFAULT_PAGE_SIZE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<PlatformsFiltersState>) => {
      const resetsPage = PAGE_RESETTING_KEYS.some((key) => key in patch);
      const next: PlatformsFiltersState = {
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
      write("photo", next.photo, next.photo === "all");
      write("view", next.view, next.view === "grid");
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
    setFilters({ search: "", photo: "all" });
  }, [setFilters]);

  const activeFilterCount =
    (filters.search.trim() === "" ? 0 : 1) + (filters.photo === "all" ? 0 : 1);

  return { filters, setFilters, clearFilters, activeFilterCount };
}
