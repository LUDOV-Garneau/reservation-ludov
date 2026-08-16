-- Généralisation de la table `policies` : une ligne par type de politique
-- ('privacy' = confidentialité, 'usage' = politique d'utilisation).
-- Migration écrite à la main : le diff auto-généré voulait renommer toutes les
-- contraintes FK héritées de l'introspection, ce qui est inutile et risqué sur
-- une base vivante.
ALTER TABLE `policies` DROP CHECK `singleton_policies`;--> statement-breakpoint
ALTER TABLE `policies` MODIFY COLUMN `id` tinyint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `policies` ADD `type` varchar(32) NOT NULL DEFAULT 'privacy';--> statement-breakpoint
ALTER TABLE `policies` ADD CONSTRAINT `uq_policies_type` UNIQUE(`type`);--> statement-breakpoint
INSERT INTO `policies` (`type`, `policies`, `lastUpdatedAt`)
SELECT 'usage', NULL, NOW()
WHERE NOT EXISTS (SELECT 1 FROM `policies` WHERE `type` = 'usage');
