/**
 * Lecture du corps de `PATCH /api/admin/console-type/[id]`.
 *
 * Isolée de la route pour être testable sans requête HTTP ni base : la route
 * ne garde que l'accès aux données et le code de statut.
 */

export const MAX_DESCRIPTION_LENGTH = 2000;

/** Champs qu'un administrateur peut écrire sur une plateforme. */
export type PlatformPatch = {
  picture?: string | null;
  description?: string | null;
};

export type ParsedPatch =
  | { ok: true; patch: PlatformPatch }
  | { ok: false; error: string };

/** Chemin local (/api/images/...) ou URL https héritée (IGDB/MobyGames). */
export function isValidPicture(value: string): boolean {
  if (value.startsWith("/api/images/") && !value.includes("..")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function parsePlatformPatch(body: unknown): ParsedPatch {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Corps de requête invalide." };
  }

  const input = body as Record<string, unknown>;

  // Le nom vient de Koha et la synchro nocturne le réécrit : l'accepter ici
  // donnerait une modification qui disparaît toute seule pendant la nuit.
  if ("name" in input) {
    return {
      ok: false,
      error:
        "Le nom d'une plateforme provient du catalogue Koha et ne peut pas être modifié ici.",
    };
  }

  const patch: PlatformPatch = {};

  if ("picture" in input) {
    const picture = input.picture;
    if (picture === null) {
      patch.picture = null;
    } else if (typeof picture === "string" && isValidPicture(picture)) {
      patch.picture = picture;
    } else {
      return { ok: false, error: "Chemin d'image invalide." };
    }
  }

  if ("description" in input) {
    const description = input.description;
    if (description === null) {
      patch.description = null;
    } else if (typeof description === "string") {
      const trimmed = description.trim();
      if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
        return {
          ok: false,
          error: `La description est limitée à ${MAX_DESCRIPTION_LENGTH} caractères.`,
        };
      }
      // Une description vidée par l'admin est un retrait, pas une chaîne vide :
      // l'affichage n'a alors qu'un seul cas d'absence à traiter.
      patch.description = trimmed === "" ? null : trimmed;
    } else {
      return { ok: false, error: "Description invalide." };
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Aucun champ modifiable fourni." };
  }

  return { ok: true, patch };
}
