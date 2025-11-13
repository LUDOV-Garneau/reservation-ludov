import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";

type UserRowData = RowDataPacket & {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    isAdmin: number;
    lastUpdated: Date | string;
    createdAt: Date | string;
    lastLogin: Date | string | null;
};

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("SESSION")?.value;
        if (!token) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = verifyToken(token);
        if (!user?.isAdmin) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const userIdParam = searchParams.get("userId");
        const userId = userIdParam ? Number(userIdParam) : NaN;

        if (!userId || isNaN(Number(userId))) {
            return NextResponse.json(
                { success: false, error: "Bad Request: Invalid userId" },
                { status: 400 }
            );
        }

        try {

            const [userExists] = await pool.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (Array.isArray(userExists) && userExists.length === 0) {
                return NextResponse.json(
                    { success: false, error: "User not found" },
                    { status: 404 }
                );
            }


            const [user] = await pool.query<UserRowData[]>(
                `SELECT id, firstname, lastname, email, isAdmin, lastUpdatedAt, createdAt, LastLogin FROM users WHERE id = ?`,
                [userId]
            )

            if (Array.isArray(user) && user.length === 0) {
                return NextResponse.json(
                    { success: false, error: "User not found" },
                    { status: 404 }
                );
            }

            const userData = user[0];

            return NextResponse.json(
                { 
                    success: true,
                    user: userData
                }
            );
        } finally {
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}