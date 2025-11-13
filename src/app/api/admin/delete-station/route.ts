import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { verifyToken } from "@/lib/jwt";

export async function DELETE(req: NextRequest) {
  try {
    // const token = req.cookies.get("SESSION")?.value;

    // if (!token) {
    //   return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    // }

    // const user = verifyToken(token);
    // if (!user?.id) {
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // }

    // if (!user.isAdmin) {
    //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    // }

    const body = await req.json();

    const stationId = Number(body.stationId);

    const [stationRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name FROM stations WHERE id = ? LIMIT 1",
      [stationId]
    );

    if (!stationRows || stationRows.length === 0) {
      return NextResponse.json(
        { error: "Station introuvable" },
        { status: 404 }
      );
    }

    const [reservationsRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM reservation WHERE station = ?",
      [stationId]
    );

    if (reservationsRows && reservationsRows.length > 0) {
      await pool.query("DELETE FROM reservation WHERE user_id = ?", [
        stationId,
      ]);
    }

    await pool.query("DELETE FROM stations WHERE id = ?", [stationId]);

    return NextResponse.json({
      success: true,
      message: "Station supprimée avec succès",
      status: 200,
    });
  } catch (err) {
    console.error("Erreur lors de la suppression de la station:", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
