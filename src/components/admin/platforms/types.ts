/** Ligne renvoyée par GET /api/admin/console-type?stats=1. */
export type PlatformRow = {
  id: number;
  name: string;
  picture: string | null;
  description: string | null;
  /** Exemplaires physiques rattachés (console_stock), toutes situations. */
  unitsTotal: number;
  /** Exemplaires réservables : actifs et présents au LUDOV. */
  unitsActive: number;
  /** Jeux rattachés à la plateforme. */
  gamesCount: number;
  /** Stations **actives** qui proposent la plateforme. */
  stationsCount: number;
};

/** Compteurs de la barre de statistiques, dérivés de la liste chargée. */
export type PlatformStats = {
  total: number;
  withPhoto: number;
  withoutPhoto: number;
  unbookable: number;
};
