import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type CoursRow = RowDataPacket & {
    id: number
    code_cours: string
    nom_cours: string
}

export async function GET() {
    try {
        const [rows] = await pool.query<CoursRow[]>(
            "SELECT id, code_cours, nom_cours FROM cours"
        );

        const data = (rows ?? []).map(r => ({
            id: r.id,
            code_cours: r.code_cours,
            nom_cours: r.nom_cours,
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
