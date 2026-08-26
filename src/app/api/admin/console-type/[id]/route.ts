import { NextResponse } from "next/server";
import db from "@/db";
import { consoleType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

/** Chemin local (/api/images/...) ou URL https héritée (IGDB/MobyGames). */
function isValidPicture(value: string): boolean {
  if (value.startsWith("/api/images/") && !value.includes("..")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const PATCH = withAdmin<{ id: string }>(async (req, _admin, params) => {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide." },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      picture?: string | null;
    } | null;
    if (!body || body.picture === undefined) {
      return NextResponse.json(
        { success: false, error: "Champ picture manquant." },
        { status: 400 },
      );
    }

    if (body.picture !== null && !isValidPicture(body.picture)) {
      return NextResponse.json(
        { success: false, error: "Chemin d'image invalide." },
        { status: 400 },
      );
    }

    const existing = await db.query.consoleType.findFirst({
      columns: { id: true },
      where: eq(consoleType.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Plateforme introuvable." },
        { status: 404 },
      );
    }

    await db
      .update(consoleType)
      .set({ picture: body.picture })
      .where(eq(consoleType.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur mise à jour photo console:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour." },
      { status: 500 },
    );
  }
});
