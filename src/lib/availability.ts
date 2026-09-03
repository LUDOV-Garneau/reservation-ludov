import { sql, type SQL } from "drizzle-orm";
import { executeRows } from "@/db";
import { isFutureSlot, SESSION_DURATION_HOURS } from "@/lib/dates";

export { SESSION_DURATION_HOURS };

/**
 * Règles d'ouverture et conflits de créneau, côté serveur.
 *
 * `calendar-times` calcule les mêmes règles pour peupler le sélecteur d'heure,
 * mais un client peut très bien poster une heure fermée ou un créneau qu'un
 * autre usager vient de prendre. Les écritures (hold puis réservation ferme)
 * repassent donc par ces vérifications, à l'intérieur de leur transaction et
 * avec des lectures verrouillantes pour que deux réservations simultanées ne
 * puissent pas se choisir la même station, la même console, le même jeu ou le
 * même accessoire.
 */

export type Range = { start: number; end: number };

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** Exécuteur SQL : `db` ou une transaction Drizzle. */
type SqlRunner = { execute: (query: SQL) => Promise<unknown> };

type HourRow = {
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};

type SpecificHourRow = HourRow & { isException: number | boolean };

export function toMinutes(hour: string, minute: string): number {
  return parseInt(hour, 10) * 60 + parseInt(minute, 10);
}

export function subtractRange(base: Range[], toRemove: Range): Range[] {
  const result: Range[] = [];
  for (const r of base) {
    if (toRemove.end <= r.start || toRemove.start >= r.end) {
      result.push(r);
      continue;
    }
    if (toRemove.start > r.start) result.push({ start: r.start, end: toRemove.start });
    if (toRemove.end < r.end) result.push({ start: toRemove.end, end: r.end });
  }
  return result;
}

export function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: Range[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else merged.push(cur);
  }
  return merged;
}

export function computeValidRanges(
  weeklyHours: HourRow[],
  specificHours: SpecificHourRow[],
): Range[] {
  let validRanges: Range[] = weeklyHours.map((r) => ({
    start: toMinutes(r.startHour, r.startMinute),
    end: toMinutes(r.endHour, r.endMinute),
  }));

  for (const r of specificHours) {
    const range = {
      start: toMinutes(r.startHour, r.startMinute),
      end: toMinutes(r.endHour, r.endMinute),
    };
    if (r.isException) validRanges = subtractRange(validRanges, range);
    else validRanges.push(range);
  }

  return mergeRanges(validRanges);
}

/** Créneaux de début possibles (« HH:00:00 ») pour des plages d'ouverture. */
export function generateAllTimeSlots(validRanges: Range[]): string[] {
  const slots: string[] = [];
  for (const range of validRanges) {
    const startHour = Math.ceil(range.start / 60);
    const endHour = Math.floor(range.end / 60);
    for (let hour = startHour; hour <= endHour - SESSION_DURATION_HOURS; hour++) {
      const slotStart = hour * 60;
      const slotEnd = slotStart + SESSION_DURATION_HOURS * 60;
      if (slotStart >= range.start && slotEnd <= range.end) {
        slots.push(`${hour.toString().padStart(2, "0")}:00:00`);
      }
    }
  }
  return [...new Set(slots)].sort();
}

export function dayNameFor(date: string): string {
  return DAY_NAMES[new Date(`${date}T12:00:00`).getDay()];
}

/** Créneaux ouverts pour une date (horaire hebdomadaire + exceptions). */
export async function openingSlotsFor(
  runner: SqlRunner,
  date: string,
): Promise<string[]> {
  const dayName = dayNameFor(date);

  const weeklyHours = executeRows<HourRow>(
    await runner.execute(sql`
      SELECT hr.start_hour AS startHour, hr.start_minute AS startMinute,
             hr.end_hour AS endHour, hr.end_minute AS endMinute
      FROM hour_ranges hr
      JOIN weekly_availabilities wa ON wa.weekly_id = hr.weekly_id
      WHERE wa.day_of_week = ${dayName}
        AND wa.enabled = 1
        AND (wa.always_available = 1
             OR (${date} >= wa.start_date AND ${date} <= wa.end_date))
    `),
  );

  const specificHours = executeRows<SpecificHourRow>(
    await runner.execute(sql`
      SELECT start_hour AS startHour, start_minute AS startMinute,
             end_hour AS endHour, end_minute AS endMinute,
             is_exception AS isException
      FROM specific_dates
      WHERE date = ${date}
    `),
  );

  return generateAllTimeSlots(computeValidRanges(weeklyHours, specificHours));
}

