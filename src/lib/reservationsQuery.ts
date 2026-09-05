import { toLocalYmd } from "@/lib/dates";

/**
 * Lecture des paramètres de la liste des réservations de l'admin.
 *
 * Module volontairement pur : ni Drizzle ni réseau, pour se tester sans base.
 * Il applique la même règle que les autres onglets — une valeur invalide
 * retombe silencieusement sur le défaut, pour qu'une URL trafiquée à la main
 * ne casse jamais la page.
 */

/** Tailles de page acceptées (le sélecteur de l'interface propose les mêmes). */
export const RESERVATIONS_PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type ReservationStatusFilter =
  | "all"
  | "upcoming"
  | "past"
  | "cancelled";
export type ReservationsSort = "schedule" | "user" | "console" | "status";
export type SortDirection = "asc" | "desc";

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

export type ReservationsQuery = {
  page: number;
  limit: number;
  offset: number;
  search: string;
  /** Bornes incluses, `YYYY-MM-DD`, ou `null` quand la borne est ouverte. */
  from: string | null;
  to: string | null;
  status: ReservationStatusFilter;
  sort: ReservationsSort;
  dir: SortDirection;
  /**
   * `from` postérieur à `to`. Traité comme un intervalle vide et non comme une
   * erreur : la liste est vide et la pagination annonce zéro, ce qui est plus
   * lisible qu'un 400 pour une combinaison qu'on atteint en tâtonnant.
   */
  isEmptyRange: boolean;
};

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `YYYY-MM-DD` existant réellement au calendrier. La comparaison avec la date
 * reconstruite écarte les 30 février et les mois 13, que `new Date` accepterait
 * en débordant sur le mois suivant.
 */
function parseYmdParam(raw: string | null): string | null {
  if (!raw || !YMD_PATTERN.test(raw)) return null;

  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? raw
    : null;
}

function parsePage(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function parseLimit(raw: string | null): number {
  const value = Number(raw);
  return (RESERVATIONS_PAGE_SIZES as readonly number[]).includes(value)
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

export function parseReservationsQuery(
  searchParams: URLSearchParams,
): ReservationsQuery {
  const page = parsePage(searchParams.get("page"));
  const limit = parseLimit(searchParams.get("limit"));
  const from = parseYmdParam(searchParams.get("from"));
  const to = parseYmdParam(searchParams.get("to"));

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search: (searchParams.get("search") ?? "").trim(),
    from,
    to,
    status: parseOneOf(searchParams.get("status"), STATUS_VALUES, "all"),
    sort: parseOneOf(searchParams.get("sort"), SORT_VALUES, "schedule"),
    dir: parseOneOf(searchParams.get("dir"), DIR_VALUES, "asc"),
    // Les chaînes `YYYY-MM-DD` se comparent dans l'ordre lexicographique.
    isEmptyRange: from !== null && to !== null && from > to,
  };
}

/**
 * Frontière passé/futur, fournie par l'application et non par
 * `CURDATE()` / `CURTIME()` : le fuseau du serveur MySQL n'est pas celui de
 * l'application, et l'écart déplacerait la limite de plusieurs heures.
 */
export function splitLocalNow(now: Date = new Date()): {
  today: string;
  nowTime: string;
} {
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    today: toLocalYmd(now),
    nowTime: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds(),
    )}`,
  };
}
