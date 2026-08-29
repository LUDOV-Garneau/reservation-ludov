import { NextResponse } from "next/server";
import db from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { importRemoteImage, UploadError } from "@/lib/uploads";

/**
 * Met à jour l'image d'un jeu (admin) :
 * - { path } : chemin renvoyé par POST /api/admin/uploads (téléversement manuel)
 * - { url }  : lien IGDB/MobyGames, téléchargé côté serveur et stocké sur le
 *   volume local (aucun hotlink ajouté).
 * - { path: null } : retire l'image du jeu. Le fichier reste sur le volume.
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
      path?: string | null;
      url?: string;
    } | null;
    // `path: null` retire l'image ; `path` absent ET `url` absent est une
    // requête incomplète, à distinguer du retrait explicite.
    if (!body || (body.path === undefined && !body.url)) {
      return NextResponse.json(
        { success: false, error: "Champ path ou url requis." },
        { status: 400 },
      );
    }

    const existing = await db.query.games.findFirst({
      columns: { id: true },
      where: eq(games.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Jeu introuvable." },
        { status: 404 },
      );
    }

    let picture: string | null;
    if (body.path !== undefined) {
      if (body.path === null) {
        picture = null;
      } else if (
        !body.path.startsWith("/api/images/") ||
        body.path.includes("..")
      ) {
        return NextResponse.json(
          { success: false, error: "Chemin d'image invalide." },
          { status: 400 },
        );
      } else {
        picture = body.path;
      }
    } else {
      const { publicPath } = await importRemoteImage(String(body.url), "games");
      picture = publicPath;
    }

    await db.update(games).set({ picture }).where(eq(games.id, id));

    return NextResponse.json({ success: true, picture });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error("Erreur mise à jour image jeu:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour." },
      { status: 500 },
    );
  }
});
