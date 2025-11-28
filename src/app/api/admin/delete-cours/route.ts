import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

export async function DELETE(req: NextRequest) {
  try {
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

    const body = await req.json();

    const coursId = Number(body.coursId);

    const [coursRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nom_cours FROM cours WHERE id = ? LIMIT 1",
      [coursId]
    );

    if (!coursRows || coursRows.length === 0) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
    }

    const [reservationsRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM reservation WHERE cours_id = ?",
      [coursId]
    );

    if (reservationsRows && reservationsRows.length > 0) {
      await pool.query(
        "UPDATE reservation SET cours_id = NULL WHERE cours_id = ?",
        [coursId]
      );
    }

    await pool.query("DELETE FROM cours WHERE id = ?", [coursId]);
    return NextResponse.json({
      success: true,
      message: "Cours supprimé avec succès",
      status: 200,
    });
  } catch (err) {
    console.error("Erreur lors de la suppression du cours:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
