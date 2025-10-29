import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { verifyToken } from "@/lib/jwt";

export async function DELETE(req: NextRequest) {
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

    if (!currentUser.isAdmin) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId");

    if (!reservationId) {
        return NextResponse.json({ error: "ID réservation manquant" }, { status: 400 });
    }

    try {
        const [result] = (await pool.query(
            "DELETE FROM reservations WHERE id = ?",
            [reservationId]
        )) as [ResultSetHeader, unknown];

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
        }

        return NextResponse.json({ message: "Réservation supprimée avec succès." });
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}