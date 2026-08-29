/** Ligne de jeu telle que renvoyée par GET /api/admin/games. */
export type GameRow = {
  id: number;
  titre: string;
  author: string | null;
  platform: string | null;
  picture: string | null;
  biblioId: number;
  consoleTypeId: number | null;
  /** Nom du type de console rattaché, null si le jeu n'en a pas. */
  consoleName: string | null;
};

/** Option de menu déroulant (types de console, stations). */
export type FilterOption = {
  id: number;
  name: string;
};

/** Nom de console à afficher : le type rattaché, sinon le texte libre hérité. */
export function displayConsole(game: GameRow): string {
  return game.consoleName || game.platform || "-";
}
