import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Stockage auto-hébergé des images (consoles, jeux, documentation).
 * Les fichiers vivent dans UPLOADS_DIR (volume persistant en production) et
 * sont servis par GET /api/images/[...path].
 */

export const UPLOAD_CATEGORIES = ["consoles", "games", "docs"] as const;
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo

/** Hôtes autorisés pour l'import distant (garde anti-SSRF — ne pas élargir). */
const REMOTE_IMPORT_ALLOWED_HOSTS = new Set([
  "images.igdb.com",
  "cdn.mobygames.com",
]);

type SniffedImage = { ext: string; mime: string };

export function getUploadsDir(): string {
  return path.resolve(process.env.UPLOADS_DIR || "./uploads");
}

export function isUploadCategory(value: string): value is UploadCategory {
  return (UPLOAD_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Détection du format par nombres magiques — l'extension d'origine et le
 * Content-Type déclaré ne sont jamais fiables.
 */
export function sniffImage(buffer: Buffer): SniffedImage | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  const ascii6 = buffer.subarray(0, 6).toString("ascii");
  if (ascii6 === "GIF87a" || ascii6 === "GIF89a") {
    return { ext: "gif", mime: "image/gif" };
  }
  return null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Écrit une image sur le volume et renvoie son chemin public
 * (`/api/images/<catégorie>/<fichier>`).
 */
export async function saveUpload(
  buffer: Buffer,
  category: UploadCategory,
): Promise<{ publicPath: string; filename: string }> {
  if (buffer.length === 0) throw new UploadError("Fichier vide.");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image trop volumineuse (maximum 5 Mo).", 413);
  }

  const sniffed = sniffImage(buffer);
  if (!sniffed) {
    throw new UploadError(
      "Format d'image non supporté (formats acceptés : PNG, JPEG, WebP, GIF).",
      415,
    );
  }

  const filename = `${crypto.randomUUID()}.${sniffed.ext}`;
  const dir = path.join(getUploadsDir(), category);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return { publicPath: `/api/images/${category}/${filename}`, filename };
}

/**
 * Télécharge une image distante (lien IGDB/MobyGames) et la stocke localement.
 * L'allowlist d'hôtes est stricte : garde anti-SSRF.
 */
export async function importRemoteImage(
  url: string,
  category: UploadCategory,
): Promise<{ publicPath: string; filename: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UploadError("URL invalide.");
  }

  if (parsed.protocol !== "https:") {
    throw new UploadError("Seules les URL https sont acceptées.");
  }
  if (!REMOTE_IMPORT_ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new UploadError(
      "Hôte non autorisé (liens IGDB ou MobyGames uniquement).",
    );
  }

  const response = await fetch(parsed.toString(), {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new UploadError(
      `Téléchargement impossible (HTTP ${response.status}).`,
      422,
    );
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image trop volumineuse (maximum 5 Mo).", 413);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveUpload(buffer, category);
}

/** Résout un chemin de fichier sous UPLOADS_DIR en bloquant toute traversée. */
export function resolveUploadPath(segments: string[]): string | null {
  const uploadsDir = getUploadsDir();
  const resolved = path.resolve(uploadsDir, ...segments);
  if (!resolved.startsWith(uploadsDir + path.sep)) return null;
  return resolved;
}
