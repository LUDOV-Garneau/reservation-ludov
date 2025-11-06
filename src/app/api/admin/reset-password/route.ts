import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { ResultSetHeader } from "mysql2";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let currentUser;
  try {
    currentUser = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  if (!currentUser || !currentUser.isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
  }

  if (Number(userId) === Number(currentUser.id)) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas réinitialiser votre propre mot de passe" },
      { status: 400 }
    );
  }

  try {
    const [result] = (await pool.query(
      "UPDATE users SET password = NULL WHERE id = ?",
      [userId]
    )) as [ResultSetHeader, unknown];

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
