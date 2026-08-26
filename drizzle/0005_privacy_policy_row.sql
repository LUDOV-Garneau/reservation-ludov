-- La migration 0001 n'insère que la ligne « usage » : elle supposait que la
-- ligne de confidentialité existait déjà (avant 0001, `policies` contenait une
-- seule ligne, qui récupère `type = 'privacy'` par défaut).
-- Sur une base créée de zéro, la table est vide : aucune ligne « privacy »
-- n'est donc jamais créée et /api/policies?type=privacy renvoie null.
-- Idempotent : sans effet là où la ligne existe déjà (production).
INSERT INTO `policies` (`type`, `policies`, `lastUpdatedAt`)
SELECT 'privacy', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM `policies` WHERE `type` = 'privacy');
