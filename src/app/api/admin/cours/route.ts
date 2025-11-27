import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conn = await pool.getConnection();

    const [coursRows] = await conn.query(
      `
      SELECT 
        id,
        code_cours,
        nom_cours
      FROM cours
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    const cours = coursRows as {
      id: number;
      nom_cours: string;
      code_cours: string;
    }[];

    const [countRows] = (await conn.query(`
      SELECT COUNT(*) AS total FROM cours
    `)) as [Array<{ total: number }>, unknown];
    const total = countRows[0].total;

    conn.release();
    return NextResponse.json(
      {
        success: true,
        message: "Cours récupérées avec succès",
        data: {
          cours: cours,
          total,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur lors de la récupération des cours :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
