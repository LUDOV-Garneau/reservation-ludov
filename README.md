# Ludov Réservation

> Module de réservation pour les laboratoires de **LUDOV**  
> Projet académique réalisé dans le cadre du cours Projet Intégrateur du Cégep Garneau.  

---

## Aperçu du projet
Ludov Réservation est une plateforme web permettant de gérer efficacement la réservation des laboratoires du LUDOV.  
Le but est de fournir une interface moderne, intuitive et rapide pour les utilisateurs tout en assurant une gestion simplifiée côté administrateur.  

---

## Équipe de développement

| Membre                                    |
|-------------------------------------------|
| **Xavier Samson**                         |
| **Félix-Antoine Leduc (TEAM LEAD)**       |
| **Samuel Dussault-Gagnon**                |
| **Fabio Mora Gonzalez**                   |
| **Jorge Andres Solano Orrego**            |

---

## Technologies utilisées

- **Frontend** : [Next.js](https://nextjs.org/) + [React](https://react.dev/)
- **Backend** : API Node.js / Next.js  
- **Base de données** : [MySQL](https://www.mysql.com/) 
- **Hébergement** : VPS [Hostinger](https://www.hostinger.com/) sous **Debian**

---

## Fonctionnalités principales
- Réservation en ligne des laboratoires LUDOV  
- Interface moderne et responsive  
- Authentification et gestion des utilisateurs  
- Vue administrateur pour la gestion des réservations  
- Persistance des données via MySQL  

---

## Migrations de base de données

Les migrations Drizzle vivent dans `drizzle/` et sont appliquées
**automatiquement au démarrage du conteneur** (`scripts/migrate.js`, voir le
`CMD` du Dockerfile).

- Générer une migration après un changement de `src/db/schema.ts` :
  `npm run db:generate`
- Appliquer les migrations en local : `npm run db:migrate`

### Construire une base vierge

`npm run db:migrate` suffit à construire le schéma complet à partir de rien :
les migrations créent les 17 tables, la vue `console_catalog`, les clés
étrangères et les index, puis insèrent les données de référence (gabarits de
courriels, tutoriels, lignes `policies`). Il ne reste qu'à créer la base vide :

```bash
mysql -u root -p -e "CREATE DATABASE ludov_dev CHARACTER SET utf8mb4"
```

Le schéma cible est **InnoDB** (clés étrangères, clés uniques utf8mb4 longues).
Les migrations ne précisant pas de moteur, `scripts/migrate.js` force
`default_storage_engine = InnoDB` pour sa session : sur un serveur MySQL réglé
sur MyISAM, `0000` échouerait sinon avec `ER_TOO_LONG_KEY` et les clés
étrangères seraient ignorées en silence.

⚠️ Le DDL MySQL n'est pas transactionnel : si une migration échoue en cours de
route, la base reste à moitié construite. Sur une base de développement,
repartir d'un `DROP DATABASE` plutôt que de relancer par-dessus.

⚠️ **Étape unique avant le premier déploiement automatisé** : sur une base de
données existante (créée avant l'automatisation), la migration de base
`0000_sparkling_skreet` doit être marquée comme déjà appliquée, sinon elle
serait rejouée sur une base vivante :

```sql
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  `id` SERIAL PRIMARY KEY,
  `hash` text NOT NULL,
  `created_at` bigint
);
-- hash = SHA-256 du fichier drizzle/0000_sparkling_skreet.sql ;
-- created_at = valeur "when" de drizzle/meta/_journal.json
INSERT INTO `__drizzle_migrations` (`hash`, `created_at`)
SELECT SHA2(LOAD_FILE('/chemin/vers/0000_sparkling_skreet.sql'), 256), 1779485598155
WHERE NOT EXISTS (SELECT 1 FROM `__drizzle_migrations`);
```

(Le plus simple reste d'exécuter `npm run db:migrate` une première fois depuis
un poste local pointant vers la base de production **fraîchement synchronisée
avec le schéma actuel**, puis de vérifier la table `__drizzle_migrations`.)

## Images téléversées (volume persistant)

Les images (consoles, jeux, documentation) sont stockées sur le disque du VPS
et servies par `/api/images/...`. En production, monter un volume persistant :

```yaml
# docker-compose.yml (sur le VPS) : service web
volumes:
  - ./uploads:/app/uploads
environment:
  - UPLOADS_DIR=/app/uploads
  - TZ=America/Toronto
```

Créer le dossier avec le bon propriétaire (uid 1001 = utilisateur `nextjs` du
conteneur) : `mkdir -p uploads && chown -R 1001:1001 uploads`.
Penser à inclure `uploads/` dans les sauvegardes du serveur, au même titre que
la base de données.

---
