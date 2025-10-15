import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        email,
        firstname AS firstName,
        lastname AS lastName
      FROM users
      ORDER BY createdAt DESC
    `)

    return NextResponse.json(rows)
  } catch (err) {
    console.error("Erreur lors de la récupération des utilisateurs :", err)
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
