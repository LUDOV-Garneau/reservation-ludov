import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { cours } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const coursRows = await db.query.cours.findMany({
      columns: { id: true, codeCours: true, nomCours: true },
      orderBy: (t, { asc }) => [asc(t.id)],
      limit,
      offset,
    });

    const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(cours);

    return NextResponse.json({
      success: true,
      message: "Cours récupérées avec succès",
      data: { cours: coursRows, total },
    }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la récupération des cours :", err);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
