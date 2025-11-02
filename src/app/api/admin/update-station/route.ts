import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { stationId, consoles } = body;
    if (!stationId) {
      return NextResponse.json(
        { error: "Aucun identifiant de station donné." },
        { status: 400 }
      );
    }

    if (!Array.isArray(consoles) || consoles.length === 0) {
      return NextResponse.json(
        { error: "Aucune plateforme fournie pour la station." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    const [stations] = await conn.query(
      `
      SELECT * FROM stations WHERE id = ?
        `,
      [stationId]
    );

    if (!Array.isArray(stations) || stations.length === 0) {
      conn.release();
      return NextResponse.json(
        { error: "Aucune station trouvée avec cet id." },
        { status: 404 }
      );
    }

    const now = new Date();
    try {
      await conn.query(
        `
        UPDATE stations SET consoles = ?, updateAt = ?
        WHERE id = ?
        `,
        [JSON.stringify(consoles), now, stationId]
      );
      conn.release();

      return NextResponse.json(
        { success: true, message: "Station modifiée avec succès." },
        { status: 200 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de l'insertion :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
