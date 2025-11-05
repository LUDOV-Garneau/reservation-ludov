import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("SESSION");
        let user = null;

        try {
            const token = sessionCookie?.value;
            if (token) user = verifyToken(token);
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid or expired token" },
                { status: 401 }
            );
        }
        if (!user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
        if (!user?.isAdmin) {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const userIdParams = searchParams.get("userId");

        if (!userIdParams) {
            return NextResponse.json(
                { message: "L'ID utilisateur est requis" },
                { status: 400 }
            );
        }

        const userId = parseInt(userIdParams, 10);
        if (isNaN(userId) || userId <= 0) {
            return NextResponse.json(
                { message: "ID utilisateur invalide" },
                { status: 400 }
            );
        }

        if (userId === user.id) {
            return NextResponse.json(
                { message: "Vous ne pouvez pas supprimer votre propre compte" },
                { status: 400 }
            );
        }

        try {

            const [rows] = await pool.query(
                "SELECT id FROM reservation WHERE user_id = ?",
                [userId]
            );

            if ((rows as any[]).length > 0) {
                return NextResponse.json(
                    { message: "L'utilisateur a des réservations actives et ne peut pas être supprimé." },
                    { status: 400 }
                );
            }

            const [result] = (await pool.query(
                "DELETE FROM users WHERE id = ?",
                [userId]
            )) as [ResultSetHeader, unknown];

            if (result.affectedRows === 0) {
                return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
            }

            return NextResponse.json({ message: "Utilisateur supprimé avec succès." });
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }
    } catch (error) {
        console.error("Erreur lors du traitement de la requête:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
