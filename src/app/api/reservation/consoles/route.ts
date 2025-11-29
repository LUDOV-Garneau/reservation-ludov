import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface ConsoleCatalogItem {
  id: number;
  name: string;
  picture: string;
  active_units: number;
  total_units: number;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        console_type_id as id,
        name,
        picture,
        active_units,
        total_units
       FROM console_catalog 
       WHERE active_units > 0
       ORDER BY name`
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
