import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { resolveUploadPath } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Sert les images téléversées depuis le volume UPLOADS_DIR.
 * Route publique : les visuels de jeux/consoles sont affichés aux usagers.
 * Les noms de fichiers sont des UUID uniques → cache immuable.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParams } = await params;

  const filePath = resolveUploadPath(pathParams);
  if (!filePath) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    console.error("Error serving uploaded image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
