-- reservation(date, time) : index de couverture pour la liste admin des
-- réservations, dont le filtre de date et le tri chronologique sont passés
-- côté serveur. Sans lui, chaque filtre balaie la table entière — les seuls
-- index existants portent sur les clés étrangères et sur les rappels.
--
-- Conditionnelle, comme 0009 : la migration doit pouvoir rejouer sans échouer
-- si l'index a déjà été posé à la main sur un environnement.
SET @ludov_has_idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservation' AND INDEX_NAME = 'ix_res_date_time'
);--> statement-breakpoint
SET @ludov_sql := IF(
  @ludov_has_idx = 0,
  'CREATE INDEX `ix_res_date_time` ON `reservation` (`date`, `time`)',
  'SELECT 1'
);--> statement-breakpoint
PREPARE ludov_stmt FROM @ludov_sql;--> statement-breakpoint
EXECUTE ludov_stmt;--> statement-breakpoint
DEALLOCATE PREPARE ludov_stmt;
