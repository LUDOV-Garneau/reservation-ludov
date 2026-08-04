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
import crypto from "crypto";

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
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("SESSION");
  let user = null;
  try {
    const token = sessionCookie?.value;
    if (token) user = verifyToken(token);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 },
    );
  }
  if (!user?.id)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );

  let body: Partial<Body> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  console.log("📥 Received reservation confirmation data:", body);

  const missing: string[] = [];
  if (!body.reservationHoldId) missing.push("reservationHoldId");
  if (!body.consoleId) missing.push("consoleId");
  if (!body.consoleTypeId) missing.push("consoleTypeId");
  if (!body.game1Id) missing.push("game1Id");
  if (!body.coursId) missing.push("coursId");
  if (!body.date) missing.push("date");
  if (!body.time) missing.push("time");
  if (missing.length)
    return NextResponse.json(
      {
        success: false,
        message: `Champs obligatoire manquant: ${missing.join(", ")}`,
      },
      { status: 400 },
    );

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
    return NextResponse.json(
      { success: false, message: "IDs must be positive numbers" },
      { status: 400 },
    );
  }

  const game2Id = body.game2Id != null ? Number(body.game2Id) : null;
  const game3Id = body.game3Id != null ? Number(body.game3Id) : null;
  if (game2Id != null && (!Number.isFinite(game2Id) || game2Id <= 0))
    return NextResponse.json(
      { success: false, message: "game2Id must be a positive number" },
      { status: 400 },
    );
  if (game3Id != null && (!Number.isFinite(game3Id) || game3Id <= 0))
    return NextResponse.json(
      { success: false, message: "game3Id must be a positive number" },
      { status: 400 },
    );

  const accessoryIds: number[] = Array.isArray(body.accessoryIds)
    ? body.accessoryIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];

  const dateStr = String(body.date).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
    return NextResponse.json(
      { success: false, message: "Invalid date format. Expected YYYY-MM-DD" },
      { status: 400 },
    );

  const timeStr = String(body.time).trim();
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr))
    return NextResponse.json(
      {
        success: false,
        message: "Invalid time format. Expected HH:MM or HH:MM:SS",
      },
      { status: 400 },
    );

  const [H, M] = timeStr.split(":").map(Number);
  if (H < 0 || H > 23 || M < 0 || M > 59)
    return NextResponse.json(
      { success: false, message: "Invalid time value" },
      { status: 400 },
    );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateStr < todayStr)
    return NextResponse.json(
      { success: false, message: "Date cannot be in the past" },
      { status: 400 },
    );

  try {
    const response = await db.transaction(async (tx) => {
      const hold = await tx.query.reservationHold.findFirst({
        where: and(
          eq(reservationHold.id, reservationHoldId),
          eq(reservationHold.userId, Number(user!.id)),
          sql`${reservationHold.expireAt} > NOW()`,
        ),
      });
      if (!hold)
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Reservation hold not found, expired or not yours",
            },
            { status: 404 },
          ),
        );

      if (hold.consoleId !== consoleId)
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Console ID does not match the hold" },
            { status: 400 },
          ),
        );
      if (hold.consoleTypeId !== consoleTypeId)
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Console Type ID does not match the hold",
            },
            { status: 400 },
          ),
        );
      if (
        hold.game1Id !== game1Id ||
        (hold.game2Id || null) !== (game2Id || null) ||
        (hold.game3Id || null) !== (game3Id || null)
      )
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Game IDs do not match the hold" },
            { status: 400 },
          ),
        );

      const consoleRow = await tx.query.consoleStock.findFirst({
        columns: { id: true },
        where: and(
          eq(consoleStock.id, consoleId),
          eq(consoleStock.consoleTypeId, consoleTypeId),
          eq(consoleStock.isActive, 1),
        ),
      });
      if (!consoleRow)
        throw new TxReturn(
          NextResponse.json(
            {
              success: false,
              message: "Console is not available or does not match the type",
            },
            { status: 400 },
          ),
        );

      if (accessoryIds.length > 0) {
        const holdAccessories = Array.isArray(hold.accessoirs)
          ? (hold.accessoirs as number[])
              .map(Number)
              .filter((n) => Number.isFinite(n) && n > 0)
          : [];
        const a = [...holdAccessories].sort((x, y) => x - y);
        const b = [...accessoryIds].sort((x, y) => x - y);
        if (JSON.stringify(a) !== JSON.stringify(b))
          throw new TxReturn(
            NextResponse.json(
              {
                success: false,
                message: "Accessory IDs do not match the hold",
              },
              { status: 400 },
            ),
          );

        const accRows = await tx
          .select({ id: accessoires.id })
          .from(accessoires)
          .where(inArray(accessoires.id, accessoryIds));
        if (accRows.length !== accessoryIds.length)
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

      const holdDateStr = String(hold.date).slice(0, 10);
      if (holdDateStr !== dateStr)
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Date does not match the hold" },
            { status: 400 },
          ),
        );
      if (hold.time !== timeStr)
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Time does not match the hold" },
            { status: 400 },
          ),
        );

      const stillValid = await tx.query.reservationHold.findFirst({
        columns: { id: true },
        where: and(
          eq(reservationHold.id, reservationHoldId),
          sql`${reservationHold.expireAt} > NOW()`,
        ),
      });
      if (!stillValid)
        throw new TxReturn(
          NextResponse.json(
            { success: false, message: "Reservation hold has expired" },
            { status: 400 },
          ),
        );

      const reservationId = `RESV-${crypto.randomUUID()}`;
      await tx.insert(reservation).values({
        id: reservationId,
        userId: Number(user!.id),
        consoleId,
        consoleTypeId,
        game1Id,
        game2Id: game2Id ?? null,
        game3Id: game3Id ?? null,
        accessoryIds: accessoryIds.length ? accessoryIds : null,
        coursId,
        station: hold.stationId ?? null,
        date: dateStr,
        time: timeStr,
      });

      await tx
        .delete(reservationHold)
        .where(eq(reservationHold.id, reservationHoldId));
      await tx
        .update(consoleStock)
        .set({ holding: 0 })
        .where(eq(consoleStock.id, consoleId));

      const gameIdsToRelease = [game1Id, game2Id, game3Id].filter(
        (x): x is number => Number.isFinite(x as number) && (x as number) > 0,
      );
      if (gameIdsToRelease.length) {
        await tx
          .update(games)
          .set({ holding: 0 })
          .where(inArray(games.id, gameIdsToRelease));
      }

      return NextResponse.json(
        {
          success: true,
          message: "Reservation confirmed",
          data: {
            reservationId,
            consoleId,
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
    });

    return response;
  } catch (error) {
    if (error instanceof TxReturn) return error.resp;
    console.error("Error confirming reservation:", error);
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
