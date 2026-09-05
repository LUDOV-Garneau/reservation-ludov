/**
 * Lecture des paramètres de la liste des stations de l'admin.
 *
 * Module pur : ni Drizzle ni réseau, pour se tester sans base. Même règle que
 * les autres onglets — une valeur invalide retombe silencieusement sur le
 * défaut, pour qu'une URL trafiquée à la main ne casse jamais la page.
 */

/** Tailles de page acceptées (le sélecteur de l'interface propose les mêmes). */
export const STATIONS_PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type StationStatusFilter = "all" | "active" | "inactive";
export type StationsSort = "name" | "created" | "platforms" | "status";
export type SortDirection = "asc" | "desc";

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

export type StationsQuery = {
  page: number;
  limit: number;
  offset: number;
  /**
   * `all=1` : renvoyer toutes les stations sans paginer. Existe pour
   * GamesImagesManager, qui demandait `limit=200` — valeur qu'un `limit` borné
   * rejetterait.
   */
  all: boolean;
  search: string;
  status: StationStatusFilter;
  sort: StationsSort;
  dir: SortDirection;
};

function parsePage(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function parseLimit(raw: string | null): number {
  const value = Number(raw);
  return (STATIONS_PAGE_SIZES as readonly number[]).includes(value)
    ? value
    : DEFAULT_PAGE_SIZE;
}

function parseOneOf<T extends string>(
  raw: string | null,
  values: readonly T[],
  fallback: T,
): T {
  return values.includes(raw as T) ? (raw as T) : fallback;
}

export function parseStationsQuery(
  searchParams: URLSearchParams,
): StationsQuery {
  const page = parsePage(searchParams.get("page"));
  const limit = parseLimit(searchParams.get("limit"));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    all: searchParams.get("all") === "1",
    search: (searchParams.get("search") ?? "").trim(),
    status: parseOneOf(searchParams.get("status"), STATUS_VALUES, "all"),
    sort: parseOneOf(searchParams.get("sort"), SORT_VALUES, "name"),
    dir: parseOneOf(searchParams.get("dir"), DIR_VALUES, "asc"),
  };
}
