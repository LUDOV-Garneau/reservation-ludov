import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("SESSION")?.value;
        if (!token) {
            return new Response(
                JSON.stringify({ success: false, message: "Unauthorized" }),
                { status: 401 }
            );
        }

        const user = verifyToken(token);
        if (!user?.isAdmin) {
            return new Response(
                JSON.stringify({ success: false, message: "Forbidden" }),
                { status: 403 }
            );
        }

        if (!user?.id) {
            return new Response(
                JSON.stringify({ success: false, message: "Unauthorized" }),
                { status: 401 }
            );
        }

        const [totalUser] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS total FROM users`
        );

        const [totalUserNotBoarded] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS totalNotBoarded FROM users WHERE password IS NULL`
        );

        const [totalUserWithReservation] = await pool.query<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT u.id) AS totalWithReservation
             FROM users u
             JOIN reservation r ON u.id = r.user_id`
        );

        return NextResponse.json(
        {
            success: true,
            totalUser: totalUser[0].total,
            totalUserNotBoarded: totalUserNotBoarded[0].totalNotBoarded,
            totalUserWithReservation: totalUserWithReservation[0].totalWithReservation,
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}