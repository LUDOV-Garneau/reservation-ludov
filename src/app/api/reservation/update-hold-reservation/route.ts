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
  newConsoleId?: number;      // << attendu: console_type_id (comme dans ton code existant)
  accessories?: number[] | null;
  coursId?: number | null;
  date?: string | null;       // YYYY-MM-DD
  time?: string | null;       // HH:MM[:SS]
};

interface HoldRow extends RowDataPacket {
  id: string;
  user_id: number;
  console_id: number;
  console_type_id: number;
  game1_id: number | null;
  game2_id: number | null;
  game3_id: number | null;
  accessoirs: string | null;
  cours: number | null;
  date: string | null;
  time: string | null;
  expireAt: string;
  expiresIn: number; // TIMESTAMPDIFF(SECOND, NOW(), expireAt)
}

export async function POST(req: Request) {
  try {
    // --- Auth ---
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

    // --- Body ---
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

    const game1Id = body.game1Id === undefined ? undefined : (body.game1Id === null ? null : Number(body.game1Id));
    const game2Id = body.game2Id === undefined ? undefined : (body.game2Id === null ? null : Number(body.game2Id));
    const game3Id = body.game3Id === undefined ? undefined : (body.game3Id === null ? null : Number(body.game3Id));
    const newConsoleTypeId = body.newConsoleId === undefined ? undefined : Number(body.newConsoleId);
    const accessories = body.accessories; // peut être undefined | null | number[]
    const coursId = body.coursId === undefined ? undefined : (body.coursId === null ? null : Number(body.coursId));
    const date = body.date === undefined ? undefined : (body.date ?? null);
    const time = body.time === undefined ? undefined : (body.time ?? null);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 🔒 On verrouille ET on laisse MySQL décider si c'est expiré
      const [rows] = await conn.query<HoldRow[]>(
        `
        SELECT 
          r.*,
          GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), r.expireAt)) AS expiresIn
        FROM reservation_hold r
        WHERE r.id = ?
          AND r.user_id = ?
          AND r.expireAt > NOW()        -- <= clé: si expiré, pas de ligne retournée
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

      // --- Jeux: on gère hold/unhold avec granularité ---
      const gameFields = [
        { incoming: game1Id, field: "game1_id" as const },
        { incoming: game2Id, field: "game2_id" as const },
        { incoming: game3Id, field: "game3_id" as const },
      ];

      for (const g of gameFields) {
        const current = reservation[g.field];

        if (g.incoming !== undefined && g.incoming !== null) {
          if (current === g.incoming) {
            // rien à faire pour ce slot
          } else {
            // vérifier que le jeu demandé est libre
            const [chk] = await conn.query<RowDataPacket[]>(
              `SELECT id FROM games WHERE id = ? AND holding = 0 FOR UPDATE`,
              [g.incoming]
            );
            if (!chk || chk.length === 0) {
              await conn.rollback();
              return NextResponse.json(
                { success: false, message: `Jeu ${g.incoming} indisponible` },
                { status: 400 }
              );
            }
            // hold le nouveau
            await conn.query(`UPDATE games SET holding = 1 WHERE id = ?`, [g.incoming]);
            // un-hold l'ancien si existait
            if (current !== null) {
              await conn.query(`UPDATE games SET holding = 0 WHERE id = ?`, [current]);
            }
            updates.push(`${g.field} = ?`);
            values.push(g.incoming);
          }
        } else if (g.incoming === null) {
          // demande d'effacer ce slot => un-hold si nécessaire
          if (current !== null) {
            await conn.query(`UPDATE games SET holding = 0 WHERE id = ?`, [current]);
          }
          updates.push(`${g.field} = NULL`);
        }
      }

      // --- Accessoires JSON ---
      if (accessories !== undefined) {
        if (accessories === null || (Array.isArray(accessories) && accessories.length === 0)) {
          updates.push("accessoirs = NULL");
        } else if (Array.isArray(accessories)) {
          updates.push("accessoirs = CAST(? AS JSON)");
          values.push(JSON.stringify(accessories));
        } else {
          await conn.rollback();
          return NextResponse.json(
            { success: false, message: "accessories doit être un tableau ou null" },
            { status: 400 }
          );
        }
      }

      // --- Cours ---
      if (coursId !== undefined) {
        updates.push("cours = ?");
        values.push(coursId);
      }

      // --- Date/Heure ---
      if (date !== undefined) {
        updates.push("date = ?");
        values.push(date);
      }
      if (time !== undefined) {
        updates.push("time = ?");
        values.push(time);
      }

      // --- Changement de type de console (newConsoleId = console_type_id) ---
      let finalConsoleId = currentConsoleId;
      if (newConsoleTypeId !== undefined && newConsoleTypeId !== reservation.console_type_id) {
        // Trouver une unité libre pour ce type
        const [unitsNewConsole] = await conn.query<RowDataPacket[]>(
          `
          SELECT cs.id AS consoleStockId, cs.console_type_id AS consoleTypeId, cs.holding
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

        // Libérer l’ancienne
        await conn.query(`UPDATE console_stock SET holding = 0 WHERE id = ?`, [currentConsoleId]);
        // Occuper la nouvelle
        await conn.query(`UPDATE console_stock SET holding = 1 WHERE id = ?`, [stockId]);

        updates.push("console_id = ?");
        values.push(stockId);
        updates.push("console_type_id = ?");
        values.push(newConsoleTypeId);

        finalConsoleId = stockId;

        // Réinitialiser la sélection quand on change de type
        updates.push("game1_id = NULL", "game2_id = NULL", "game3_id = NULL");
        updates.push("accessoirs = NULL");
        updates.push("cours = NULL");
        updates.push("date = NULL", "time = NULL");
      }

      // --- Appliquer l’UPDATE si nécessaire
      if (updates.length > 0) {
        const sql = `UPDATE reservation_hold SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`;
        values.push(reservationId, userId);
        await conn.query(sql, values);
      }

      // (Optionnel) rafraîchir le TTL côté DB si tu veux “prolonger” le hold à chaque interaction
      // await conn.query(`UPDATE reservation_hold SET expireAt = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?`, [reservationId]);

      await conn.commit();

      // Relecture (sans FOR UPDATE) pour répondre
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
        // très improbable juste après commit, mais au cas où…
        return NextResponse.json(
          { success: false, message: "Réservation introuvable après mise à jour" },
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
            { success: false, message: "Erreur lors de la récupération des accessoires" },
            { status: 500 }
          );
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
        expiresIn: Number(updated.expiresIn), // <<< pour ton timer côté front
      });
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error("Erreur update reservation:", err);
      return NextResponse.json(
        { success: false, message: "Erreur serveur", error: err instanceof Error ? err.message : "Unknown error" },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error("update-hold-reservation error:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de la mise à jour du hold";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
