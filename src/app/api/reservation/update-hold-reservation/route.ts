import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

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

interface HoldRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  station_id: number | null;
  accessoirs: string | null;
  cours: number | null;
  date: string | null;
  time: string | null;
  expireAt: string;
  expiresIn: number;
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
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!user?.id || !Number.isFinite(Number(user.id))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = Number(user.id);

    let body: Partial<Body> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Body JSON invalide" },
        { status: 400 }
      );
    }

    const reservationId = String(body.reservationId || "");
    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "reservationId manquant" },
        { status: 400 }
      );
    }

    const game1Id =
      body.game1Id === undefined
        ? undefined
        : body.game1Id === null
        ? null
        : Number(body.game1Id);
    const game2Id =
      body.game2Id === undefined
        ? undefined
        : body.game2Id === null
        ? null
        : Number(body.game2Id);
    const game3Id =
      body.game3Id === undefined
        ? undefined
        : body.game3Id === null
        ? null
        : Number(body.game3Id);
    const newConsoleTypeId =
      body.newConsoleId === undefined ? undefined : Number(body.newConsoleId);
    const accessories = body.accessories;
    const coursId =
      body.coursId === undefined
        ? undefined
        : body.coursId === null
        ? null
        : Number(body.coursId);
    const date = body.date === undefined ? undefined : body.date ?? null;
    const time = body.time === undefined ? undefined : body.time ?? null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<HoldRow[]>(
        `
        SELECT 
          r.*,
          GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), r.expireAt)) AS expiresIn
        FROM reservation_hold r
        WHERE r.id = ?
          AND r.user_id = ?
          AND r.expireAt > NOW()
        FOR UPDATE
        `,
        [reservationId, userId]
      );

      if (!rows || rows.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { success: false, message: "Réservation expirée", status: "expired" },
          { status: 410 }
        );
      }

      const reservation = rows[0];
      const currentConsoleId = reservation.console_id;

      const updates: string[] = [];
      const values: unknown[] = [];

      if (accessories !== undefined) {
        if (
          accessories === null ||
          (Array.isArray(accessories) && accessories.length === 0)
        ) {
          updates.push("accessoirs = NULL");
        } else if (Array.isArray(accessories)) {
          updates.push("accessoirs = CAST(? AS JSON)");
          values.push(JSON.stringify(accessories));
        } else {
          await conn.rollback();
          return NextResponse.json(
            {
              success: false,
              message: "accessories doit être un tableau ou null",
            },
            { status: 400 }
          );
        }
      }

      if (coursId !== undefined) {
        updates.push("cours = ?");
        values.push(coursId);
      }

      if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
      }
      if (time !== undefined) {
        const [availableStations] = await pool.query<RowDataPacket[]>(
          `
          SELECT s.id AS station_id
          FROM stations s
          WHERE s.isActive = 1
            AND JSON_CONTAINS(s.consoles, JSON_ARRAY(?))
            AND s.id NOT IN (
              SELECT station
              FROM reservation
              WHERE date = ?
                AND time = ?
                AND archived = 0
            )
            AND s.id NOT IN (
              SELECT station_id
              FROM reservation_hold
              WHERE date = ?
                AND time = ?
                AND expireAt > NOW()
            )
          `,
          [currentConsoleId, date, time, date, time]
        );

        if (!availableStations || availableStations.length === 0) {
          await conn.rollback();
          return NextResponse.json(
            {
              success: false,
              message: "Aucune station disponible pour la date et l'heure choisies",
            },
            { status: 409 }
          );
        }
        const availableStationId = availableStations[0]?.station_id;
        updates.push("station_id = ?");
        values.push(availableStationId);

        updates.push("time = ?");
        values.push(time);
      }

      let consoleChanged = false;
      if (
        newConsoleTypeId !== undefined &&
        newConsoleTypeId !== reservation.console_type_id
      ) {
        const toFree: number[] = [
          reservation.game1_id,
          reservation.game2_id,
          reservation.game3_id,
        ].filter((x): x is number => x !== null);
        if (toFree.length > 0) {
          await conn.query(
            `SELECT id FROM games WHERE id IN (${toFree
              .map(() => "?")
              .join(",")}) FOR UPDATE`,
            toFree
          );
          await conn.query(
            `UPDATE games SET holding = 0 WHERE id IN (${toFree
              .map(() => "?")
              .join(",")})`,
            toFree
          );
        }

        const [unitsNewConsole] = await conn.query<RowDataPacket[]>(
          `
          SELECT cs.id AS consoleStockId
          FROM console_stock cs
          WHERE cs.console_type_id = ?
            AND cs.is_active = 1
            AND cs.holding = 0
          LIMIT 1
          `,
          [newConsoleTypeId]
        );

        if (!unitsNewConsole || unitsNewConsole.length === 0) {
          await conn.rollback();
          return NextResponse.json(
            { success: false, message: "Nouvelle console indisponible" },
            { status: 400 }
          );
        }

        const stockId = Number(unitsNewConsole[0].consoleStockId);

        await conn.query(`UPDATE console_stock SET holding = 0 WHERE id = ?`, [
          currentConsoleId,
        ]);
        await conn.query(`UPDATE console_stock SET holding = 1 WHERE id = ?`, [
          stockId,
        ]);

        updates.push(
          "console_id = ?",
          "console_type_id = ?",
          "game1_id = NULL",
          "game2_id = NULL",
          "game3_id = NULL",
          "accessoirs = NULL",
          "cours = NULL",
          "date = NULL",
          "time = NULL"
        );
        values.push(stockId, newConsoleTypeId);

        consoleChanged = true;
      }

      if (!consoleChanged) {
        const desiredGame1 =
          game1Id === undefined ? reservation.game1_id : game1Id;
        const desiredGame2 =
          game2Id === undefined ? reservation.game2_id : game2Id;
        const desiredGame3 =
          game3Id === undefined ? reservation.game3_id : game3Id;

        const desiredListRaw = [desiredGame1, desiredGame2, desiredGame3];
        const desiredList = desiredListRaw.filter(
          (x) => x !== null
        ) as number[];
        const hasDup = new Set(desiredList).size !== desiredList.length;
        if (hasDup) {
          await conn.rollback();
          return NextResponse.json(
            {
              success: false,
              message: "Le même jeu ne peut pas être choisi deux fois.",
            },
            { status: 400 }
          );
        }

        const currentSet = new Set<number>(
          [
            reservation.game1_id,
            reservation.game2_id,
            reservation.game3_id,
          ].filter((x): x is number => x !== null)
        );
        const finalSet = new Set<number>(desiredList);

        const toAdd: number[] = [...finalSet].filter(
          (id) => !currentSet.has(id)
        );
        const toRemove: number[] = [...currentSet].filter(
          (id) => !finalSet.has(id)
        );

        const lockIds = [...new Set([...toAdd, ...toRemove])];
        if (lockIds.length > 0) {
          await conn.query(
            `SELECT id FROM games WHERE id IN (${lockIds
              .map(() => "?")
              .join(",")}) FOR UPDATE`,
            lockIds
          );
        }

        if (toAdd.length > 0) {
          const [chk] = await conn.query<RowDataPacket[]>(
            `SELECT id FROM games WHERE id IN (${toAdd
              .map(() => "?")
              .join(",")}) AND holding = 0`,
            toAdd
          );
          const okIds = new Set<number>(chk.map((r) => Number(r.id)));
          const blocked = toAdd.filter((id) => !okIds.has(id));
          if (blocked.length > 0) {
            await conn.rollback();
            return NextResponse.json(
              {
                success: false,
                message: `Jeu(x) indisponible(s): ${blocked.join(", ")}`,
              },
              { status: 400 }
            );
          }
        }

        if (toRemove.length > 0) {
          await conn.query(
            `UPDATE games SET holding = 0 WHERE id IN (${toRemove
              .map(() => "?")
              .join(",")})`,
            toRemove
          );
        }
        if (toAdd.length > 0) {
          await conn.query(
            `UPDATE games SET holding = 1 WHERE id IN (${toAdd
              .map(() => "?")
              .join(",")})`,
            toAdd
          );
        }

        const gameUpdates: string[] = [];
        const gameValues: unknown[] = [];
        if (game1Id !== undefined) {
          if (desiredGame1 === null) gameUpdates.push(`game1_id = NULL`);
          else {
            gameUpdates.push(`game1_id = ?`);
            gameValues.push(desiredGame1);
          }
        }
        if (game2Id !== undefined) {
          if (desiredGame2 === null) gameUpdates.push(`game2_id = NULL`);
          else {
            gameUpdates.push(`game2_id = ?`);
            gameValues.push(desiredGame2);
          }
        }
        if (game3Id !== undefined) {
          if (desiredGame3 === null) gameUpdates.push(`game3_id = NULL`);
          else {
            gameUpdates.push(`game3_id = ?`);
            gameValues.push(desiredGame3);
          }
        }
        updates.push(...gameUpdates);
        values.push(...gameValues);
      }

      if (updates.length > 0) {
        const sql = `UPDATE reservation_hold SET ${updates.join(
          ", "
        )} WHERE id = ? AND user_id = ?`;
        values.push(reservationId, userId);
        await conn.query(sql, values);
      }

      await conn.commit();

      const [updatedRows] = await conn.query<HoldRow[]>(
        `
        SELECT 
          id,
          user_id,
          console_id,
          console_type_id,
          game1_id,
          game2_id,
          game3_id,
          accessoirs,
          cours,
          date,
          time,
          expireAt,
          GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), expireAt)) AS expiresIn
        FROM reservation_hold
        WHERE id = ? AND user_id = ?
        `,
        [reservationId, userId]
      );

      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Réservation introuvable après mise à jour",
          },
          { status: 500 }
        );
      }

      const updated = updatedRows[0];

      let accessoriesArray: number[] = [];
      if (updated.accessoirs) {
        try {
          if (typeof updated.accessoirs === "string") {
            accessoriesArray = JSON.parse(updated.accessoirs);
          } else if (Array.isArray(updated.accessoirs)) {
            accessoriesArray = updated.accessoirs as unknown as number[];
          }
        } catch {
          return NextResponse.json(
            {
              success: false,
              message: "Erreur lors de la récupération des accessoires",
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        reservationId,
        consoleId: Number(updated.console_id),
        consoleTypeId: Number(updated.console_type_id),
        games: [updated.game1_id, updated.game2_id, updated.game3_id].filter(
          (id): id is number => id !== null
        ),
        accessories: accessoriesArray,
        coursId: updated.cours ?? null,
        date: updated.date,
        time: updated.time,
        expiresAt: new Date(updated.expireAt).toISOString(),
        expiresIn: Number(updated.expiresIn),
      });
    } catch (err) {
      await conn.rollback();
      console.error("Erreur update reservation:", err);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur serveur",
          error: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error("update-hold-reservation error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la mise à jour du hold";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
