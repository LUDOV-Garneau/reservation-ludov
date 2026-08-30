-- Le courriel identifie le compte (connexion, import CSV, réinitialisation).
-- Sans cette contrainte, la vérification applicative des routes d'ajout n'est
-- qu'indicative : deux créations concurrentes du même courriel passent toutes
-- les deux, et un CSV contenant deux fois la même adresse crée deux comptes.
--
-- Cette migration ÉCHOUE s'il existe déjà des doublons. Les repérer avant :
--   SELECT email, COUNT(*) c, GROUP_CONCAT(id) ids
--   FROM users GROUP BY email HAVING c > 1;
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
