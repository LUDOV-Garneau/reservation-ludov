/**
 * Lecture du corps de `POST /api/admin/stations` et
 * `PATCH /api/admin/stations/[id]`.
 *
 * Module pur, testé sans base : il dit ce que le corps contient de valide, ou
 * pourquoi il ne l'est pas. Les vérifications qui demandent la base — unicité
 * du nom, existence des plateformes — restent dans la route.
 */

import { toPositiveId } from "@/lib/parseIds";

export const STATION_NAME_MAX_LENGTH = 255;

export type StationPayload = {
  name: string;
  consoles: number[];
};

export type StationPayloadResult =
  | { ok: true; value: StationPayload }
  | { ok: false; error: StationPayloadError };

export type StationPayloadError =
  | "name_required"
  | "name_too_long"
  | "consoles_required"
  | "consoles_invalid"
  | "empty_patch";

/** Modification partielle : chaque champ est facultatif, mais validé s'il est là. */
export type StationPatch = {
  name?: string;
  consoles?: number[];
  isActive?: boolean;
};

export type StationPatchResult =
  | { ok: true; value: StationPatch }
  | { ok: false; error: StationPayloadError };

function readName(raw: unknown): { ok: true; value: string } | { ok: false; error: StationPayloadError } {
  if (typeof raw !== "string") return { ok: false, error: "name_required" };

  const name = raw.trim();
  if (name === "") return { ok: false, error: "name_required" };
  if (name.length > STATION_NAME_MAX_LENGTH)
    return { ok: false, error: "name_too_long" };

  return { ok: true, value: name };
}

/**
 * Le tableau est dédoublonné et ordonné : la même station décrite deux fois de
 * la même façon donne la même colonne `json`, ce qui rend les comparaisons et
 * les diffs lisibles.
 */
function readConsoles(
  raw: unknown,
): { ok: true; value: number[] } | { ok: false; error: StationPayloadError } {
  if (!Array.isArray(raw) || raw.length === 0)
    return { ok: false, error: "consoles_required" };

  const ids: number[] = [];
  for (const entry of raw) {
    // `toPositiveId` et non `Number(entry)` : ce dernier acceptait `true`
    // comme la plateforme 1, `[5]` comme la 5, et `"0x10"` comme la 16.
    const id = toPositiveId(entry);
    if (id === null) return { ok: false, error: "consoles_invalid" };
    if (!ids.includes(id)) ids.push(id);
  }

  return { ok: true, value: ids.sort((a, b) => a - b) };
}

/**
 * Corps d'un `POST`. Nom et plateformes sont obligatoires ; `isActive` n'est
 * pas accepté, une station naissant active. La modification passe par
 * `readStationPatch`.
 */
export function readStationPayload(body: unknown): StationPayloadResult {
  const raw = (body ?? {}) as Record<string, unknown>;

  const name = readName(raw.name);
  if (!name.ok) return { ok: false, error: name.error };

  const consoles = readConsoles(raw.consoles);
  if (!consoles.ok) return { ok: false, error: consoles.error };

  return { ok: true, value: { name: name.value, consoles: consoles.value } };
}

/**
 * Corps d'un `PATCH`. Contrairement au `POST`, aucun champ n'est obligatoire :
 * désactiver une station ne doit pas obliger à renvoyer son nom et ses
 * plateformes. Exiger le corps complet rendait d'ailleurs indésactivable une
 * station sans plateforme — précisément le cas où on veut la retirer du
 * parcours.
 */
export function readStationPatch(body: unknown): StationPatchResult {
  const raw = (body ?? {}) as Record<string, unknown>;
  const patch: StationPatch = {};

  if ("name" in raw) {
    const name = readName(raw.name);
    if (!name.ok) return { ok: false, error: name.error };
    patch.name = name.value;
  }

  if ("consoles" in raw) {
    const consoles = readConsoles(raw.consoles);
    if (!consoles.ok) return { ok: false, error: consoles.error };
    patch.consoles = consoles.value;
  }

  if (typeof raw.isActive === "boolean") {
    patch.isActive = raw.isActive;
  }

  // Un PATCH qui ne demande rien est une erreur d'appel, pas une réussite
  // silencieuse : sans ce garde-fou il ne ferait que toucher `lastUpdatedAt`.
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "empty_patch" };
  }

  return { ok: true, value: patch };
}

/** Message d'erreur i18n correspondant, à renvoyer tel quel par la route. */
export const STATION_PAYLOAD_MESSAGES: Record<StationPayloadError, string> = {
  name_required: "Le nom de la station est requis.",
  name_too_long: `Le nom de la station dépasse ${STATION_NAME_MAX_LENGTH} caractères.`,
  consoles_required: "Au moins une plateforme est requise.",
  consoles_invalid: "Identifiant de plateforme invalide.",
  empty_patch: "Aucune modification fournie.",
};
