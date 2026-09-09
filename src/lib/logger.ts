/**
 * Journalisation serveur, une ligne par événement.
 *
 * Le parcours de réservation enchaîne plusieurs requêtes (hold, choix des
 * jeux, du créneau, confirmation) sur les mêmes ressources verrouillées : quand
 * un usager signale « ma console n'était plus disponible », il faut pouvoir
 * rejouer la séquence côté serveur. Chaque ligne porte donc un `reqId` propre à
 * la requête et un `holdId`/`reservationId` dès qu'il est connu : filtrer sur
 * l'un ou l'autre reconstitue le parcours.
 *
 * Le format reste `[PORTÉE] événement clé=valeur`, dans la continuité des logs
 * `[CRON]` existants, pour rester lisible dans `docker logs` et greppable sans
 * outillage. Aucune dépendance ajoutée : ces logs partent sur la sortie
 * standard, que l'hébergeur collecte déjà.
 *
 * Rien de nominatif ne doit être journalisé (courriel, nom, jeton) : on
 * enregistre des identifiants. `maskEmail` est là pour les rares cas où
 * l'adresse aide au diagnostic d'un envoi de courriel.
 */

export type LogFields = Record<string, unknown>;

const LEVELS = ["debug", "info", "warn", "error", "silent"] as const;
export type LogLevel = (typeof LEVELS)[number];

/**
 * `LOG_LEVEL` (défaut `info`) : passer à `debug` en développement pour voir le
 * détail des payloads reçus, à `warn` pour ne garder que les anomalies.
 */
function currentLevel(): LogLevel {
  const raw = String(process.env.LOG_LEVEL ?? "").toLowerCase() as LogLevel;
  return (LEVELS as readonly string[]).includes(raw) ? raw : "info";
}

function isEnabled(level: Exclude<LogLevel, "silent">): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(currentLevel());
}

/** `a@b.com` → `a***@b.com` : assez pour reconnaître une adresse, pas pour la diffuser. */
export function maskEmail(value: unknown): string {
  const email = String(value ?? "");
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

/**
 * Une valeur en `clé=valeur`, sans jamais lever.
 *
 * Un log décrit une requête, il ne doit pas la faire échouer : `JSON.stringify`
 * lève sur un BigInt ou une référence circulaire, et `String()` sur un objet
 * dont `toString` lève. Une valeur informattable devient un marqueur plutôt
 * qu'une erreur 500, et les autres champs de la ligne restent lisibles.
 */
function formatValue(value: unknown): string {
  try {
    const formatted = formatKnownValue(value);
    return formatted === undefined ? UNSERIALIZABLE : formatted;
  } catch {
    return UNSERIALIZABLE;
  }
}

/** Déjà entre guillemets : reste un seul champ dans la ligne. */
const UNSERIALIZABLE = '"<non sérialisable>"';

/** Le formatage proprement dit, appelé sous la protection de `formatValue`. */
function formatKnownValue(value: unknown): string | undefined {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v)).join(",")}]`;
  if (value instanceof Error) return JSON.stringify(value.message);
  // `JSON.stringify` rend `undefined` pour une fonction ou un symbole :
  // `formatValue` le convertit alors en marqueur.
  if (typeof value === "object") return JSON.stringify(value);
  const str = String(value);
  return /[\s="]/.test(str) || str === "" ? JSON.stringify(str) : str;
}

function formatFields(fields: LogFields): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" ");
}

export type Logger = {
  /** Identifiant corrélant toutes les lignes d'une même requête. */
  readonly reqId: string;
  /** Ajoute des champs présents sur toutes les lignes suivantes (ex. `holdId`). */
  bind(fields: LogFields): void;
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  /** L'erreur est journalisée avec sa pile, seule façon de localiser un 500. */
  error(event: string, error?: unknown, fields?: LogFields): void;
  /** Millisecondes écoulées depuis la création du logger. */
  elapsedMs(): number;
};

/**
 * Logger d'une requête.
 *
 * @param scope portée affichée entre crochets, ex. `RESERVATION:create-hold`.
 * @param fields champs présents sur toutes les lignes (ex. `userId`).
 */
export function createLogger(scope: string, fields: LogFields = {}): Logger {
  const startedAt = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);
  const bound: LogFields = { reqId, ...fields };

  function write(
    level: Exclude<LogLevel, "silent">,
    event: string,
    extra: LogFields,
  ): void {
    if (!isEnabled(level)) return;
    const line = `[${scope}] ${event} ${formatFields({ ...bound, ...extra })}`.trimEnd();
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    reqId,
    bind(extra) {
      Object.assign(bound, extra);
    },
    debug: (event, extra = {}) => write("debug", event, extra),
    info: (event, extra = {}) => write("info", event, extra),
    warn: (event, extra = {}) => write("warn", event, extra),
    error(event, error, extra = {}) {
      write("error", event, {
        ...extra,
        error: error instanceof Error ? error.message : error === undefined ? undefined : String(error),
      });
      if (error instanceof Error && error.stack && isEnabled("error")) {
        console.error(error.stack);
      }
    },
    elapsedMs: () => Date.now() - startedAt,
  };
}
