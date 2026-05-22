import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import type { ResultSetHeader } from "mysql2";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, reason } = body as { id: string; reason: string };

    if (!id) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 422 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "La raison d'annulation est obligatoire." },
        { status: 422 },
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE reservation SET archived = 1, cancellation_reason = ? WHERE id = ?",
      [reason, id],
    );

    console.log("ID reçu:", JSON.stringify(id));
    console.log("RESULT:", result);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Réservation introuvable ou déjà annulée" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Réservation annulée avec succès." },
      { status: 200 },
    );
  } catch (error) {
    console.error("ERREUR PATCH RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la réservation." },
      { status: 500 },
    );
  }
}
