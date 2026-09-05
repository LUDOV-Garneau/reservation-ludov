import type {
  AccessoriesFiltersState,
  AccessoriesSort,
  SortDirection,
} from "@/hooks/useAccessoriesFilters";
import type {
  AccessoryRow,
  AccessoryStats,
} from "@/components/admin/accessoires/types";

/**
 * Filtrage, tri et comptes de l'onglet Accessoires.
 *
 * `accessoires` compte quelques centaines de lignes : la liste entière est
 * chargée puis travaillée ici, sans pagination serveur ni aller-retour à
 * chaque frappe. Ces fonctions sont pures pour rester testables sans rendu ni
 * réseau.
 */

export type AccessoryFilterInput = Pick<
  AccessoriesFiltersState,
  "search" | "platform" | "visibility"
>;

export function matchesPlatformFilter(
  accessory: AccessoryRow,
  platform: AccessoryFilterInput["platform"],
): boolean {
  if (platform === "all") return true;
  if (platform === "none") return accessory.consoles.length === 0;
  return accessory.consoles.some((console) => console.id === platform);
}

export function matchesVisibilityFilter(
  accessory: AccessoryRow,
  visibility: AccessoryFilterInput["visibility"],
): boolean {
  if (visibility === "visible") return !accessory.hidden;
  if (visibility === "hidden") return accessory.hidden;
  return true;
}

export function filterAccessories(
  accessories: AccessoryRow[],
  filters: AccessoryFilterInput,
): AccessoryRow[] {
  const needle = filters.search.trim().toLowerCase();

  return accessories.filter((accessory) => {
    if (!matchesPlatformFilter(accessory, filters.platform)) return false;
    if (!matchesVisibilityFilter(accessory, filters.visibility)) return false;
    if (needle === "") return true;
    // L'ID Koha est cherché aussi : c'est la référence que le personnel a sous
    // les yeux dans le catalogue quand il vient corriger une ligne ici.
    return (
      accessory.name.toLowerCase().includes(needle) ||
      String(accessory.kohaId).includes(needle) ||
      accessory.consoles.some((console) =>
        console.name.toLowerCase().includes(needle),
      )
    );
  });
}

/** Comparaison de noms : accents et casse ignorés, chiffres lus comme tels. */
const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

function compareBySort(
  a: AccessoryRow,
  b: AccessoryRow,
  sort: AccessoriesSort,
): number {
  switch (sort) {
    case "koha":
      return a.kohaId - b.kohaId;
    case "consoles":
      return a.consoles.length - b.consoles.length;
    case "visibility":
      // Visibles d'abord en ascendant : c'est l'état « normal » d'un accessoire.
      return Number(a.hidden) - Number(b.hidden);
    case "name":
    default:
      return collator.compare(a.name, b.name);
  }
}

/**
 * Tri stable et total : les ex æquo sur la clé demandée sont départagés par
 * le nom, puis par l'id, pour que deux rendus successifs donnent le même ordre.
 */
export function sortAccessories(
  accessories: AccessoryRow[],
  sort: AccessoriesSort,
  dir: SortDirection,
): AccessoryRow[] {
  const factor = dir === "desc" ? -1 : 1;

  return [...accessories].sort((a, b) => {
    const primary = compareBySort(a, b, sort);
    if (primary !== 0) return primary * factor;
    if (sort !== "name") {
      const byName = collator.compare(a.name, b.name);
      if (byName !== 0) return byName;
    }
    return a.id - b.id;
  });
}

/** Les statistiques portent sur la liste complète, pas sur le filtre courant. */
export function computeStats(accessories: AccessoryRow[]): AccessoryStats {
  let hidden = 0;
  let withoutConsole = 0;

  for (const accessory of accessories) {
    if (accessory.hidden) hidden += 1;
    if (accessory.consoles.length === 0) withoutConsole += 1;
  }

  return {
    total: accessories.length,
    visible: accessories.length - hidden,
    hidden,
    withoutConsole,
  };
}

/**
 * Applique un changement de plateformes à une ligne, du même mouvement que le
 * serveur. Utilisé pour recalculer l'état local après une action groupée sans
 * refaire un aller-retour complet.
 */
export function applyConsoleMode(
  current: number[],
  mode: "set" | "add" | "remove",
  ids: number[],
): number[] {
  if (mode === "set") return [...new Set(ids)];
  if (mode === "add") return [...new Set([...current, ...ids])];
  const removed = new Set(ids);
  return current.filter((id) => !removed.has(id));
}
