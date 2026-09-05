/** Une station telle que la renvoie `GET /api/admin/stations`. */
export type Station = {
  id: number;
  name: string;
  /** Noms des plateformes, résolus par l'API. */
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
