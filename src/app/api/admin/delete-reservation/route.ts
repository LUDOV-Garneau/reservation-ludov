import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

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
    const idParam = searchParams.get("id");
    console.log("Received DELETE request for reservation id:", idParam);

    if (!idParam) {
      return NextResponse.json(
        { error: "Missing reservation id" },
        { status: 400 }
      );
    }
    const id = idParam;

    const [result] = await pool.query(
      "DELETE FROM reservation WHERE id = ?",
      [id]
    );

    const okPacket = result as { affectedRows?: number };

    if (!okPacket.affectedRows) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression" },
      { status: 500 }
    );
  }
}
