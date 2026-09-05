import { NextResponse } from "next/server";
import db from "@/db";
import { consoleType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { parsePlatformPatch } from "@/lib/platformUpdate";

/**
 * Mise à jour d'une plateforme par l'admin : photo et description.
 *
 * Le nom n'est pas modifiable — il vient du catalogue Koha, que la synchro
 * nocturne réapplique. Le refus est prononcé ici, pas seulement en masquant le
 * champ dans l'interface. Voir `src/lib/platformUpdate.ts` pour la validation.
 */
export const PATCH = withAdmin<{ id: string }>(async (req, _admin, params) => {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide." },
        { status: 400 },
      );
    }

    const parsed = parsePlatformPatch(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
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

    await db.update(consoleType).set(parsed.patch).where(eq(consoleType.id, id));

    return NextResponse.json({ success: true, platform: { id, ...parsed.patch } });
  } catch (error) {
    console.error("Erreur mise à jour plateforme:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour." },
      { status: 500 },
    );
  }
});
