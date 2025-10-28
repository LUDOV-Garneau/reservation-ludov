import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { error } from "console";

type Body = {
    reservationHoldId: string;
    consoleId: number;
    consoleTypeId: number;
    game1Id: number;
    game2Id?: number | null;
    game3Id?: number | null;
    accessoryIds?: number[] | null;
    coursId: number;
    date: Date;
    time: string;
}

interface ReservationHoldRow extends RowDataPacket {
    id: string;
    user_id: number;
    console_id: number;
    console_type_id: number;
    game1_id: number;
    game2_id: number | null;
    game3_id: number | null;
    accessoirs: string;
    cours: number;
    date: Date;
    time: string;
    expireAt: Date;
}

export async function POST(req : Request) {
    const connection = await pool.getConnection();

    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("SESSION");
        let user = null;

        try {
            const token  = sessionCookie?.value;
            if (token) user = verifyToken(token);
        } catch{
            return NextResponse.json(
                { success: false, message: "Invalid or expired token" },
                { status: 401 }
            );
        }
        if (!user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        let body: Partial<Body> = {};
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        console.log("📥 Received reservation confirmation data:", body);

        const missingFields: string[] = [];

        if (!body.reservationHoldId) missingFields.push("reservationHoldId");
        if (!body.consoleId) missingFields.push("consoleId");
        if (!body.consoleTypeId) missingFields.push("consoleTypeId");
        if (!body.game1Id) missingFields.push("game1Id");
        if (!body.coursId) missingFields.push("coursId");
        if (!body.date) missingFields.push("date");
        if (!body.time) missingFields.push("time");

        if (missingFields.length > 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Champs obligatoire manquant: ${missingFields.join(", ")}` 
                },
                { status: 400 }
            );
        }

        if (typeof body.reservationHoldId !== "string" || body.reservationHoldId.trim() === "") {
            return NextResponse.json(
                { success: false, message: "reservationHoldId must be a non-empty string" },
                { status: 400 }
            );
        }

        const consoleId = Number(body.consoleId);
        if (!Number.isFinite(consoleId) || consoleId <= 0) {
            return NextResponse.json(
                { success: false, message: "consoleId must be a positive number" },
                { status: 400 }
            );
        }

        const consoleTypeId = Number(body.consoleTypeId);
        if (!Number.isFinite(consoleTypeId) || consoleTypeId <= 0) {
            return NextResponse.json(
                { success: false, message: "consoleTypeId must be a positive number" },
                { status: 400 }
            );
        }

        const game1Id = Number(body.game1Id);
        if (!Number.isFinite(game1Id) || game1Id <= 0) {
            return NextResponse.json(
                { success: false, message: "game1Id must be a positive number" },
                { status: 400 }
            );
        }

        let game2Id: number | null = null;
        if (body.game2Id !== undefined && body.game2Id !== null) {
            game2Id = Number(body.game2Id);
            if (!Number.isFinite(game2Id) || game2Id <= 0) {
                return NextResponse.json(
                    { success: false, message: "game2Id must be a positive number if provided" },
                    { status: 400 }
                );
            }
        }

        let game3Id: number | null = null;
        if (body.game3Id !== undefined && body.game3Id !== null) {
            game3Id = Number(body.game3Id);
            if (!Number.isFinite(game3Id) || game3Id <= 0) {
                return NextResponse.json(
                    { success: false, message: "game3Id must be a positive number if provided" },
                    { status: 400 }
                );
            }
        }

        const accessoryIds: number[] = [];
        if (body.accessoryIds !== undefined && body.accessoryIds !== null) {
            if (!Array.isArray(body.accessoryIds)) {
                return NextResponse.json(
                    { success: false, message: "accessoryIds must be an array" },
                    { status: 400 }
                );
            }

            for (let i = 0; i < body.accessoryIds.length; i++) {
                const accId = Number(body.accessoryIds[i]);
                if (!Number.isFinite(accId) || accId <= 0) {
                    return NextResponse.json(
                        { success: false, message: `accessoryIds[${i}] must be a positive number` },
                        { status: 400 }
                    );
                }
                accessoryIds.push(accId);
            }
        }

        const coursId = Number(body.coursId);
        if (!Number.isFinite(coursId) || coursId <= 0) {
            return NextResponse.json(
                { success: false, message: "coursId must be a positive number" },
                { status: 400 }
            );
        }

        const dateStr = String(body.date).trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
            return NextResponse.json(
                { success: false, message: "Invalid date format. Expected YYYY-MM-DD" },
                { status: 400 }
            );
        }

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) {
            return NextResponse.json(
                { success: false, message: "Invalid date value" },
                { status: 400 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj < today) {
            return NextResponse.json(
                { success: false, message: "Date cannot be in the past" },
                { status: 400 }
            );
        }

        const timeStr = String(body.time).trim();
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!timeRegex.test(timeStr)) {
            return NextResponse.json(
                { success: false, message: "Invalid time format. Expected HH:MM or HH:MM:SS" },
                { status: 400 }
            );
        }

        const [hours, minutes] = timeStr.split(':').map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return NextResponse.json(
                { success: false, message: "Invalid time value. Hours must be 0-23 and minutes 0-59" },
                { status: 400 }
            );
        }

        const reservationData: Body = {
            reservationHoldId: body.reservationHoldId.trim(),
            consoleId,
            consoleTypeId,
            game1Id,
            game2Id,
            game3Id,
            accessoryIds: accessoryIds.length > 0 ? accessoryIds : null,
            coursId,
            date: dateObj,
            time: timeStr,
        };

        console.log("Reservation confirmed:", reservationData);

        await connection.beginTransaction();

        try {
            const [holdRows] = await connection.query<ReservationHoldRow[]>(
                `SELECT * FROM reservation_hold WHERE id = ? AND user_id = ?`,
                [reservationData.reservationHoldId, Number(user.id)]
            );

            if (holdRows.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Reservation hold not found or does not belong to user" },
                    { status: 404 }
                );
            }

            const hold = holdRows[0];

            if (hold.id !== reservationData.reservationHoldId) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Reservation hold ID mismatch" },
                    { status: 400 }
                );
            }

            if (hold.user_id !== Number(user.id)) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Unauthorized access to this reservation hold" },
                    { status: 403 }
                );
            }

            if (hold.console_id !== reservationData.consoleId) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Console ID does not match the hold" },
                    { status: 400 }
                );
            }

            if (hold.console_type_id !== reservationData.consoleTypeId) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Console Type ID does not match the hold" },
                    { status: 400 }
                );
            }

            const [consoles] = await connection.query<RowDataPacket[]>(
                `SELECT id FROM console_stock WHERE id = ? AND console_type_id = ? AND is_active = 1   LIMIT 1`,
                [reservationData.consoleId, reservationData.consoleTypeId]
            );
            if (consoles.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Console is not available or does not match the type" },
                    { status: 400 }
                );
            }

            if (hold.game1_id !== reservationData.game1Id ||
                (hold.game2_id || null) !== (reservationData.game2Id || null) ||
                (hold.game3_id || null) !== (reservationData.game3Id || null)) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Game IDs do not match the hold" },
                    { status: 400 }
                );
            }

            const gameIds = [game1Id, game2Id, game3Id].filter((id): id is number => id !== null);
            if (gameIds.length > 0) {
                const placeholders = gameIds.map(() => '?').join(', ');
                const [games] = await connection.query<RowDataPacket[]>(
                    `SELECT id FROM games WHERE id IN (${placeholders})`,
                    gameIds
                );
                if (games.length !== gameIds.length) {
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: "One or more selected games do not exist" },
                        { status: 400 }
                    );
                }
            }

            if (accessoryIds.length > 0) {

                if (!hold.accessoirs) {
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: "No accessories held" },
                        { status: 400 }
                    );
                }

                let holdAccessories: number[];

                if (Array.isArray(hold.accessoirs)) {
                    holdAccessories = hold.accessoirs;
                }
                else if (typeof hold.accessoirs === 'string') {
                    try {
                        holdAccessories = JSON.parse(hold.accessoirs);
                        if (!Array.isArray(holdAccessories)) {
                            throw new Error("Not an array after parsing");
                        }
                    } catch (parseError) {
                        console.error("Error parsing hold accessories:", parseError);
                        await connection.rollback();
                        return NextResponse.json(
                            { success: false, message: "Invalid accessory data in hold" },
                            { status: 500 }
                        );
                    }
                }
                else {
                    console.error("❌ Unexpected accessoirs type:", typeof hold.accessoirs);
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: "Invalid accessory data format" },
                        { status: 500 }
                    );
                }

                const sortedHold = [...holdAccessories].sort((a, b) => a - b);
                const sortedRequest = [...accessoryIds].sort((a, b) => a - b);
                
                if (JSON.stringify(sortedHold) !== JSON.stringify(sortedRequest)) {
                    console.error("Accessories mismatch!");
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: "Accessory IDs do not match the hold" },
                        { status: 400 }
                    );
                }

                const placeholders = accessoryIds.map(() => '?').join(', ');
                const [accessories] = await connection.query<RowDataPacket[]>(
                    `SELECT id FROM accessoires WHERE id IN (${placeholders})`,
                    accessoryIds
                );
                if (accessories.length !== accessoryIds.length) {
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: "One or more selected accessories do not exist" },
                        { status: 400 }
                    );
                }
            }

            if (hold.cours !== reservationData.coursId) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Cours ID does not match the hold" },
                    { status: 400 }
                );
            }

            const [cours] = await connection.query<RowDataPacket[]>(
                `SELECT id FROM cours WHERE id = ?`,
                [reservationData.coursId]
            );
            if (cours.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Selected cours does not exist" },
                    { status: 400 }
                );
            }

            if (hold.date.toISOString().split('T')[0] !== reservationData.date.toISOString().split('T')[0]) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Date does not match the hold" },
                    { status: 400 }
                );
            }

            if (hold.time !== reservationData.time) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Time does not match the hold" },
                    { status: 400 }
                );
            }

            if (new Date(hold.expireAt) < new Date()) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, message: "Reservation hold has expired" },
                    { status: 400 }
                );
            }

            const reservationId = `RSVP-${crypto.randomUUID()}`;

            const [result] = await connection.query(
                `INSERT INTO reservation
                    (id, user_id, console_id, console_type_id, game1_id, game2_id, game3_id, accessory_ids, cours_id, date, time, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    reservationId,
                    user.id,
                    reservationData.consoleId,
                    reservationData.consoleTypeId,
                    reservationData.game1Id,
                    reservationData.game2Id,
                    reservationData.game3Id,
                    reservationData.accessoryIds ? JSON.stringify(reservationData.accessoryIds) : null,
                    reservationData.coursId,
                    reservationData.date,
                    reservationData.time,
                ]
            );

            await connection.query(
                `DELETE FROM reservation_hold WHERE id = ?`,
                [reservationData.reservationHoldId]
            );

            await connection.query(
                `UPDATE console_stock SET holding = 0  WHERE id = ?`,
                [reservationData.consoleId]
            );

            await connection.query(
                `UPDATE games SET holding = 0 WHERE id IN (?, ?, ?)`,
                [
                    reservationData.game1Id,
                    reservationData.game2Id || 0,
                    reservationData.game3Id || 0,
                ]
            );

            await connection.commit();

            return NextResponse.json(
                { success: true, message: "Reservation confirmed", data: reservationData },
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
    }
}