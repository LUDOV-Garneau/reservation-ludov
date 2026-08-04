import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { cours } from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, coursId, code } = body;

    if (!name || name.trim() === "") return NextResponse.json({ error: "Le nom du cours est requis." }, { status: 400 });
    if (!code || code.trim() === "") return NextResponse.json({ error: "Le code du cours est requis." }, { status: 400 });
    if (code.length > 7) return NextResponse.json({ error: "Le code du cours ne peut pas dépasser 7 caractères." }, { status: 400 });

    const existing = await db.query.cours.findFirst({
      columns: { id: true },
      where: (t) => eq(t.id, coursId),
    });

    if (!existing) return NextResponse.json({ error: "Aucun cours trouvé avec cet id." }, { status: 404 });

    const duplicate = await db.query.cours.findFirst({
      columns: { id: true },
      where: (t) => and(sql`LOWER(${t.nomCours}) = LOWER(${name.trim()})`, ne(t.id, coursId)),
    });

    if (duplicate) {
      return NextResponse.json({ success: false, message: "Un cours avec ce nom existe déjà." }, { status: 409 });
    }

    await db.update(cours).set({ nomCours: name, codeCours: code }).where(eq(cours.id, coursId));

    return NextResponse.json({ success: true, message: "Cours modifié avec succès." }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la modification du cours :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
