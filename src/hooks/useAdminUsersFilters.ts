"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * État de la vue « Utilisateurs » (admin), stocké dans le query string pour
 * survivre à un rechargement, à un aller-retour vers un autre onglet et au
 * partage d'un lien. Même contrat que `useGamesImagesFilters` :
 *
 * - une valeur par défaut n'est jamais écrite dans l'URL (elle reste courte, et
 *   une URL nue équivaut à l'état par défaut) ;
 * - une valeur invalide retombe silencieusement sur le défaut, pour qu'une URL
 *   trafiquée à la main ne casse jamais la page.
 *
 * Les clés sont préfixées `u` : les onglets partagent une seule URL (`?tab=`),
 * et chaque hook préserve les params qu'il ne connaît pas. Sans préfixe, le
 * `q` des images de jeux atterrirait dans la recherche des utilisateurs en
 * changeant d'onglet.
 */

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type RoleFilter = "all" | "admin" | "user";
export type StatusFilter = "all" | "active" | "pending";
export type SortKey = "name" | "email" | "createdAt" | "lastLogin" | "role";
export type SortOrder = "asc" | "desc";

export type UsersFiltersState = {
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  sort: SortKey;
  order: SortOrder;
  pageSize: number;
  page: number;
};

/** Clés dont la modification renvoie à la première page. */
const PAGE_RESETTING_KEYS = [
  "search",
  "role",
  "status",
  "sort",
  "order",
  "pageSize",
] as const satisfies readonly (keyof UsersFiltersState)[];

const ROLE_VALUES: readonly RoleFilter[] = ["all", "admin", "user"];
const STATUS_VALUES: readonly StatusFilter[] = ["all", "active", "pending"];
const SORT_VALUES: readonly SortKey[] = [
  "name",
  "email",
  "createdAt",
  "lastLogin",
  "role",
];
const ORDER_VALUES: readonly SortOrder[] = ["asc", "desc"];

const DEFAULT_SORT: SortKey = "name";
const DEFAULT_ORDER: SortOrder = "asc";

function parsePositiveInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function parseEnum<T extends string>(
  raw: string | null,
  values: readonly T[],
  fallback: T,
): T {
  return raw !== null && (values as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

export function useAdminUsersFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<UsersFiltersState>(() => {
    const size = parsePositiveInt(searchParams.get("usize"));

    return {
      search: searchParams.get("uq") ?? "",
      role: parseEnum(searchParams.get("urole"), ROLE_VALUES, "all"),
      status: parseEnum(searchParams.get("ustatus"), STATUS_VALUES, "all"),
      sort: parseEnum(searchParams.get("usort"), SORT_VALUES, DEFAULT_SORT),
      order: parseEnum(searchParams.get("uorder"), ORDER_VALUES, DEFAULT_ORDER),
      pageSize:
        size !== null && (PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
          ? size
          : DEFAULT_PAGE_SIZE,
      page: parsePositiveInt(searchParams.get("upage")) ?? 1,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<UsersFiltersState>) => {
      const resetsPage = PAGE_RESETTING_KEYS.some((key) => key in patch);
      const next: UsersFiltersState = {
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

      write("uq", next.search, next.search.trim() === "");
      write("urole", next.role, next.role === "all");
      write("ustatus", next.status, next.status === "all");
      write("usort", next.sort, next.sort === DEFAULT_SORT);
      write("uorder", next.order, next.order === DEFAULT_ORDER);
      write("usize", String(next.pageSize), next.pageSize === DEFAULT_PAGE_SIZE);
      write("upage", String(next.page), next.page === 1);

      const query = params.toString();
      // `replace` et non `push` : la recherche est débouncée mais reste
      // frappe-à-frappe, et inonderait l'historique du navigateur.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router, searchParams],
  );

  /** Bascule le tri : même colonne = on inverse le sens, sinon on repart en asc. */
  const toggleSort = useCallback(
    (key: SortKey) => {
      setFilters(
        filters.sort === key
          ? { order: filters.order === "asc" ? "desc" : "asc" }
          : { sort: key, order: "asc" },
      );
    },
    [filters.sort, filters.order, setFilters],
  );

  const clearFilters = useCallback(() => {
    setFilters({ search: "", role: "all", status: "all" });
  }, [setFilters]);

  // Le tri n'entre pas dans le compte : ce n'est pas un filtre, il ne retire
  // aucune ligne de la liste.
  const activeFilterCount =
    (filters.search.trim() === "" ? 0 : 1) +
    (filters.role === "all" ? 0 : 1) +
    (filters.status === "all" ? 0 : 1);

  return { filters, setFilters, toggleSort, clearFilters, activeFilterCount };
}
