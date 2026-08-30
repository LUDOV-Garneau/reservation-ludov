-- Parcours « mot de passe oublié » en libre-service.
--
-- `password_reset_tokens` ne conserve que le SHA-256 du jeton envoyé par
-- courriel : une fuite de la base ne permet pas de rejouer les liens en
-- circulation. `users.session_version` porte l'invalidation des sessions
-- ouvertes ailleurs : le claim `sv` des JWT est comparé à cette colonne, que la
-- réinitialisation incrémente.
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `session_version` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `prt_user_id` ON `password_reset_tokens` (`user_id`);
--> statement-breakpoint
-- Texte du courriel, éditable ensuite dans l'admin. Le bouton et l'URL restent
-- dans le gabarit HTML fixe (src/lib/sendEmail.ts).
INSERT INTO `email_templates` (`template_key`, `locale`, `subject`, `zones`, `updated_at`) VALUES ('forgot_password', 'fr', 'Réinitialiser votre mot de passe LUDOV', '{"intro":"Bonjour,\\nNous avons reçu une demande de réinitialisation du mot de passe de votre compte LUDOV.\\nCliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.","outro":"Si vous avez des questions ou éprouvez des difficultés, n''hésitez pas à nous contacter."}', NOW());
--> statement-breakpoint
INSERT INTO `email_templates` (`template_key`, `locale`, `subject`, `zones`, `updated_at`) VALUES ('forgot_password', 'en', 'Reset your LUDOV password', '{"intro":"Hello,\\nWe received a request to reset the password of your LUDOV account.\\nClick the button below to choose a new password.","outro":"If you have any questions or difficulties, feel free to contact us."}', NOW());
