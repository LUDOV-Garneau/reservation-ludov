import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      "SELECT SQL_CALC_FOUND_ROWS id, titre, author, picture, available, biblio_id FROM games WHERE available = 1 LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [countRows] = await pool.query("SELECT FOUND_ROWS() as total") as [Array<{ total: number }>, unknown];
    const total = countRows[0].total;

    return NextResponse.json({ data: rows, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
