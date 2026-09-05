/** Plateforme compatible, résolue depuis le tableau JSON `accessoires.consoles`. */
export type AccessoryConsole = { id: number; name: string };

/** Ligne renvoyée par GET /api/admin/accessories. */
export type AccessoryRow = {
  id: number;
  name: string;
  /** Identifiant du catalogue Koha : c'est lui qui fait foi côté sync. */
  kohaId: number;
  hidden: boolean;
  /** Dernière écriture, telle que stockée en base (heure locale du serveur). */
  lastUpdatedAt: string | null;
  consoles: AccessoryConsole[];
};

/** Choix proposé dans le sélecteur de plateformes du dialogue et des filtres. */
export type ConsoleTypeOption = { id: number; name: string };

/** Compteurs de la barre de statistiques, dérivés de la liste chargée. */
export type AccessoryStats = {
  total: number;
  visible: number;
  hidden: number;
  withoutConsole: number;
};
