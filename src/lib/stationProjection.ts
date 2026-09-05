/**
 * Projection d'une station vers la forme attendue par l'interface.
 *
 * Séparée de l'accès base pour être testée : elle porte une garantie que le
 * code appelant tient pour acquise — `consoles` et `consolesId` ont la même
 * longueur et le même ordre.
 */

/** Nom affiché d'un identifiant sans plateforme correspondante. */
export function orphanPlatformLabel(id: number): string {
  // Volontairement neutre : ce libellé traverse l'API, il ne peut pas être
  // traduit côté serveur. « #12 » se lit dans les deux langues et signale
  // clairement qu'il ne s'agit pas d'un vrai nom.
  return `#${id}`;
}

export function readConsolesColumn(value: unknown): number[] {
  return Array.isArray(value) ? (value as number[]) : [];
}

/**
 * Résout les identifiants en noms **sans jamais désaligner les deux tableaux**.
 *
 * L'implémentation précédente filtrait les noms introuvables, si bien qu'un
 * `console_type` supprimé disparaissait de l'affichage : la station semblait
 * proposer deux plateformes alors qu'elle en référence trois, dont une morte.
 * C'est précisément le genre de dérive que cette route est censée révéler —
 * l'écriture, elle, refuse déjà un identifiant inconnu.
 */
export function projectStationConsoles(
  consolesColumn: unknown,
  nameById: Map<number, string>,
): { consoles: string[]; consolesId: number[] } {
  const consolesId = readConsolesColumn(consolesColumn);
  return {
    consolesId,
    consoles: consolesId.map(
      (id) => nameById.get(id) ?? orphanPlatformLabel(id),
    ),
  };
}
