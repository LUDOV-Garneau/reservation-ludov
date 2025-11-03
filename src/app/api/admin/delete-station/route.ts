import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

export async function DELETE(req: NextRequest) {
    const token = req.cookies.get("SESSION")?.value;

    if (!token) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!user.isAdmin) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const stationIdRaw = searchParams.get("stationId");

    if (!stationIdRaw) {
        return NextResponse.json({ error: "ID de station manquant" }, { status: 400 });
    }

    const stationId = Number(stationIdRaw);

try {
        const [reservations] = (await pool.query(
            "SELECT COUNT(*) AS total FROM reservations WHERE stationId = ?",
            [stationId]
        )) as [RowDataPacket[], unknown];

        if (reservations[0]?.total > 0) {
            return NextResponse.json(
                { error: "Impossible de supprimer une station avec des réservations actives. Veuillez annuler les réservations avant de supprimer la station." },
                { status: 400 }
            );
        }

        const [result] = (await pool.query(
            "DELETE FROM stations WHERE id = ?",
            [stationId]
        )) as [ResultSetHeader, unknown];

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Station non trouvée" }, { status: 404 });
        }

        return NextResponse.json({ message: "Station supprimée avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de la station:", err);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}