import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";

type RequestBody = { 
  targetUserId: number;
};

export async function DELETE(req: NextRequest) {
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
                { error: "Vous ne pouvez pas supprimer votre propre compte" },
                { status: 400 }
            );
        }

        const [reservationsRows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM reservation WHERE user_id = ?",
            [targetUserId]
        );

        if (reservationsRows && reservationsRows.length > 0) {
            await pool.query(
                "DELETE FROM reservation WHERE user_id = ?",
                [targetUserId]
            );
        }

        await pool.query(
            "DELETE FROM users WHERE id = ?",
            [targetUserId]
        );

        return NextResponse.json(
            { 
                success: true,
                message: `Utilisateur avec l'ID ${targetUserId} supprimé avec succès.`,
            },
            { status: 200 }
        );
    } catch(err) {
        console.error("ERREUR SUPPRESSION UTILISATEUR:", err);

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