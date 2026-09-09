import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import db from "@/db";
import {
  reservation,
  reservationHold,
  consoleStock,
  games,
  accessoires,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { checkSlotBookable, isLockContentionError, runWithLockRetry, SLOT_TX_CONFIG } from "@/lib/availability";
import crypto from "crypto";
import { createLogger } from "@/lib/logger";

type Body = {
  reservationHoldId: string;
  consoleId: number;
  consoleTypeId: number;
  game1Id: number;
  game2Id?: number | null;
  game3Id?: number | null;
  accessoryIds?: number[] | null;
  coursId: number;
  date: string;
  time: string;
};

class TxReturn extends Error {
  constructor(public readonly resp: NextResponse) {
    super("tx_return");
  }
}

export async function POST(req: Request) {
  const log = createLogger("RESERVATION:confirm");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("SESSION");
  let user = null;
  try {
    const token = sessionCookie?.value;
    if (token) user = verifyToken(token);
  } catch {
    log.warn("auth.rejected", { reason: "invalid_token" });
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 },
    );
  }
  if (!user?.id) {
    log.warn("auth.rejected", { reason: "no_session" });
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  log.bind({ userId: Number(user.id) });

  let body: Partial<Body> = {};
  try {
    body = await req.json();
  } catch {
    log.warn("request.rejected", { reason: "invalid_json" });
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  log.bind({ holdId: body.reservationHoldId });
  log.info("request.received", {
    consoleTypeId: body.consoleTypeId,
    consoleId: body.consoleId,
    games: [body.game1Id, body.game2Id, body.game3Id].filter((id) => id != null),
    accessories: Array.isArray(body.accessoryIds) ? body.accessoryIds : [],
    coursId: body.coursId,
    date: body.date,
    time: body.time,
  });

  const missing: string[] = [];
  if (!body.reservationHoldId) missing.push("reservationHoldId");
  if (!body.consoleId) missing.push("consoleId");
  if (!body.consoleTypeId) missing.push("consoleTypeId");
  if (!body.game1Id) missing.push("game1Id");
  if (!body.coursId) missing.push("coursId");
  if (!body.date) missing.push("date");
  if (!body.time) missing.push("time");
  if (missing.length) {
    log.warn("validation.failed", { reason: "missing_fields", fields: missing });
    return NextResponse.json(
      {
        success: false,
        message: `Champs obligatoire manquant: ${missing.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const reservationHoldId = String(body.reservationHoldId).trim();
  const consoleId = Number(body.consoleId);
  const consoleTypeId = Number(body.consoleTypeId);
  const game1Id = Number(body.game1Id);
  const coursId = Number(body.coursId);
  if (
    ![consoleId, consoleTypeId, game1Id, coursId].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  ) {
    log.warn("validation.failed", { reason: "non_positive_ids" });
    return NextResponse.json(
      { success: false, message: "IDs must be positive numbers" },
      { status: 400 },
    );
  }

  const game2Id = body.game2Id != null ? Number(body.game2Id) : null;
  const game3Id = body.game3Id != null ? Number(body.game3Id) : null;
  if (game2Id != null && (!Number.isFinite(game2Id) || game2Id <= 0)) {
    log.warn("validation.failed", { reason: "invalid_game2_id" });
    return NextResponse.json(
      { success: false, message: "game2Id must be a positive number" },
      { status: 400 },
    );
  }
  if (game3Id != null && (!Number.isFinite(game3Id) || game3Id <= 0)) {
    log.warn("validation.failed", { reason: "invalid_game3_id" });
    return NextResponse.json(
      { success: false, message: "game3Id must be a positive number" },
      { status: 400 },
    );
  }

  const accessoryIds: number[] = Array.isArray(body.accessoryIds)
    ? body.accessoryIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const dateStr = String(body.date).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    log.warn("validation.failed", { reason: "invalid_date_format", date: dateStr });
    return NextResponse.json(
      { success: false, message: "Invalid date format. Expected YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const timeStr = String(body.time).trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    log.warn("validation.failed", { reason: "invalid_time_format", time: timeStr });
    return NextResponse.json(
      {
        success: false,
        message: "Invalid time format. Expected HH:MM or HH:MM:SS",
      },
      { status: 400 },
    );
  }

  const [H, M] = timeStr.split(":").map(Number);
  if (H < 0 || H > 23 || M < 0 || M > 59) {
    log.warn("validation.failed", { reason: "invalid_time_value", time: timeStr });
    return NextResponse.json(
      { success: false, message: "Invalid time value" },
      { status: 400 },
    );
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateStr < todayStr) {
    log.warn("validation.failed", { reason: "past_date", date: dateStr });
    return NextResponse.json(
      { success: false, message: "Date cannot be in the past" },
      { status: 400 },
    );
  }

  try {
    const response = await runWithLockRetry(() => db.transaction(async (tx) => {
      const hold = await tx.query.reservationHold.findFirst({
        where: and(
          eq(reservationHold.id, reservationHoldId),
          eq(reservationHold.userId, Number(user!.id)),
          sql`${reservationHold.expireAt} > NOW()`,
        ),
      });
      if (!hold) {
        log.warn("hold.not_found", { reason: "expired_or_foreign" });
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Reservation hold not found, expired or not yours",
            },
            { status: 404 },
          ),
        );
      }

      // L'unité de console fait foi côté serveur : le hold a pu basculer sur
      // une autre unité de la même plateforme à l'étape du créneau (voir
      // checkSlotBookable), et le client peut encore porter l'ancienne.
      const heldConsoleId = hold.consoleId;
      if (hold.consoleTypeId !== consoleTypeId) {
        log.warn("hold.mismatch", {
          field: "consoleTypeId",
          held: hold.consoleTypeId,
          received: consoleTypeId,
        });
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Console Type ID does not match the hold",
            },
            { status: 400 },
          ),
        );
      }
      if (
        hold.game1Id !== game1Id ||
        (hold.game2Id || null) !== (game2Id || null) ||
        (hold.game3Id || null) !== (game3Id || null)
      ) {
        log.warn("hold.mismatch", {
          field: "games",
          held: [hold.game1Id, hold.game2Id, hold.game3Id].filter((id) => id != null),
          received: [game1Id, game2Id, game3Id].filter((id) => id != null),
        });
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Game IDs do not match the hold" },
            { status: 400 },
          ),
        );
      }

      const consoleRow = await tx.query.consoleStock.findFirst({
        columns: { id: true },
        where: and(
          eq(consoleStock.id, heldConsoleId),
          eq(consoleStock.consoleTypeId, consoleTypeId),
          eq(consoleStock.isActive, 1),
        ),
      });
      if (!consoleRow) {
        log.warn("console.unavailable", {
          consoleStockId: heldConsoleId,
          consoleTypeId,
        });
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Console is not available or does not match the type",
            },
            { status: 400 },
          ),
        );
      }

      if (accessoryIds.length > 0) {
        const holdAccessories = Array.isArray(hold.accessoirs)
          ? (hold.accessoirs as number[])
              .map(Number)
              .filter((n) => Number.isFinite(n) && n > 0)
          : [];
        const a = [...holdAccessories].sort((x, y) => x - y);
        const b = [...accessoryIds].sort((x, y) => x - y);
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          log.warn("hold.mismatch", {
            field: "accessories",
            held: a,
            received: b,
          });
          throw new TxReturn(
            NextResponse.json(
              {
                success: false,
                message: "Accessory IDs do not match the hold",
              },
              { status: 400 },
            ),
          );
        }

        const accRows = await tx
          .select({ id: accessoires.id })
          .from(accessoires)
          .where(inArray(accessoires.id, accessoryIds));
        if (accRows.length !== accessoryIds.length) {
          log.warn("accessories.unknown", { requested: accessoryIds });
          throw new TxReturn(
            NextResponse.json(
              {
                success: false,
                message: "One or more selected accessories do not exist",
              },
              { status: 400 },
            ),
          );
        }
      }

      const holdDateStr = String(hold.date).slice(0, 10);
      if (holdDateStr !== dateStr) {
        log.warn("hold.mismatch", { field: "date", held: holdDateStr, received: dateStr });
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Date does not match the hold" },
            { status: 400 },
          ),
        );
      }
      if (hold.time !== timeStr) {
        log.warn("hold.mismatch", { field: "time", held: hold.time, received: timeStr });
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Time does not match the hold" },
            { status: 400 },
          ),
        );
      }

      const stillValid = await tx.query.reservationHold.findFirst({
        columns: { id: true },
        where: and(
          eq(reservationHold.id, reservationHoldId),
          sql`${reservationHold.expireAt} > NOW()`,
        ),
      });
      if (!stillValid) {
        log.warn("hold.expired", { ms: log.elapsedMs() });
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Reservation hold has expired" },
            { status: 400 },
          ),
        );
      }

      // Dernière barrière avant l'écriture ferme : heures d'ouverture, créneau
      // encore à venir, et station/console/jeux/accessoires toujours libres.
      // Les lectures sont verrouillantes : deux confirmations simultanées sur
      // les mêmes ressources sont sérialisées, la seconde est refusée.
      const slot = await checkSlotBookable(tx, {
        date: dateStr,
        time: timeStr,
        userId: Number(user!.id),
        consoleStockId: heldConsoleId,
        consoleTypeId,
        gameIds: [game1Id, game2Id, game3Id].filter(
          (id): id is number => typeof id === "number",
        ),
        accessoryIds,
        excludeHoldId: reservationHoldId,
        requiredStationId: hold.stationId ?? null,
      });

      if (!slot.ok) {
        // Dernier refus possible du parcours : le créneau a fermé ou une
        // ressource est partie entre la sélection et la confirmation.
        log.warn("slot.rejected", {
          date: dateStr,
          time: timeStr,
          status: slot.status,
          reason: slot.message,
        });
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: slot.message },
            { status: slot.status },
          ),
        );
      }

      const reservationId = `RESV-${crypto.randomUUID()}`;
      await tx.insert(reservation).values({
        id: reservationId,
        userId: Number(user!.id),
        consoleId: slot.consoleStockId,
        consoleTypeId,
        game1Id,
        game2Id: game2Id ?? null,
        game3Id: game3Id ?? null,
        accessoryIds: accessoryIds.length ? accessoryIds : null,
        coursId,
        station: slot.stationId,
        date: dateStr,
        time: timeStr,
      });

      await tx
        .delete(reservationHold)
        .where(eq(reservationHold.id, reservationHoldId));
      await tx
        .update(consoleStock)
        .set({ holding: 0 })
        .where(eq(consoleStock.id, heldConsoleId));

      const gameIdsToRelease = [game1Id, game2Id, game3Id].filter(
        (x): x is number => Number.isFinite(x as number) && (x as number) > 0,
      );
      if (gameIdsToRelease.length) {
        await tx
          .update(games)
          .set({ holding: 0 })
          .where(inArray(games.id, gameIdsToRelease));
      }

      log.info("reservation.confirmed", {
        reservationId,
        consoleStockId: slot.consoleStockId,
        consoleTypeId,
        stationId: slot.stationId,
        games: [game1Id, game2Id, game3Id].filter((id) => id != null),
        accessories: accessoryIds,
        coursId,
        date: dateStr,
        time: timeStr,
        ms: log.elapsedMs(),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Reservation confirmed",
          data: {
            reservationId,
            consoleId: slot.consoleStockId,
            consoleTypeId,
            game1Id,
            game2Id,
            game3Id,
            accessoryIds: accessoryIds.length ? accessoryIds : null,
            coursId,
            date: dateStr,
            time: timeStr,
          },
        },
        { status: 200 },
      );
    }, SLOT_TX_CONFIG));

    return response;
  } catch (error) {
    if (error instanceof TxReturn) return error.resp;
    if (isLockContentionError(error)) {
      log.warn("lock.contention", { date: dateStr, time: timeStr, ms: log.elapsedMs() });
      return NextResponse.json(
        { success: false, message: "Ce créneau vient d'être réservé par quelqu'un d'autre. Veuillez en choisir un autre." },
        { status: 409 },
      );
    }
    log.error("request.failed", error, { ms: log.elapsedMs() });
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
