import { slotsOverlap } from "@/lib/dates";

/**
 * Conflits d'un créneau, en mémoire (sans base de données).
 *
 * Partagé par `calendar-times` (qui peuple le sélecteur d'heure) et par les
 * tests : la même règle de chevauchement s'applique partout. Les écritures
 * (hold, confirmation) rejouent ces règles en SQL dans `checkSlotBookable`.
 */

export type SlotReservation = {
  time: string;
  consoleId: number;
  game1Id: number | null;
  game2Id: number | null;
  game3Id: number | null;
  accessoryIds: unknown;
  stationId: number | null;
};

export type SlotHold = { time: string | null; stationId: number | null };

export type SlotConflicts = {
  console?: boolean;
  games?: number[];
  accessories?: number[];
  station?: boolean;
  /** L'usager a déjà une réservation (toute plateforme) sur ce créneau. */
  user?: boolean;
  past?: boolean;
};

export type SlotEvaluation = { available: boolean; conflicts?: SlotConflicts };

/** `accessory_ids` est une colonne JSON : tableau, chaîne JSON ou NULL. */
export function parseAccessoryIds(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map(Number).filter(Number.isFinite)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Lignes dont la session chevauche celle qui débuterait à `time`. */
export function overlappingAt<T extends { time: string | null }>(
  rows: T[],
  time: string,
): T[] {
  return rows.filter((r) => r.time !== null && slotsOverlap(r.time, time));
}

export type EvaluateSlotParams = {
  time: string;
  /** Réservations actives du jour (tous usagers). */
  reservations: SlotReservation[];
  /** Holds actifs du jour (hors celui de l'usager). */
  holds: SlotHold[];
  /** Heures de début des réservations de l'usager ce jour-là. */
  userReservationTimes: string[];
  /** Unités actives (console_stock.id) de la plateforme demandée. */
  consoleUnitIds: number[];
  requestedGameIds: number[];
  requestedAccessoryIds: number[];
  /** Stations actives compatibles avec la plateforme. */
  stationIds: number[];
};

export function evaluateSlot(params: EvaluateSlotParams): SlotEvaluation {
  const {
    time,
    reservations,
    holds,
    userReservationTimes,
    consoleUnitIds,
    requestedGameIds,
    requestedAccessoryIds,
    stationIds,
  } = params;

  const conflicts: SlotConflicts = {};
  const overlapping = overlappingAt(reservations, time);

  // Usager : une seule réservation à la fois, toutes plateformes confondues.
  if (userReservationTimes.some((t) => slotsOverlap(t, time))) {
    conflicts.user = true;
  }

  // Plateforme : il faut au moins une unité libre pendant toute la session.
  // Une plateforme en plusieurs exemplaires reste réservable tant qu'une unité
  // n'est pas prise, même si l'unité retenue par le hold l'est.
  const takenUnits = new Set(overlapping.map((r) => r.consoleId));
  if (!consoleUnitIds.some((id) => !takenUnits.has(id))) {
    conflicts.console = true;
  }

  const conflictingGames = new Set<number>();
  for (const res of overlapping) {
    const reserved = [res.game1Id, res.game2Id, res.game3Id].filter(
      (id): id is number => id !== null,
    );
    for (const gid of requestedGameIds) {
      if (reserved.includes(gid)) conflictingGames.add(gid);
    }
  }
  if (conflictingGames.size > 0) conflicts.games = [...conflictingGames];

  const conflictingAcc = new Set<number>();
  for (const res of overlapping) {
    const reserved = parseAccessoryIds(res.accessoryIds);
    for (const aid of requestedAccessoryIds) {
      if (reserved.includes(aid)) conflictingAcc.add(aid);
    }
  }
  if (conflictingAcc.size > 0) conflicts.accessories = [...conflictingAcc];

  const holdsOverlapping = overlappingAt(holds, time);
  const freeStation = stationIds.some(
    (s) =>
      !overlapping.some((r) => r.stationId === s) &&
      !holdsOverlapping.some((h) => h.stationId === s),
  );
  if (!freeStation) conflicts.station = true;

  const hasConflict = Object.keys(conflicts).length > 0;
  return { available: !hasConflict, ...(hasConflict && { conflicts }) };
}

/**
 * Accessoires requis par les jeux : si l'accessoire obligatoire n'est pas
 * dans la sélection, on tente un substitut libre sur ce créneau.
 */
export function resolveAccessoryFallbacks(
  time: string,
  reservations: { time: string; accessoryIds: unknown }[],
  selectedAccessoryIds: number[],
  requiredAccessoryIdMap: Record<number, number[]>,
): { valid: boolean; finalAccessoryIds: number[] } {
  const overlapping = overlappingAt(reservations, time);
  const finalAccessories = [...selectedAccessoryIds];

  for (const gameId of Object.keys(requiredAccessoryIdMap)) {
    const candidates = requiredAccessoryIdMap[Number(gameId)];
    if (!candidates || candidates.length === 0) continue;
    const mandatory = candidates[0];
    if (finalAccessories.includes(mandatory)) continue;

    const free = candidates.find(
      (candidate) =>
        !overlapping.some((res) =>
          parseAccessoryIds(res.accessoryIds).includes(candidate),
        ),
    );
    if (free === undefined) return { valid: false, finalAccessoryIds: [] };
    finalAccessories.push(free);
  }

  return { valid: true, finalAccessoryIds: finalAccessories };
}
