import type { PhotoFilter, PlatformsFiltersState } from "@/hooks/usePlatformsFilters";
import type { PlatformRow, PlatformStats } from "@/components/admin/platforms/types";

/**
 * Filtrage et comptes de l'onglet Plateformes.
 *
 * `console_type` compte quelques dizaines de lignes : la liste entière est
 * chargée puis travaillée ici, sans pagination ni aller-retour serveur. Ces
 * fonctions sont pures pour rester testables sans rendu ni réseau.
 */

/**
 * Une plateforme est réservable si le parcours peut la proposer : il lui faut
 * au moins un exemplaire libre **et** au moins une station active qui la
 * porte. Les deux conditions viennent de `calendar-times` / `availability`.
 */
export function isBookable(platform: PlatformRow): boolean {
  return platform.unitsActive > 0 && platform.stationsCount > 0;
}

export function matchesPhotoFilter(
  platform: PlatformRow,
  photo: PhotoFilter,
): boolean {
  if (photo === "yes") return platform.picture !== null;
  if (photo === "no") return platform.picture === null;
  return true;
}

export function filterPlatforms(
  platforms: PlatformRow[],
  filters: Pick<PlatformsFiltersState, "search" | "photo">,
): PlatformRow[] {
  const needle = filters.search.trim().toLowerCase();

  return platforms.filter((platform) => {
    if (!matchesPhotoFilter(platform, filters.photo)) return false;
    if (needle === "") return true;
    // La description est cherchée aussi : c'est le seul texte libre que
    // l'admin saisit, et le seul endroit où retrouver une note interne.
    return (
      platform.name.toLowerCase().includes(needle) ||
      (platform.description ?? "").toLowerCase().includes(needle)
    );
  });
}

/** Les statistiques portent sur la liste complète, pas sur le filtre courant. */
export function computeStats(platforms: PlatformRow[]): PlatformStats {
  let withPhoto = 0;
  let unbookable = 0;

  for (const platform of platforms) {
    if (platform.picture !== null) withPhoto += 1;
    if (!isBookable(platform)) unbookable += 1;
  }

  return {
    total: platforms.length,
    withPhoto,
    withoutPhoto: platforms.length - withPhoto,
    unbookable,
  };
}
