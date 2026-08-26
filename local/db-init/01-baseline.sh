#!/bin/bash
# Amorçage de la base LOCALE uniquement (exécuté une seule fois par MySQL, à la
# création du volume).
#
# `drizzle/0000_sparkling_skreet.sql` est un dump d'introspection : son corps
# est entièrement commenté (/* ... */), donc les migrations ne peuvent PAS
# créer un schéma vierge. En production ce n'est pas un problème (la base
# existait déjà, la ligne 0000 est simplement enregistrée comme appliquée),
# mais en local il faut recréer le schéma soi-même.
#
# Ce script :
#   1. décommente le dump et l'applique ;
#   2. enregistre 0000 dans `__drizzle_migrations` pour que le conteneur web
#      enchaîne directement sur 0001, 0002, 0003 au démarrage.
#
# Le fichier de migration n'est jamais modifié : son hash reste celui attendu
# en production.
set -euo pipefail

BASELINE=/baseline/0000_sparkling_skreet.sql
WHEN=1779485598155 # champ "when" de drizzle/meta/_journal.json pour 0000
MYSQL=(mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}")

echo "[baseline] Application du schéma de référence dans ${MYSQL_DATABASE}..."

# `/*` et `*/` : bornes du bloc commenté. `--> statement-breakpoint` : marqueur
# Drizzle que le client mysql ne sait pas lire (`-->` n'est pas un commentaire).
sed -e '/^\/\*$/d' -e '/^\*\/$/d' -e '/--> statement-breakpoint/d' "$BASELINE" | "${MYSQL[@]}"

HASH=$(sha256sum "$BASELINE" | cut -d' ' -f1)

"${MYSQL[@]}" <<EOSQL
CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
  id serial primary key,
  hash text not null,
  created_at bigint
);
INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`)
SELECT '${HASH}', ${WHEN}
WHERE NOT EXISTS (SELECT 1 FROM \`__drizzle_migrations\` WHERE \`created_at\` = ${WHEN});
EOSQL

echo "[baseline] Terminé : 0000 marquée comme appliquée (hash ${HASH})."
