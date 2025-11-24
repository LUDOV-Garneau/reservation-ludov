import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const conn = await pool.getConnection();
        try {
            const [policies] = await conn.query(
                `SELECT * FROM policies`
            );

            conn.release();

            if (Array.isArray(policies) && policies.length > 0) {
                return NextResponse.json({ policies: policies[0] });
            } else {
                return NextResponse.json({ policies: null });
            }
        } catch (error) {
            conn.release();
            console.error("Error querying policies:", error);
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error handling policies POST request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}