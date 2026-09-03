-- games.is_active : 0 quand Koha marque le jeu non fonctionnel / non
-- disponible (zone 583 $9 = 1). Posé par le seeder à chaque synchronisation,
-- lu par le parcours de réservation pour ne plus proposer le jeu.
--
-- Conditionnelle : le seeder (ludov-seeder, ensure_games_is_active_column)
-- ajoute la même colonne s'il passe avant cette migration. Un ALTER direct
-- échouerait alors et bloquerait le démarrage du conteneur.
SET @ludov_has_col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'games' AND COLUMN_NAME = 'is_active'
);--> statement-breakpoint
SET @ludov_sql := IF(
  @ludov_has_col = 0,
  'ALTER TABLE `games` ADD `is_active` tinyint DEFAULT 1 NOT NULL',
  'SELECT 1'
);--> statement-breakpoint
PREPARE ludov_stmt FROM @ludov_sql;--> statement-breakpoint
EXECUTE ludov_stmt;--> statement-breakpoint
DEALLOCATE PREPARE ludov_stmt;--> statement-breakpoint
SET @ludov_has_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'games' AND INDEX_NAME = 'ix_games_active'
);--> statement-breakpoint
SET @ludov_sql := IF(
  @ludov_has_idx = 0,
  'CREATE INDEX `ix_games_active` ON `games` (`is_active`)',
  'SELECT 1'
);--> statement-breakpoint
PREPARE ludov_stmt FROM @ludov_sql;--> statement-breakpoint
EXECUTE ludov_stmt;--> statement-breakpoint
DEALLOCATE PREPARE ludov_stmt;
