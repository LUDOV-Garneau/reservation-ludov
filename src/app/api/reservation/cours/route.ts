import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type CoursRow = RowDataPacket & {
    id: number
    number: string
    name: string
}

export async function GET() {
    try {
        const [rows] = await pool.query<CoursRow[]>(
            "SELECT id, number, name FROM cours"
        );

        const data = (rows ?? []).map(r => ({
            id: r.id,
            code_cours: r.number,
            nom_cours: r.name,
        }));

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("[GET /api/cours] error:", error);
        return NextResponse.json(
            { message: process.env.NODE_ENV === "production" ? "Une erreur s'est produite." : String(error) },
            { status: 500 }
        );
    }
}
