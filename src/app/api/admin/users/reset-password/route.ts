import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket, ResultSetHeader } from "mysql2";

type RequestBody = { 
  targetUserId: number;
};

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const authUser = verifyToken(token);
    
    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 401 }
      );
    }

    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: "Accès refusé - Privilèges administrateur requis" },
        { status: 403 }
      );
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    const targetUserId = Number(body.targetUserId);
    
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, email FROM users WHERE id = ? LIMIT 1",
      [targetUserId]
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    if (targetUserId === authUser.id) {
      return NextResponse.json(
        { error: "Impossible de réinitialiser votre propre mot de passe" },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE users SET password = NULL WHERE id = ?",
      [targetUserId]
    );

    if (result.affectedRows > 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Mot de passe réinitialisé avec succès" 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Mot de passe déjà réinitialisé" 
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", err);
    
    const message = err instanceof Error 
      ? err.message 
      : "Erreur interne du serveur";
    
    return NextResponse.json(
      { 
        success: false, 
        error: message 
      },
      { status: 500 }
    );
  }
}