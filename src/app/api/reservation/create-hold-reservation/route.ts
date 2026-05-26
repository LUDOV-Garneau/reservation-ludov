import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { reservationHold, consoleStock } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import crypto from "crypto";

type Body = { consoleTypeId: number; minutes?: number };

interface HoldRow {
  holdId: string;
  consoleStockId: number;
  expiresAt: string;
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
        await tx.delete(reservationHold).where(sql`${reservationHold.expireAt} <= NOW()`);

        const existing = await tx.select({
          holdId: reservationHold.id,
          consoleStockId: reservationHold.consoleId,
          expiresAt: reservationHold.expireAt,
          expiresIn: sql<number>`GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), ${reservationHold.expireAt}))`,
        }).from(reservationHold)
          .where(and(eq(reservationHold.userId, userId), sql`${reservationHold.expireAt} > NOW()`))
          .limit(1);

        if (existing.length > 0) {
          return NextResponse.json({
            success: true,
            reservationId: existing[0].holdId,
            holdId: existing[0].holdId,
            consoleStockId: existing[0].consoleStockId,
            expiresAt: new Date(existing[0].expiresAt).toISOString(),
            expiresIn: Number(existing[0].expiresIn),
            message: "Hold existant récupéré",
          }, { status: 200 });
        }

        // FOR UPDATE n'est pas supporté par Drizzle MySQL — raw SQL requis ici
        const units = (await tx.execute<{ consoleStockId: number }>(
          sql`SELECT cs.id AS consoleStockId FROM console_stock cs WHERE cs.console_type_id = ${consoleTypeId} AND cs.is_active = 1 AND cs.holding = 0 AND NOT EXISTS (SELECT 1 FROM reservation_hold h WHERE h.console_id = cs.id AND h.expireAt > NOW()) LIMIT 1 FOR UPDATE`
        ) as unknown) as { consoleStockId: number }[];

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
