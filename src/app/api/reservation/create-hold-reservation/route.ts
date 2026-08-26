import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db, { executeRows } from "@/db";
import { reservationHold, consoleStock, games } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import crypto from "crypto";

type Body = { consoleTypeId: number; minutes?: number };

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
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    let body: Partial<Body> = {};
    try { body = await req.json(); } catch {
      return NextResponse.json({ success: false, message: "Body JSON invalide" }, { status: 400 });
    }

    const userId = Number(user.id);
    if (!Number.isFinite(userId)) return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });

    const consoleTypeId = Number(body.consoleTypeId);
    const minutes = Math.max(1, Number(body.minutes ?? 15));
    if (!Number.isFinite(consoleTypeId) || consoleTypeId <= 0) {
      return NextResponse.json({ success: false, message: "consoleTypeId requis" }, { status: 400 });
    }

    try {
      const response = await db.transaction(async (tx) => {
        // Un hold expiré doit d'abord relâcher sa console et ses jeux : les
        // supprimer sans remettre holding = 0 rendrait l'unité et les jeux
        // définitivement indisponibles.
        await tx.execute(
          sql`UPDATE console_stock cs JOIN reservation_hold h ON h.console_id = cs.id SET cs.holding = 0 WHERE h.expireAt <= NOW()`
        );
        await tx.execute(
          sql`UPDATE games g JOIN reservation_hold h ON g.id IN (h.game1_id, h.game2_id, h.game3_id) SET g.holding = 0 WHERE h.expireAt <= NOW()`
        );
        await tx.delete(reservationHold).where(sql`${reservationHold.expireAt} <= NOW()`);

        const existing = await tx.select({
          holdId: reservationHold.id,
          consoleStockId: reservationHold.consoleId,
          consoleTypeId: reservationHold.consoleTypeId,
          game1Id: reservationHold.game1Id,
          game2Id: reservationHold.game2Id,
          game3Id: reservationHold.game3Id,
          expiresAt: reservationHold.expireAt,
          expiresIn: sql<number>`GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), ${reservationHold.expireAt}))`,
        }).from(reservationHold)
          .where(and(eq(reservationHold.userId, userId), sql`${reservationHold.expireAt} > NOW()`))
          .limit(1);

        if (existing.length > 0) {
          const hold = existing[0];

          if (Number(hold.consoleTypeId) === consoleTypeId) {
            return NextResponse.json({
              success: true,
              reservationId: hold.holdId,
              holdId: hold.holdId,
              consoleStockId: hold.consoleStockId,
              expiresAt: new Date(hold.expiresAt).toISOString(),
              expiresIn: Number(hold.expiresIn),
              message: "Hold existant récupéré",
            }, { status: 200 });
          }

          // Le hold porte une autre plateforme (retour à l'étape 1, ou parcours
          // repris après avoir quitté la page) : on le bascule sur la
          // plateforme demandée au lieu de renvoyer l'ancienne, sinon le client
          // et le hold divergent jusqu'à l'échec de la confirmation.
          const heldGames = [hold.game1Id, hold.game2Id, hold.game3Id].filter(
            (id): id is number => id !== null
          );
          if (heldGames.length > 0) {
            await tx.update(games).set({ holding: 0 }).where(inArray(games.id, heldGames));
          }

          // FOR UPDATE n'est pas supporté par Drizzle MySQL, raw SQL requis ici
          const switchUnits = executeRows<{ consoleStockId: number }>(
            await tx.execute(
              sql`SELECT cs.id AS consoleStockId FROM console_stock cs WHERE cs.console_type_id = ${consoleTypeId} AND cs.is_active = 1 AND cs.holding = 0 AND NOT EXISTS (SELECT 1 FROM reservation_hold h WHERE h.console_id = cs.id AND h.expireAt > NOW()) LIMIT 1 FOR UPDATE`
            )
          );

          if (switchUnits.length === 0) {
            throw new TxReturn(NextResponse.json({ success: false, message: "Aucune unité disponible pour ce type." }, { status: 409 }));
          }

          const switchedStockId = Number(switchUnits[0].consoleStockId);

          await tx.update(consoleStock).set({ holding: 0 }).where(eq(consoleStock.id, hold.consoleStockId));
          await tx.update(consoleStock).set({ holding: 1 }).where(eq(consoleStock.id, switchedStockId));

          await tx.update(reservationHold).set({
            consoleId: switchedStockId,
            consoleTypeId,
            game1Id: null,
            game2Id: null,
            game3Id: null,
            accessoirs: null,
            cours: null,
            date: null,
            time: null,
            stationId: null,
          }).where(eq(reservationHold.id, hold.holdId));

          return NextResponse.json({
            success: true,
            reservationId: hold.holdId,
            holdId: hold.holdId,
            consoleStockId: switchedStockId,
            expiresAt: new Date(hold.expiresAt).toISOString(),
            expiresIn: Number(hold.expiresIn),
            message: "Hold existant basculé sur la plateforme demandée",
          }, { status: 200 });
        }

        // FOR UPDATE n'est pas supporté par Drizzle MySQL, raw SQL requis ici
        const units = executeRows<{ consoleStockId: number }>(
          await tx.execute(
            sql`SELECT cs.id AS consoleStockId FROM console_stock cs WHERE cs.console_type_id = ${consoleTypeId} AND cs.is_active = 1 AND cs.holding = 0 AND NOT EXISTS (SELECT 1 FROM reservation_hold h WHERE h.console_id = cs.id AND h.expireAt > NOW()) LIMIT 1 FOR UPDATE`
          )
        );

        if (units.length === 0) {
          throw new TxReturn(NextResponse.json({ success: false, message: "Aucune unité disponible pour ce type." }, { status: 409 }));
        }

        const consoleStockId = Number(units[0].consoleStockId);
        const reservationId = `HOLD-${crypto.randomUUID()}`;

        await tx.insert(reservationHold).values({
          id: reservationId,
          userId,
          consoleId: consoleStockId,
          consoleTypeId,
          expireAt: sql`DATE_ADD(NOW(), INTERVAL ${minutes} MINUTE)`,
          createdAt: sql`NOW()`,
        });

        const [created] = await tx.select({
          holdId: reservationHold.id,
          consoleStockId: reservationHold.consoleId,
          expiresAt: reservationHold.expireAt,
          expiresIn: sql<number>`GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), ${reservationHold.expireAt}))`,
        }).from(reservationHold).where(eq(reservationHold.id, reservationId));

        await tx.update(consoleStock).set({ holding: 1 }).where(eq(consoleStock.id, consoleStockId));

        return NextResponse.json({
          success: true,
          reservationId,
          holdId: created.holdId,
          consoleStockId: created.consoleStockId,
          expiresAt: new Date(created.expiresAt).toISOString(),
          expiresIn: Number(created.expiresIn),
          message: "Réservation temporaire créée avec succès",
        }, { status: 201 });
      });

      return response;
    } catch (e) {
      if (e instanceof TxReturn) return e.resp;
      throw e;
    }
  } catch (err) {
    console.error("create-hold-reservation error:", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Erreur lors de la création du hold" }, { status: 500 });
  }
}
