import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function PUT(req: NextRequest) {
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
    const { name, stationId, consoles, isActive } = body;

    if (!name || name.trim() === "") {
      console.error("Nom de la station manquant ou vide.");
      return NextResponse.json(
        { error: "Le nom de la station est requis." },
        { status: 400 }
      );
    }

    if (!stationId) {
      console.error("id de la station manquant ou vide.");
      return NextResponse.json(
        { error: "L'identifiant de la station est requis." },
        { status: 400 }
      );
    }

    if (!Array.isArray(consoles) || consoles.length === 0) {
      console.error("aucune plateforme fournie pour la station.");
      return NextResponse.json(
        { error: "Aucune plateforme fournie pour la station." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean" || isActive === null) {
      console.error("status actif de la station manquant ou invalide.");
      return NextResponse.json(
        { error: "Le statut actif de la station est requis." },
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
        UPDATE stations SET name = ?, consoles = ?, isActive = ?, lastUpdatedAt = ?
        WHERE id = ?
        `,
        [name, JSON.stringify(consoles), isActive, now, stationId]
      );
      conn.release();

      return NextResponse.json(
        { success: true, message: "Station modifiée avec succès." },
        { status: 200 }
      );
    } catch (err) {
      conn.release();
      console.error("Erreur lors de la modification :", err);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
