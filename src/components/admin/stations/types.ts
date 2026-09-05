/** Une station telle que la renvoie `GET /api/admin/stations`. */
export type Station = {
  id: number;
  name: string;
  /**
   * Noms des plateformes, résolus par l'API. **Même longueur et même ordre que
   * `consolesId`** : un identifiant sans plateforme correspondante apparaît en
   * « #<id> » plutôt que d'être retiré, sinon une plateforme supprimée
   * disparaîtrait de l'écran sans que personne ne le remarque.
   */
  consoles: string[];
  /** Identifiants correspondants, dans le même ordre. */
  consolesId: number[];
  isActive: boolean;
  createdAt: string;
};

/** Une plateforme proposable, telle que la renvoie `GET /api/admin/console-type`. */
export type ConsoleTypeOption = {
  id: number;
  name: string;
};

export type StationStats = {
  active: number;
  inactive: number;
  mostUsed: string | null;
};
