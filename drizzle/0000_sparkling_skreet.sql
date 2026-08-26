-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE TABLE `accessoires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`consoles` json NOT NULL,
	`koha_id` int NOT NULL,
	`hidden` tinyint NOT NULL DEFAULT 0,
	`lastUpdatedAt` datetime NOT NULL,
	`createdAt` datetime NOT NULL,
	CONSTRAINT `accessoires_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `uq_accessoires_koha` UNIQUE(`koha_id`)
);
--> statement-breakpoint
CREATE TABLE `console_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`console_type_id` int NOT NULL,
	`biblio_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`picture` longtext,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`holding` tinyint NOT NULL DEFAULT 0,
	`createdAt` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`lastUpdatedAt` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `console_stock_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `console_type` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`picture` longtext,
	`description` text,
	CONSTRAINT `console_type_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `name` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `cours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code_cours` varchar(7) NOT NULL,
	`nom_cours` varchar(255) NOT NULL,
	CONSTRAINT `cours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservation_id` varchar(255) NOT NULL,
	`email_type` varchar(50) NOT NULL,
	`recipient` varchar(255),
	`status` enum('sent','failed') NOT NULL,
	`error_message` text,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titre` text NOT NULL,
	`author` text,
	`platform` varchar(255),
	`console_type_id` int,
	`platform_id` int,
	`biblio_id` int NOT NULL,
	`console_koha_id` int,
	`picture` longtext,
	`holding` tinyint NOT NULL DEFAULT 0,
	`required_accessories` json,
	`createdAt` datetime NOT NULL,
	`lastUpdatedAt` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`),
	CONSTRAINT `uq_games_biblio` UNIQUE(`biblio_id`)
);
--> statement-breakpoint
CREATE TABLE `hour_ranges` (
	`range_id` int AUTO_INCREMENT NOT NULL,
	`weekly_id` int NOT NULL,
	`start_hour` varchar(2) NOT NULL,
	`start_minute` varchar(2) NOT NULL,
	`end_hour` varchar(2) NOT NULL,
	`end_minute` varchar(2) NOT NULL,
	CONSTRAINT `hour_ranges_range_id` PRIMARY KEY(`range_id`)
);
--> statement-breakpoint
CREATE TABLE `otp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`otp_code` varchar(6) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`expires_at` datetime NOT NULL,
	`is_used` tinyint(1) NOT NULL DEFAULT 0,
	CONSTRAINT `otp_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` tinyint NOT NULL DEFAULT 1,
	`policies` longtext,
	`lastUpdatedAt` datetime NOT NULL,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `singleton_policies` CHECK((`id` = 1))
);
--> statement-breakpoint
CREATE TABLE `reservation` (
	`id` varchar(255) NOT NULL,
	`console_id` int NOT NULL,
	`console_type_id` int NOT NULL,
	`user_id` int NOT NULL,
	`game1_id` int NOT NULL,
	`game2_id` int,
	`game3_id` int,
	`accessory_ids` json,
	`cours_id` int NOT NULL,
	`station` int,
	`date` date NOT NULL,
	`time` time NOT NULL,
	`archived` tinyint NOT NULL DEFAULT 0,
	`cancellation_reason` text,
	`reminder_enabled` tinyint(1) NOT NULL DEFAULT 0,
	`reminder_hours_before` int,
	`reminder_sent` tinyint(1) NOT NULL DEFAULT 0,
	`reminder_sent_at` datetime,
	`createdAt` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`lastUpdatedAt` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `reservation_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation_hold` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`console_id` int NOT NULL,
	`console_type_id` int,
	`game1_id` int,
	`game2_id` int,
	`game3_id` int,
	`station_id` int,
	`accessoirs` json,
	`cours` int,
	`date` date,
	`time` time,
	`expireAt` timestamp NOT NULL,
	`createdAt` datetime NOT NULL,
	CONSTRAINT `reservation_hold_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `specific_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`start_hour` varchar(2) NOT NULL,
	`start_minute` varchar(2) NOT NULL,
	`end_hour` varchar(2) NOT NULL,
	`end_minute` varchar(2) NOT NULL,
	`is_exception` tinyint(1) NOT NULL,
	CONSTRAINT `specific_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`isActive` tinyint NOT NULL DEFAULT 1,
	`consoles` json NOT NULL,
	`lastUpdatedAt` datetime NOT NULL,
	`createdAt` datetime NOT NULL,
	CONSTRAINT `stations_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstname` varchar(50) NOT NULL,
	`lastname` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255),
	`isAdmin` tinyint NOT NULL,
	`lastUpdatedAt` datetime NOT NULL,
	`createdAt` datetime NOT NULL,
	`lastLogin` datetime,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_availabilities` (
	`weekly_id` int AUTO_INCREMENT NOT NULL,
	`start_date` date,
	`end_date` date,
	`day_of_week` varchar(10) NOT NULL,
	`enabled` tinyint(1) NOT NULL,
	`always_available` tinyint(1) NOT NULL DEFAULT 0,
	CONSTRAINT `weekly_availabilities_weekly_id` PRIMARY KEY(`weekly_id`)
);
--> statement-breakpoint
ALTER TABLE `console_stock` ADD CONSTRAINT `console_stock_ibfk_1` FOREIGN KEY (`console_type_id`) REFERENCES `console_type`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `games` ADD CONSTRAINT `games_fk_console_type` FOREIGN KEY (`console_type_id`) REFERENCES `console_type`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `hour_ranges` ADD CONSTRAINT `hour_ranges_ibfk_1` FOREIGN KEY (`weekly_id`) REFERENCES `weekly_availabilities`(`weekly_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `otp` ADD CONSTRAINT `otp_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_fk1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_fk3` FOREIGN KEY (`console_id`) REFERENCES `console_stock`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_fk4` FOREIGN KEY (`game1_id`) REFERENCES `games`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_fk5` FOREIGN KEY (`game2_id`) REFERENCES `games`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_fk6` FOREIGN KEY (`game3_id`) REFERENCES `games`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_console_type_id_fk` FOREIGN KEY (`console_type_id`) REFERENCES `console_type`(`id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk2` FOREIGN KEY (`console_id`) REFERENCES `console_stock`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk3` FOREIGN KEY (`game1_id`) REFERENCES `games`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk4` FOREIGN KEY (`game2_id`) REFERENCES `games`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk5` FOREIGN KEY (`game3_id`) REFERENCES `games`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reservation_hold` ADD CONSTRAINT `reservation_hold_fk6` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_active` ON `console_stock` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_console_type` ON `console_stock` (`console_type_id`);--> statement-breakpoint
CREATE INDEX `ix_stock_biblio` ON `console_stock` (`biblio_id`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `email_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reservation` ON `email_logs` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `email_logs` (`status`);--> statement-breakpoint
CREATE INDEX `ix_games_console_type` ON `games` (`console_type_id`);--> statement-breakpoint
CREATE INDEX `weekly_id` ON `hour_ranges` (`weekly_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `otp` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_reminder_pending` ON `reservation` (`reminder_enabled`,`reminder_sent`,`date`,`time`);--> statement-breakpoint
CREATE INDEX `ix_res_console` ON `reservation` (`console_id`);--> statement-breakpoint
CREATE INDEX `ix_res_console_type` ON `reservation` (`console_type_id`);--> statement-breakpoint
CREATE INDEX `ix_res_cours` ON `reservation` (`cours_id`);--> statement-breakpoint
CREATE INDEX `ix_res_game1` ON `reservation` (`game1_id`);--> statement-breakpoint
CREATE INDEX `ix_res_game2` ON `reservation` (`game2_id`);--> statement-breakpoint
CREATE INDEX `ix_res_game3` ON `reservation` (`game3_id`);--> statement-breakpoint
CREATE INDEX `ix_res_station` ON `reservation` (`station`);--> statement-breakpoint
CREATE INDEX `ix_res_user` ON `reservation` (`user_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_console` ON `reservation_hold` (`console_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_game1` ON `reservation_hold` (`game1_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_game2` ON `reservation_hold` (`game2_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_game3` ON `reservation_hold` (`game3_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_station` ON `reservation_hold` (`station_id`);--> statement-breakpoint
CREATE INDEX `ix_hold_user` ON `reservation_hold` (`user_id`);--> statement-breakpoint
CREATE ALGORITHM = undefined
SQL SECURITY definer
VIEW `console_catalog` AS (select `ct`.`id` AS `console_type_id`,`ct`.`name` AS `name`,`ct`.`picture` AS `picture`,`ct`.`description` AS `description`,count(`cs`.`id`) AS `total_units`,sum((case when ((`cs`.`is_active` = 1) and (`cs`.`holding` = 0)) then 1 else 0 end)) AS `active_units`,sum((case when (`cs`.`is_active` = 0) then 1 else 0 end)) AS `inactive_units` from (`console_type` `ct` left join `console_stock` `cs` on((`ct`.`id` = `cs`.`console_type_id`))) where exists(select 1 from `stations` `s` where json_contains(`s`.`consoles`,cast(`ct`.`id` as json),'$')) group by `ct`.`id`,`ct`.`name` order by `ct`.`name`);