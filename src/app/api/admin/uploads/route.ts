import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import {
  saveUpload,
  importRemoteImage,
  isUploadCategory,
  UploadError,
} from "@/lib/uploads";

/**
 * Téléversement d'images (admin).
 * FormData : `category` (consoles|games|docs) + `file` (fichier) OU `url`
 * (lien IGDB/MobyGames importé côté serveur).
 * Réponse : { success, path } où path = /api/images/<catégorie>/<fichier>.
 */
export const POST = withAdmin(async (req) => {
  try {
    const formData = await req.formData();

    const category = String(formData.get("category") ?? "");
    if (!isUploadCategory(category)) {
      return NextResponse.json(
        { success: false, error: "Catégorie invalide." },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    const url = formData.get("url");

    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { publicPath } = await saveUpload(buffer, category);
      return NextResponse.json({ success: true, path: publicPath });
    }

    if (typeof url === "string" && url.trim()) {
      const { publicPath } = await importRemoteImage(url.trim(), category);
      return NextResponse.json({ success: true, path: publicPath });
    }

    return NextResponse.json(
      { success: false, error: "Fichier ou URL manquant." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    console.error("Erreur téléversement:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du téléversement." },
      { status: 500 },
    );
  }
});
