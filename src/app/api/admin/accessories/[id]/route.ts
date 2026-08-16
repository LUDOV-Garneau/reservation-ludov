import { NextResponse } from "next/server";
import db from "@/db";
import { accessoires, consoleType } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

/**
 * Mise à jour d'un accessoire (admin) : visibilité (`hidden`) et
 * mapping des plateformes compatibles (`consoles`, ids de console_type).
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

    const body = (await req.json().catch(() => null)) as {
      hidden?: boolean;
      consoles?: number[];
    } | null;
    if (!body || (body.hidden === undefined && body.consoles === undefined)) {
      return NextResponse.json(
        { success: false, error: "Aucune modification fournie." },
        { status: 400 },
      );
    }

    const existing = await db.query.accessoires.findFirst({
      columns: { id: true },
      where: eq(accessoires.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Accessoire introuvable." },
        { status: 404 },
      );
    }

    const updates: Partial<{
      hidden: number;
      consoles: number[];
      lastUpdatedAt: string;
    }> = {
      lastUpdatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    if (body.hidden !== undefined) {
      updates.hidden = body.hidden ? 1 : 0;
    }

    if (body.consoles !== undefined) {
      if (
        !Array.isArray(body.consoles) ||
        body.consoles.some((c) => !Number.isInteger(c) || c <= 0)
      ) {
        return NextResponse.json(
          { success: false, error: "Liste de plateformes invalide." },
          { status: 400 },
        );
      }
      const uniqueIds = [...new Set(body.consoles)];
      if (uniqueIds.length > 0) {
        const found = await db
          .select({ id: consoleType.id })
          .from(consoleType)
          .where(inArray(consoleType.id, uniqueIds));
        if (found.length !== uniqueIds.length) {
          return NextResponse.json(
            { success: false, error: "Plateforme inconnue dans la liste." },
            { status: 400 },
          );
        }
      }
      updates.consoles = uniqueIds;
    }

    await db.update(accessoires).set(updates).where(eq(accessoires.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur mise à jour accessoire:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour." },
      { status: 500 },
    );
  }
});
