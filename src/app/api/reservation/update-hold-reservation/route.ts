import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservationHold, consoleStock, games } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type Body = {
  reservationId: string;
  game1Id?: number | null;
  game2Id?: number | null;
  game3Id?: number | null;
  newConsoleId?: number;
  accessories?: number[] | null;
  coursId?: number | null;
  date?: string | null;
  time?: string | null;
};

interface HoldRow {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  station_id: number | null;
  accessoirs: unknown;
  cours: number | null;
  date: string | null;
  time: string | null;
  expireAt: string;
  expiresIn: number;
}

class TxReturn extends Error {
  constructor(public readonly resp: NextResponse) { super("tx_return"); }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!user?.id || !Number.isFinite(Number(user.id))) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const userId = Number(user.id);

    let body: Partial<Body> = {};
    try { body = await req.json(); } catch {
      return NextResponse.json({ success: false, message: "Body JSON invalide" }, { status: 400 });
    }

    const reservationId = String(body.reservationId || "");
    if (!reservationId) return NextResponse.json({ success: false, message: "reservationId manquant" }, { status: 400 });

    const game1Id = body.game1Id === undefined ? undefined : body.game1Id === null ? null : Number(body.game1Id);
    const game2Id = body.game2Id === undefined ? undefined : body.game2Id === null ? null : Number(body.game2Id);
    const game3Id = body.game3Id === undefined ? undefined : body.game3Id === null ? null : Number(body.game3Id);
    const newConsoleTypeId = body.newConsoleId === undefined ? undefined : Number(body.newConsoleId);
    const accessories = body.accessories;
    const coursId = body.coursId === undefined ? undefined : body.coursId === null ? null : Number(body.coursId);
    const date = body.date === undefined ? undefined : body.date ?? null;
    const time = body.time === undefined ? undefined : body.time ?? null;

    try {
      const response = await db.transaction(async (tx) => {
        const rows = await tx.execute<HoldRow>(
          sql`SELECT r.*, GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), r.expireAt)) AS expiresIn FROM reservation_hold r WHERE r.id = ${reservationId} AND r.user_id = ${userId} AND r.expireAt > NOW() FOR UPDATE`
        ) as HoldRow[];

        if (!rows || rows.length === 0) throw new TxReturn(NextResponse.json({ success: false, message: "Réservation expirée", status: "expired" }, { status: 410 }));

        const hold = rows[0];
        const currentConsoleId = hold.console_id;
        const currentConsoleTypeId = hold.console_type_id;
        const setData: Record<string, unknown> = {};

        if (accessories !== undefined) {
          if (accessories === null || (Array.isArray(accessories) && accessories.length === 0)) {
            setData.accessoirs = null;
          } else if (Array.isArray(accessories)) {
            setData.accessoirs = accessories;
          } else {
            throw new TxReturn(NextResponse.json({ success: false, message: "accessories doit être un tableau ou null" }, { status: 400 }));
          }
        }

        if (coursId !== undefined) setData.cours = coursId;
        if (date !== undefined) setData.date = date;

        if (time !== undefined) {
          const stationRows = await tx.execute<{ station_id: number }>(
            sql`SELECT s.id AS station_id FROM stations s WHERE s.isActive = 1 AND JSON_CONTAINS(s.consoles, JSON_ARRAY(${currentConsoleTypeId})) AND s.id NOT IN (SELECT station FROM reservation WHERE date = ${date} AND time = ${time} AND archived = 0) AND s.id NOT IN (SELECT station_id FROM reservation_hold WHERE date = ${date} AND time = ${time} AND expireAt > NOW() AND id != ${reservationId})`
          ) as { station_id: number }[];

          if (!stationRows || stationRows.length === 0) {
            throw new TxReturn(NextResponse.json({ success: false, message: "Aucune station disponible pour la date et l'heure choisies" }, { status: 409 }));
          }
          setData.stationId = stationRows[0].station_id;
          setData.time = time;
        }

        let consoleChanged = false;
        if (newConsoleTypeId !== undefined && newConsoleTypeId !== currentConsoleTypeId) {
          const toFree = [hold.game1_id, hold.game2_id, hold.game3_id].filter((x): x is number => x !== null);
          if (toFree.length > 0) {
            await tx.execute(sql`SELECT id FROM games WHERE id IN (${sql.join(toFree.map((id) => sql`${id}`), sql`, `)}) FOR UPDATE`);
            await tx.update(games).set({ holding: 0 }).where(inArray(games.id, toFree));
          }

          const unitRows = await tx
            .select({ consoleStockId: consoleStock.id })
            .from(consoleStock)
            .where(and(eq(consoleStock.consoleTypeId, newConsoleTypeId), eq(consoleStock.isActive, 1), eq(consoleStock.holding, 0)))
            .limit(1);

          if (!unitRows || unitRows.length === 0) throw new TxReturn(NextResponse.json({ success: false, message: "Nouvelle console indisponible" }, { status: 400 }));
          const stockId = Number(unitRows[0].consoleStockId);

          await tx.update(consoleStock).set({ holding: 0 }).where(eq(consoleStock.id, currentConsoleId));
          await tx.update(consoleStock).set({ holding: 1 }).where(eq(consoleStock.id, stockId));

          Object.assign(setData, { consoleId: stockId, consoleTypeId: newConsoleTypeId, game1Id: null, game2Id: null, game3Id: null, accessoirs: null, cours: null, date: null, time: null });
          consoleChanged = true;
        }

        if (!consoleChanged) {
          const desiredGame1 = game1Id === undefined ? hold.game1_id : game1Id;
          const desiredGame2 = game2Id === undefined ? hold.game2_id : game2Id;
          const desiredGame3 = game3Id === undefined ? hold.game3_id : game3Id;

          const desiredList = [desiredGame1, desiredGame2, desiredGame3].filter((x): x is number => x !== null);
          if (new Set(desiredList).size !== desiredList.length) throw new TxReturn(NextResponse.json({ success: false, message: "Le même jeu ne peut pas être choisi deux fois." }, { status: 400 }));

          const currentSet = new Set<number>([hold.game1_id, hold.game2_id, hold.game3_id].filter((x): x is number => x !== null));
          const finalSet = new Set<number>(desiredList);
          const toAdd = [...finalSet].filter((id) => !currentSet.has(id));
          const toRemove = [...currentSet].filter((id) => !finalSet.has(id));
          const lockIds = [...new Set([...toAdd, ...toRemove])];

          if (lockIds.length > 0) {
            await tx.execute(sql`SELECT id FROM games WHERE id IN (${sql.join(lockIds.map((id) => sql`${id}`), sql`, `)}) FOR UPDATE`);
          }

          if (toAdd.length > 0) {
            const available = await tx.select({ id: games.id }).from(games).where(and(inArray(games.id, toAdd), eq(games.holding, 0)));
            const okIds = new Set(available.map((r) => Number(r.id)));
            const blocked = toAdd.filter((id) => !okIds.has(id));
            if (blocked.length > 0) throw new TxReturn(NextResponse.json({ success: false, message: `Jeu(x) indisponible(s): ${blocked.join(", ")}` }, { status: 400 }));
          }

          if (toRemove.length > 0) await tx.update(games).set({ holding: 0 }).where(inArray(games.id, toRemove));
          if (toAdd.length > 0) await tx.update(games).set({ holding: 1 }).where(inArray(games.id, toAdd));

          if (game1Id !== undefined) setData.game1Id = desiredGame1;
          if (game2Id !== undefined) setData.game2Id = desiredGame2;
          if (game3Id !== undefined) setData.game3Id = desiredGame3;
        }

        if (Object.keys(setData).length > 0) {
          await tx.update(reservationHold).set(setData).where(and(eq(reservationHold.id, reservationId), eq(reservationHold.userId, userId)));
        }

        const updatedRows = await tx.execute<HoldRow>(
          sql`SELECT id, user_id, console_id, console_type_id, game1_id, game2_id, game3_id, accessoirs, cours, date, time, expireAt, GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expireAt)) AS expiresIn FROM reservation_hold WHERE id = ${reservationId} AND user_id = ${userId}`
        ) as HoldRow[];

        if (!updatedRows || updatedRows.length === 0) throw new TxReturn(NextResponse.json({ success: false, message: "Réservation introuvable après mise à jour" }, { status: 500 }));

        const updated = updatedRows[0];
        let accessoriesArray: number[] = [];
        if (updated.accessoirs) {
          try {
            accessoriesArray = Array.isArray(updated.accessoirs) ? (updated.accessoirs as number[]) : JSON.parse(updated.accessoirs as string);
          } catch {
            throw new TxReturn(NextResponse.json({ success: false, message: "Erreur lors de la récupération des accessoires" }, { status: 500 }));
          }
        }

        return NextResponse.json({
          success: true,
          reservationId,
          consoleId: Number(updated.console_id),
          consoleTypeId: Number(updated.console_type_id),
          games: [updated.game1_id, updated.game2_id, updated.game3_id].filter((id): id is number => id !== null),
          accessories: accessoriesArray,
          coursId: updated.cours ?? null,
          date: updated.date,
          time: updated.time,
          expiresAt: new Date(updated.expireAt).toISOString(),
          expiresIn: Number(updated.expiresIn),
        });
      });

      return response;
    } catch (e) {
      if (e instanceof TxReturn) return e.resp;
      throw e;
    }
  } catch (err) {
    console.error("update-hold-reservation error:", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erreur lors de la mise à jour du hold" }, { status: 500 });
  }
}
