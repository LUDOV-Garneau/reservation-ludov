#!/usr/bin/env node
/**
 * Applique les migrations Drizzle (dossier ./drizzle) au démarrage.
 *
 * - En local : `npm run db:migrate`
 * - En production : exécuté par le conteneur avant `node server.js` (voir CMD
 *   du Dockerfile).
 *
 * IMPORTANT (une seule fois, sur une base EXISTANTE créée avant l'automatisation) :
 * la migration de base 0000 doit être marquée comme déjà appliquée dans la table
 * `__drizzle_migrations`, sinon elle serait rejouée sur une base vivante.
 * Voir README, section « Migrations ».
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

dotenv.config();

const required = ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`[migrate] Variables manquantes : ${missing.join(', ')}`);
  process.exit(1);
}

const start = Date.now();
console.log('[migrate] Application des migrations Drizzle...');

let connection;
try {
  connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
  });

  // Les migrations ne précisent pas de moteur : les CREATE TABLE utilisent
  // donc `default_storage_engine` du serveur. Sur un serveur réglé sur MyISAM,
  // 0000 échoue (clé UNIQUE varchar(255) utf8mb4 = 1020 octets > la limite
  // MyISAM de 1000) et, même en passant, les FOREIGN KEY seraient ignorées
  // en silence. Le schéma cible est InnoDB : on le force pour la session.
  await connection.query('SET SESSION default_storage_engine = InnoDB');

  const db = drizzle(connection);
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log(`[migrate] Terminé en ${Date.now() - start}ms.`);
} catch (error) {
  console.error('[migrate] Échec des migrations :', error);
  process.exit(1);
} finally {
  if (connection) await connection.end();
}
