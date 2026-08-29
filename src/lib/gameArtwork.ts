/**
 * Recherche de jaquettes chez les bases de données de jeux.
 *
 * À N'IMPORTER QUE DEPUIS DU CODE SERVEUR : ce module lit
 * TWITCH_CLIENT_SECRET. L'importer depuis un composant client exposerait le
 * secret dans le paquet envoyé au navigateur.
 *
 * Un fournisseur = une source. Ajouter MobyGames le jour où une clé d'API
 * existe se limite à écrire un objet `ArtworkProvider` et à l'ajouter au
 * tableau `PROVIDERS` ; rien d'autre ne bouge, ni la route, ni l'interface.
 *
 * L'URL renvoyée dans `imageUrl` doit pointer un hôte présent dans
 * l'allowlist de `lib/uploads.ts` : l'image est ensuite rapatriée sur le
 * volume local, jamais servie en hotlink.
 */

export type ArtworkSource = "igdb" | "mobygames";

export type ArtworkResult = {
  /** Identifiant stable pour React, préfixé par la source. */
  id: string;
  source: ArtworkSource;
  title: string;
  /** Année de sortie, null si la source ne la donne pas. */
  year: number | null;
  /** Plateformes, telles que nommées par la source. */
  platforms: string[];
  /** Petite image pour la grille de résultats. */
  thumbnailUrl: string;
  /** Image à importer quand l'admin choisit ce résultat. */
  imageUrl: string;
};

export interface ArtworkProvider {
  readonly source: ArtworkSource;
  /** Faux quand les identifiants manquent : la source est alors ignorée. */
  isConfigured(): boolean;
  search(query: string, limit: number): Promise<ArtworkResult[]>;
}

export class ArtworkError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502,
  ) {
    super(message);
    this.name = "ArtworkError";
  }
}

/* -------------------------------------------------------------------------- */
/* IGDB                                                                       */
/* -------------------------------------------------------------------------- */

const IGDB_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";

/** Marge avant expiration : évite d'utiliser un jeton qui expire en vol. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

type CachedToken = { value: string; expiresAt: number };

/**
 * Le jeton d'application IGDB vit plusieurs semaines : le redemander à chaque
 * frappe serait absurde. Il est mis en cache sur `globalThis` pour survivre au
 * rechargement à chaud en développement, comme le pool MySQL.
 */
const globalForIgdb = globalThis as unknown as { igdbToken?: CachedToken };

async function getIgdbToken(): Promise<string> {
  const cached = globalForIgdb.igdbToken;
  if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return cached.value;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ArtworkError("IGDB n'est pas configuré.", 503);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(IGDB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new ArtworkError(
      `Authentification IGDB impossible (HTTP ${response.status}).`,
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new ArtworkError("Réponse d'authentification IGDB inattendue.");
  }

  globalForIgdb.igdbToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

/**
 * Échappement pour le langage Apicalypse : la requête est interpolée dans une
 * chaîne entre guillemets, un guillemet non échappé la casserait.
 */
function escapeApicalypse(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

type IgdbGame = {
  id: number;
  name?: string;
  first_release_date?: number;
  cover?: { image_id?: string };
  platforms?: { name?: string; abbreviation?: string }[];
};

/**
 * URL d'une jaquette IGDB.
 *
 * Le segment `image` du chemin n'est pas optionnel : sans lui, IGDB répond 404.
 * `t_cover_small` (90×128) suffit pour la grille de résultats ; `t_cover_big_2x`
 * (528×748, ~34 Ko) est la plus grande taille au cadrage de jaquette — les
 * variantes `t_720p`/`t_1080p` sont faites pour les captures d'écran et
 * changent le rapport d'image.
 */
function igdbCoverUrl(imageId: string, size: "small" | "big"): string {
  const token = size === "small" ? "t_cover_small" : "t_cover_big_2x";
  return `https://images.igdb.com/igdb/image/upload/${token}/${imageId}.jpg`;
}

const igdbProvider: ArtworkProvider = {
  source: "igdb",

  isConfigured() {
    return Boolean(
      process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET,
    );
  },

  async search(query, limit) {
    const token = await getIgdbToken();

    // `where cover != null` : un résultat sans jaquette n'a aucun intérêt ici.
    // `sort` est interdit en présence de `search`, l'ordre est celui d'IGDB.
    const body = [
      `search "${escapeApicalypse(query)}";`,
      "fields name,first_release_date,cover.image_id,platforms.name,platforms.abbreviation;",
      "where cover != null;",
      `limit ${limit};`,
    ].join(" ");

    const response = await fetch(IGDB_GAMES_URL, {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID as string,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "text/plain",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 401) {
      // Jeton révoqué avant son expiration annoncée : on le jette pour que la
      // prochaine recherche en redemande un.
      globalForIgdb.igdbToken = undefined;
      throw new ArtworkError("Session IGDB expirée, réessayez.", 503);
    }
    if (response.status === 429) {
      throw new ArtworkError("Trop de requêtes vers IGDB, réessayez.", 429);
    }
    if (!response.ok) {
      throw new ArtworkError(`Recherche IGDB impossible (HTTP ${response.status}).`);
    }

    const rows = (await response.json()) as IgdbGame[];
    if (!Array.isArray(rows)) return [];

    return rows.flatMap((row) => {
      const imageId = row.cover?.image_id;
      if (!imageId || !row.name) return [];
      return [
        {
          id: `igdb:${row.id}`,
          source: "igdb" as const,
          title: row.name,
          year: row.first_release_date
            ? new Date(row.first_release_date * 1000).getUTCFullYear()
            : null,
          platforms: (row.platforms ?? [])
            .map((platform) => platform.abbreviation || platform.name || "")
            .filter(Boolean),
          thumbnailUrl: igdbCoverUrl(imageId, "small"),
          imageUrl: igdbCoverUrl(imageId, "big"),
        },
      ];
    });
  },
};

/* -------------------------------------------------------------------------- */
/* Registre                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Sources interrogées, dans l'ordre d'affichage.
 *
 * MobyGames viendra ici : son API réclame une clé (`MOBYGAMES_API_KEY`) et
 * limite à une requête par seconde. `cdn.mobygames.com` est déjà dans
 * l'allowlist de téléchargement, il n'y aura donc rien à changer à l'import.
 */
const PROVIDERS: ArtworkProvider[] = [igdbProvider];

export type ArtworkSearchOutcome = {
  results: ArtworkResult[];
  /** Sources dont la recherche a échoué ; les autres résultats restent servis. */
  failedSources: ArtworkSource[];
  /** Vrai quand aucune source n'a d'identifiants configurés. */
  noSourceConfigured: boolean;
};

/**
 * Interroge toutes les sources configurées en parallèle. L'échec d'une source
 * n'annule pas les autres : mieux vaut une liste partielle qu'une erreur sèche.
 */
export async function searchArtwork(
  query: string,
  limit = 12,
): Promise<ArtworkSearchOutcome> {
  const configured = PROVIDERS.filter((provider) => provider.isConfigured());
  if (configured.length === 0) {
    return { results: [], failedSources: [], noSourceConfigured: true };
  }

  const settled = await Promise.allSettled(
    configured.map((provider) => provider.search(query, limit)),
  );

  const results: ArtworkResult[] = [];
  const failedSources: ArtworkSource[] = [];

  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
    } else {
      failedSources.push(configured[index].source);
      console.error(
        `Recherche de jaquettes (${configured[index].source}) :`,
        outcome.reason,
      );
    }
  });

  return { results, failedSources, noSourceConfigured: false };
}