/**
 * Erreur de contention InnoDB : interblocage (1213) ou attente de verrou
 * dépassée (1205). Drizzle enveloppe l'erreur du pilote, d'où la remontée de
 * la chaîne de `cause`.
 */
export function isLockContentionError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    const { code, errno } = current as { code?: string; errno?: number };
    if (code === "ER_LOCK_DEADLOCK" || code === "ER_LOCK_WAIT_TIMEOUT") return true;
    if (errno === 1213 || errno === 1205) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Rejoue une transaction perdue sur un interblocage : la victime relit alors
 * des données validées et répond par une vraie erreur métier (« créneau déjà
 * pris ») au lieu d'une erreur technique.
 */
export async function runWithLockRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (!isLockContentionError(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

export type SlotCheckParams = {
  date: string;
  /** « HH:MM:SS ». */
  time: string;
  userId: number;
  /** Unité de console (console_stock.id) retenue par le hold. */
  consoleStockId: number;
  consoleTypeId: number;
  gameIds: number[];
  accessoryIds: number[];
  /** Hold en cours, exclu des conflits (il détient déjà sa station). */
  excludeHoldId?: string;
  /**
   * Station déjà attribuée à vérifier. Sans valeur, une station libre est
   * choisie et retournée.
   */
  requiredStationId?: number | null;
};

/**
 * Configuration de transaction attendue par checkSlotBookable : en READ
 * COMMITTED, chaque lecture voit les données validées les plus récentes.
 */
export const SLOT_TX_CONFIG = { isolationLevel: "read committed" } as const;

export type SlotCheckResult =
  | {
      ok: true;
      stationId: number;
      /**
       * Unité de console à utiliser. Peut différer de celle du hold : quand
       * l'unité retenue est déjà réservée sur ce créneau mais qu'une autre
       * unité de la même plateforme est libre, c'est cette dernière qui est
       * attribuée (plateforme en plusieurs exemplaires).
       */
      consoleStockId: number;
    }
  | { ok: false; status: number; message: string };

const SESSION_SECONDS = SESSION_DURATION_HOURS * 3600;

/**
 * Condition SQL « la session de `column` chevauche celle qui débute à `time` ».
 * Deux sessions de SESSION_DURATION_HOURS se chevauchent quand leurs débuts
 * sont séparés de moins d'une session : une réservation à 10 h bloque 11 h.
 */
function overlapsSql(column: SQL, time: string): SQL {
  return sql`ABS(TIME_TO_SEC(${column}) - TIME_TO_SEC(${time})) < ${SESSION_SECONDS}`;
}

/**
 * Vérifie qu'un créneau est réservable et verrouille les ressources en jeu.
 *
 * À appeler DANS une transaction ouverte avec SLOT_TX_CONFIG (READ COMMITTED) :
 * les verrous ne tiennent que jusqu'au commit, et c'est le niveau d'isolation
 * qui garantit que les lectures de conflit voient ce qu'une transaction
 * concurrente vient de valider. En REPEATABLE READ elles liraient l'instantané
 * du début de transaction et laisseraient passer un double enregistrement.
 *
 * Seules les ressources servant de point de sérialisation sont verrouillées
 * (usager, stations, console, jeux, accessoires), toujours dans cet ordre pour
 * éviter les interblocages. Les lignes appartenant aux autres usagers
 * (réservations, holds) sont lues sans verrou : les verrouiller provoquait un
 * interblocage avec update-hold, qui détient déjà le verrou de son propre hold.
 *
 * Tous les conflits sont évalués sur la durée complète de la session (voir
 * overlapsSql), pas seulement sur l'heure de début.
 */
export async function checkSlotBookable(
  tx: SqlRunner,
  params: SlotCheckParams,
): Promise<SlotCheckResult> {
  const {
    date,
    time,
    userId,
    consoleStockId,
    consoleTypeId,
    gameIds,
    accessoryIds,
    excludeHoldId,
    requiredStationId,
  } = params;

  // 1. Heures d'ouverture.
  const slots = await openingSlotsFor(tx, date);
  if (!slots.includes(time)) {
    return {
      ok: false,
      status: 409,
      message: "Ce créneau n'est pas offert à cette date.",
    };
  }

  // 2. Créneau encore à venir.
  if (!isFutureSlot(date, time)) {
    return { ok: false, status: 409, message: "Ce créneau est déjà passé." };
  }

  // 3. Verrou sur la ligne de l'usager : deux requêtes du même compte (double
  //    clic sur « Confirmer », deux onglets) sont sérialisées.
  await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);

  // 4. Une seule réservation par plateforme et par jour pour un même usager.
  const sameConsoleType = executeRows<{ id: string }>(
    await tx.execute(sql`
      SELECT id FROM reservation
      WHERE user_id = ${userId} AND date = ${date}
        AND console_type_id = ${consoleTypeId} AND archived = 0
      LIMIT 1
    `),
  );
  if (sameConsoleType.length > 0) {
    return {
      ok: false,
      status: 409,
      message: "Vous avez déjà une réservation avec cette plateforme cette journée-là.",
    };
  }

  // 5. Une seule réservation à la fois pour un même usager, toutes plateformes
  //    confondues : deux sessions qui se chevauchent sont refusées.
  const userOverlap = executeRows<{ id: string }>(
    await tx.execute(sql`
      SELECT id FROM reservation
      WHERE user_id = ${userId} AND date = ${date} AND archived = 0
        AND ${overlapsSql(sql`time`, time)}
      LIMIT 1
    `),
  );
  if (userOverlap.length > 0) {
    return {
      ok: false,
      status: 409,
      message: "Vous avez déjà une réservation qui chevauche ce créneau.",
    };
  }

  // 6. Stations : on verrouille d'abord TOUTES les stations candidates, dans
  //    l'ordre des identifiants. C'est le point de sérialisation entre deux
  //    usagers ; les conflits sont ensuite relus en lecture verrouillante, qui
  //    voit les données validées les plus récentes (une sous-requête ordinaire
  //    lirait l'instantané REPEATABLE READ du début de transaction et
  //    ignorerait la réservation que l'autre vient de valider).
  const stationFilter = requiredStationId ? sql`AND s.id = ${requiredStationId}` : sql``;
  const candidates = executeRows<{ id: number }>(
    await tx.execute(sql`
      SELECT s.id FROM stations s
      WHERE s.isActive = 1
        ${stationFilter}
        AND JSON_CONTAINS(s.consoles, JSON_ARRAY(${consoleTypeId}))
      ORDER BY s.id
      FOR UPDATE
    `),
  );

  if (candidates.length === 0) {
    return {
      ok: false,
      status: 409,
      message: "Aucune station ne prend en charge cette plateforme.",
    };
  }

  const holdFilter = excludeHoldId ? sql`AND id <> ${excludeHoldId}` : sql``;
  let stationId = 0;
  for (const candidate of candidates) {
    const id = Number(candidate.id);

    const bookedStation = executeRows<{ id: string }>(
      await tx.execute(sql`
        SELECT id FROM reservation
        WHERE station = ${id} AND date = ${date} AND archived = 0
          AND ${overlapsSql(sql`time`, time)}
        LIMIT 1
      `),
    );
    if (bookedStation.length > 0) continue;

    const heldStation = executeRows<{ id: string }>(
      await tx.execute(sql`
        SELECT id FROM reservation_hold
        WHERE station_id = ${id} AND date = ${date} AND time IS NOT NULL
          AND ${overlapsSql(sql`time`, time)}
          AND expireAt > NOW() ${holdFilter}
        LIMIT 1
      `),
    );
    if (heldStation.length > 0) continue;

    stationId = id;
    break;
  }

  if (!stationId) {
    return {
      ok: false,
      status: 409,
      message: requiredStationId
        ? "La station retenue vient d'être réservée par quelqu'un d'autre."
        : "Aucune station disponible pour la date et l'heure choisies.",
    };
  }

  // 7. Unité de console : verrou sur les unités actives de la plateforme
  //    (ordre des identifiants), puis relecture des réservations qui
  //    chevauchent le créneau. L'unité du hold est préférée ; si elle est
  //    prise (ou désactivée par la synchronisation Koha entre-temps), une
  //    autre unité libre de la même plateforme est attribuée, de préférence
  //    une unité qu'aucun autre parcours en cours ne retient.
  const units = executeRows<{ id: number; holding: number }>(
    await tx.execute(sql`
      SELECT id, holding FROM console_stock
      WHERE console_type_id = ${consoleTypeId} AND is_active = 1
      ORDER BY id
      FOR UPDATE
    `),
  );
  if (units.length === 0) {
    return {
      ok: false,
      status: 409,
      message: "Aucune unité de cette plateforme n'est disponible.",
    };
  }

  const takenUnits = executeRows<{ consoleId: number }>(
    await tx.execute(sql`
      SELECT DISTINCT console_id AS consoleId FROM reservation
      WHERE console_type_id = ${consoleTypeId} AND date = ${date} AND archived = 0
        AND ${overlapsSql(sql`time`, time)}
    `),
  );
  const taken = new Set(takenUnits.map((r) => Number(r.consoleId)));
  const rank = (u: { id: number; holding: number }) =>
    Number(u.id) === consoleStockId ? 0 : Number(u.holding) === 0 ? 1 : 2;
  const freeUnit = [...units]
    .sort((a, b) => rank(a) - rank(b) || Number(a.id) - Number(b.id))
    .map((u) => Number(u.id))
    .find((id) => !taken.has(id));
  if (freeUnit === undefined) {
    return {
      ok: false,
      status: 409,
      message: "Cette plateforme est déjà réservée pour ce créneau.",
    };
  }

  // 8. Jeux : verrou sur les lignes de jeux (ordre croissant), puis relecture.
  if (gameIds.length > 0) {
    const ids = sql.join(
      [...gameIds].sort((a, b) => a - b).map((id) => sql`${id}`),
      sql`, `,
    );
    await tx.execute(sql`SELECT id FROM games WHERE id IN (${ids}) FOR UPDATE`);
    const takenGames = executeRows<{ gameId: number }>(
      await tx.execute(sql`
        SELECT r.game1_id AS gameId FROM reservation r
        WHERE r.date = ${date} AND r.archived = 0
          AND ${overlapsSql(sql`r.time`, time)}
          AND (r.game1_id IN (${ids}) OR r.game2_id IN (${ids}) OR r.game3_id IN (${ids}))
        LIMIT 1
      `),
    );
    if (takenGames.length > 0) {
      return {
        ok: false,
        status: 409,
        message: "Un des jeux choisis vient d'être réservé pour ce créneau.",
      };
    }
  }

  // 9. Accessoires : même principe, verrou sur les lignes d'accessoires.
  if (accessoryIds.length > 0) {
    const ids = sql.join(
      [...accessoryIds].sort((a, b) => a - b).map((id) => sql`${id}`),
      sql`, `,
    );
    await tx.execute(sql`SELECT id FROM accessoires WHERE id IN (${ids}) FOR UPDATE`);
    const takenAcc = executeRows<{ id: string }>(
      await tx.execute(sql`
        SELECT id FROM reservation
        WHERE date = ${date} AND archived = 0
          AND ${overlapsSql(sql`time`, time)}
          AND accessory_ids IS NOT NULL
          AND JSON_OVERLAPS(accessory_ids, CAST(${JSON.stringify(accessoryIds)} AS JSON))
        LIMIT 1
      `),
    );
    if (takenAcc.length > 0) {
      return {
        ok: false,
        status: 409,
        message: "Un accessoire choisi vient d'être réservé pour ce créneau.",
      };
    }
  }

  return { ok: true, stationId, consoleStockId: freeUnit };
}
