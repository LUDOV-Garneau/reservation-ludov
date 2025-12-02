import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import type { RowDataPacket } from "mysql2";

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idString = searchParams.get("id");

    if (!idString) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 400 }
      );
    }

    const idReservation = idString;

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM reservation WHERE id = ?",
      [idReservation]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    await pool.query("UPDATE reservation SET archived = 1 WHERE id = ?", [
      idReservation,
    ]);

    return NextResponse.json(
      { message: "Reservation supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERREUR DELETE RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation." },
      { status: 500 }
    );
  }
}
