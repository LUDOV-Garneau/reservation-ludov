import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const rows = await db.query.consoleStock.findMany({
      columns: { id: true, consoleTypeId: true, name: true, picture: true },
      where: (t) => and(eq(t.isActive, 1), eq(t.holding, 0)),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du fetch consoleStock :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
