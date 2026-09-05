/**
 * Résolution de l'onglet de l'admin depuis `?tab=`.
 *
 * L'onglet « Plateformes » s'est longtemps appelé `consolePhotos`, du temps où
 * il ne servait qu'aux photos. Les liens déjà partagés portent encore cette
 * valeur : elle est traduite ici plutôt que dupliquée dans le rendu, pour que
 * la barre d'onglets et le contenu s'accordent toujours sur le même nom.
 */

export const DEFAULT_ADMIN_TAB = "users";

const TAB_ALIASES: Record<string, string> = {
  consolePhotos: "platforms",
};

export function normalizeAdminTab(value: string | null | undefined): string {
  if (!value) return DEFAULT_ADMIN_TAB;
  return TAB_ALIASES[value] ?? value;
}
