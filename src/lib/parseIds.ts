/**
 * Lecture d'un tableau d'identifiants venu du client.
 *
 * `Number(value)` acceptait bien trop : `true` devenait 1, `[5]` devenait 5,
 * `"1e3"` devenait 1000 et `"0x10"` devenait 16. Un corps malformé agissait
 * donc en silence sur des lignes arbitraires au lieu d'être rejeté — le risque
 * n'est pas l'élévation de privilège (ces routes sont derrière `withAdmin`)
 * mais l'action groupée qui frappe à côté.
 *
 * Seuls sont retenus : un `number` entier positif sûr, ou une chaîne de
 * chiffres décimaux. Ni espaces, ni signe, ni notation scientifique, ni
 * hexadécimal.
 */
export function parseIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];

  const ids: number[] = [];
  for (const value of raw) {
    const id = toId(value);
    if (id !== null && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function toId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  // `/^\d+$/` et non `Number(...)` : c'est ce qui écarte "1e3", "0x10", " 4 "
  // et "-1" sans avoir à les énumérer.
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  return null;
}
