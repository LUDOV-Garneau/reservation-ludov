import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import * as relations from "./relations";

/**
 * En développement, le rechargement à chaud réévalue ce module à chaque
 * modification : sans ce cache, un nouveau pool (10 connexions) est créé à
 * chaque fois et l'ancien reste ouvert, jusqu'à saturer MySQL
 * (« Too many connections »). En production, le module est instancié une fois
 * par bundle : voir la note sous `pool`.
 */
const globalForDb = globalThis as unknown as { ludovPool?: mysql.Pool };

const pool =
  globalForDb.ludovPool ??
  mysql.createPool({
    host: process.env.DATABASE_HOST!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    port: parseInt(process.env.DATABASE_PORT ?? "3306"),
    waitForConnections: true,
    connectionLimit: 10,
  });

// Le cache est également nécessaire en production : Next.js bundle le
// middleware séparément des routes, et sans lui ce second bundle ouvrirait son
// propre pool de 10 connexions pour la vérification de session.
globalForDb.ludovPool = pool;

const db = drizzle(pool, { schema: { ...schema, ...relations }, mode: "default" });

/**
 * Lignes d'un `db.execute(sql\`...\`)`.
 *
 * Le pilote mysql2 renvoie la réponse brute `[lignes, colonnes]` : lire
 * directement le résultat donne le tableau des colonnes en deuxième élément et
 * `result[0]` n'est pas une ligne mais le tableau des lignes. Ce helper évite
 * de retomber dans le piège à chaque requête SQL brute (les `SELECT ... FOR
 * UPDATE`, non supportés par le query builder).
 */
export function executeRows<T>(result: unknown): T[] {
  if (!Array.isArray(result)) return [];
  const [rows] = result as [unknown, unknown];
  return Array.isArray(rows) ? (rows as T[]) : [];
}

/**
 * Identifiant auto-incrémenté d'un `INSERT`.
 *
 * `$returningId()` renvoie un tableau vide quand la clé primaire est déclarée
 * par le helper `primaryKey()` plutôt que sur la colonne : on lit donc
 * `insertId` dans la réponse du pilote (`[ResultSetHeader, champs]`).
 */
export function insertedId(result: unknown): number {
  if (!Array.isArray(result)) return 0;
  const [header] = result as [{ insertId?: number }, unknown];
  return Number(header?.insertId ?? 0);
}

export default db;
