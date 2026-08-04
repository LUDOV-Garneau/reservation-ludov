import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { cours } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { name, code } = body;

    if (!name || name.trim() === "") return NextResponse.json({ error: "Le champ nom est requis." }, { status: 400 });
    if (!code || code.trim() === "") return NextResponse.json({ error: "Le champ code est requis." }, { status: 400 });
    if (code.length > 7) return NextResponse.json({ error: "Le code du cours ne peut pas dépasser 7 caractères." }, { status: 400 });

    const existing = await db.query.cours.findFirst({
      columns: { id: true },
      where: (t) => sql`LOWER(${t.nomCours}) = LOWER(${name.trim()})`,
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Un cours avec ce nom existe déjà." }, { status: 409 });
    }

    await db.insert(cours).values({ nomCours: name, codeCours: code });

    return NextResponse.json({ success: true, message: "Cours ajouté avec succès." }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout du cours :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
