import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
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
  date: string;   // <- YYYY-MM-DD (string, pas Date)
  time: string;   // <- HH:MM(:SS)
};

interface ReservationHoldRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string | null;
  cours: number | null;
  date: Date | string;
  time: string;
  expireAt: Date | string;
}

export async function POST(req: Request) {
  const connection = await pool.getConnection();

  try {
    // cookies() est synchrone
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;

    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    if (!user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Body
    let body: Partial<Body> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
    }

    console.log("📥 Received reservation confirmation data:", body);

    // Champs requis
    const missing: string[] = [];
    if (!body.reservationHoldId) missing.push("reservationHoldId");
    if (!body.consoleId)        missing.push("consoleId");
    if (!body.consoleTypeId)    missing.push("consoleTypeId");
    if (!body.game1Id)          missing.push("game1Id");
    if (!body.coursId)          missing.push("coursId");
    if (!body.date)             missing.push("date");
    if (!body.time)             missing.push("time");
    if (missing.length) {
      return NextResponse.json({ success: false, message: `Champs obligatoire manquant: ${missing.join(", ")}` }, { status: 400 });
    }

    const reservationHoldId = String(body.reservationHoldId).trim();
    if (!reservationHoldId) {
      return NextResponse.json({ success: false, message: "reservationHoldId must be a non-empty string" }, { status: 400 });
    }

    // Numériques
    const consoleId     = Number(body.consoleId);
    const consoleTypeId = Number(body.consoleTypeId);
    const game1Id       = Number(body.game1Id);
    const coursId       = Number(body.coursId);
    if (![consoleId, consoleTypeId, game1Id, coursId].every(n => Number.isFinite(n) && n > 0)) {
      return NextResponse.json({ success: false, message: "IDs must be positive numbers" }, { status: 400 });
    }

    const game2Id = body.game2Id != null ? Number(body.game2Id) : null;
    const game3Id = body.game3Id != null ? Number(body.game3Id) : null;
    if (game2Id != null && (!Number.isFinite(game2Id) || game2Id <= 0)) {
      return NextResponse.json({ success: false, message: "game2Id must be a positive number" }, { status: 400 });
    }
    if (game3Id != null && (!Number.isFinite(game3Id) || game3Id <= 0)) {
      return NextResponse.json({ success: false, message: "game3Id must be a positive number" }, { status: 400 });
    }

    // Accessoires
    const accessoryIds: number[] = Array.isArray(body.accessoryIds)
      ? body.accessoryIds.map(Number).filter(n => Number.isFinite(n) && n > 0)
      : [];

    // Date/heure (local, pas d’UTC)
    const dateStr = String(body.date).trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json({ success: false, message: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
    }

    const timeStr = String(body.time).trim();
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(timeStr)) {
      return NextResponse.json({ success: false, message: "Invalid time format. Expected HH:MM or HH:MM:SS" }, { status: 400 });
    }
    const [H, M] = timeStr.split(":").map(Number);
    if (H < 0 || H > 23 || M < 0 || M > 59) {
      return NextResponse.json({ success: false, message: "Invalid time value. Hours 0-23, minutes 0-59" }, { status: 400 });
    }

    // Interdiction date passée (locale)
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth()+1).padStart(2,'0')}-${String(todayLocal.getDate()).padStart(2,'0')}`;
    if (dateStr < todayStr) {
      return NextResponse.json({ success: false, message: "Date cannot be in the past" }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────
    // Transaction atomique
    await connection.beginTransaction();
    try {
      // Hold valide, à l’utilisateur, non expiré
      const [holdRows] = await connection.query<ReservationHoldRow[]>(
        `SELECT *
           FROM reservation_hold
          WHERE id = ?
            AND user_id = ?
            AND expireAt > NOW()
          LIMIT 1`,
        [reservationHoldId, Number(user.id)]
      );
      if (holdRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Reservation hold not found, expired or not yours" }, { status: 404 });
      }
      const hold = holdRows[0];

      // Intégrité
      if (hold.console_id !== consoleId) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Console ID does not match the hold" }, { status: 400 });
      }
      if (hold.console_type_id !== consoleTypeId) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Console Type ID does not match the hold" }, { status: 400 });
      }
      if (
        hold.game1_id !== game1Id ||
        (hold.game2_id || null) !== (game2Id || null) ||
        (hold.game3_id || null) !== (game3Id || null)
      ) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Game IDs do not match the hold" }, { status: 400 });
      }

      // Console active/type OK
      const [consoles] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM console_stock WHERE id = ? AND console_type_id = ? AND is_active = 1 LIMIT 1`,
        [consoleId, consoleTypeId]
      );
      if (consoles.length === 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Console is not available or does not match the type" }, { status: 400 });
      }

      // Accessoires : cohérence + existence
      if (accessoryIds.length > 0) {
        if (!hold.accessoirs) {
          await connection.rollback();
          return NextResponse.json({ success: false, message: "No accessories held" }, { status: 400 });
        }
        let holdAccessories: number[] = [];
        try {
          holdAccessories = Array.isArray(hold.accessoirs)
            ? (hold.accessoirs as number[])
            : JSON.parse(hold.accessoirs);
          if (!Array.isArray(holdAccessories)) throw new Error("not array");
          holdAccessories = holdAccessories.map(Number).filter(n => Number.isFinite(n) && n > 0);
        } catch {
          await connection.rollback();
          return NextResponse.json({ success: false, message: "Invalid accessory data in hold" }, { status: 500 });
        }
        const a = [...holdAccessories].sort((x,y)=>x-y);
        const b = [...accessoryIds].sort((x,y)=>x-y);
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          await connection.rollback();
          return NextResponse.json({ success: false, message: "Accessory IDs do not match the hold" }, { status: 400 });
        }
        const phAcc = accessoryIds.map(() => "?").join(", ");
        const [accRows] = await connection.query<RowDataPacket[]>(
          `SELECT id FROM accessoires WHERE id IN (${phAcc})`,
          accessoryIds
        );
        if (accRows.length !== accessoryIds.length) {
          await connection.rollback();
          return NextResponse.json({ success: false, message: "One or more selected accessories do not exist" }, { status: 400 });
        }
      }

      // Date/heure (pas d’UTC) : compare string yyyy-mm-dd et time texte
      const holdDateStr =
        hold.date instanceof Date
          ? `${hold.date.getFullYear()}-${String(hold.date.getMonth()+1).padStart(2,'0')}-${String(hold.date.getDate()).padStart(2,'0')}`
          : String(hold.date).slice(0,10);

      if (holdDateStr !== dateStr) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Date does not match the hold" }, { status: 400 });
      }
      if (hold.time !== timeStr) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Time does not match the hold" }, { status: 400 });
      }

      // Re-check expiration juste avant insertion
      const [stillValid] = await connection.query<RowDataPacket[]>(
        `SELECT 1 AS ok FROM reservation_hold WHERE id = ? AND expireAt > NOW() LIMIT 1`,
        [reservationHoldId]
      );
      if (stillValid.length === 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: "Reservation hold has expired" }, { status: 400 });
      }

      // Insertion
      const reservationId = `RSVP-${crypto.randomUUID()}`;
      await connection.query(
        `INSERT INTO reservation
           (id, user_id, console_id, console_type_id, game1_id, game2_id, game3_id,
            accessory_ids, cours_id, date, time, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          reservationId,
          Number(user.id),
          consoleId,
          consoleTypeId,
          game1Id,
          game2Id,
          game3Id,
          accessoryIds.length ? JSON.stringify(accessoryIds) : null,
          coursId,
          dateStr,
          timeStr,
        ]
      );

      // Nettoyage/libération
      await connection.query(`DELETE FROM reservation_hold WHERE id = ?`, [reservationHoldId]);
      await connection.query(`UPDATE console_stock SET holding = 0 WHERE id = ?`, [consoleId]);

      const gameIdsToRelease = [game1Id, game2Id, game3Id].filter((x): x is number => Number.isFinite(x as number));
      if (gameIdsToRelease.length) {
        const phGames = gameIdsToRelease.map(() => "?").join(", ");
        await connection.query(`UPDATE games SET holding = 0 WHERE id IN (${phGames})`, gameIdsToRelease);
      }

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          message: "Reservation confirmed",
          data: {
            reservationId,
            consoleId,
            consoleTypeId,
            game1Id, game2Id, game3Id,
            accessoryIds: accessoryIds.length ? accessoryIds : null,
            coursId,
            date: dateStr,
            time: timeStr,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "Error validating reservation hold",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error confirming reservation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
