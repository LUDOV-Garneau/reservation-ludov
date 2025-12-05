# Gestion des utilisateurs

Ce guide explique comment gérer les comptes utilisateurs dans le panneau d'administration. Vous pouvez ajouter, modifier, supprimer et réinitialiser les mots de passe des utilisateurs.

## 1. Accès au panneau des utilisateurs

1.  Accédez à la page d'administration.
2.  Cliquez sur l'onglet **Utilisateurs**.

## 2. Tableau des utilisateurs

Le tableau affiche tous les utilisateurs inscrits. Chaque ligne représente un utilisateur avec :
*   **Email** : L'adresse courriel.
*   **Nom** : Le nom complet.
*   **Rôle** : Administrateur ou Utilisateur.
*   **Date de création** : La date d'inscription.
*   **Actions** : Les options pour gérer le compte.

### Métriques
En haut du tableau, vous trouverez :
*   Le nombre total d'utilisateurs.
*   Le nombre d'utilisateurs non configurés (sans mot de passe).
*   Le nombre d'utilisateurs ayant effectué des réservations.

![Métriques utilisateurs](/api/admin/images/utilisateurs/metrics_users.png)

## 3. Ajouter un utilisateur

Le bouton **Ajouter** permet de créer un ou plusieurs comptes.

![Bouton ajout](/api/admin/images/utilisateurs/ajout.png)

### Ajout simple
1.  Cliquez sur **Ajouter** puis **Ajouter un utilisateur**.
2.  Remplissez le prénom, le nom et le courriel.
3.  Cochez **Administrateur** si nécessaire.
4.  Cliquez sur **Ajouter l'utilisateur**.

![Ajout simple](/api/admin/images/utilisateurs/ajout_simple.png)

### Ajout multiple (CSV)
1.  Cliquez sur **Ajouter**.
2.  Glissez un fichier CSV dans la zone dédiée ou cliquez pour sélectionner un fichier.
3.  Assurez-vous que le format du fichier est respecté.

![Ajout multiple](/api/admin/images/utilisateurs/ajout_multiple.png)

## 4. Afficher les détails

Cliquez sur une ligne du tableau pour voir les détails complets d'un utilisateur, y compris son historique de réservation.

![Détails utilisateur](/api/admin/images/utilisateurs/details.png)

## 5. Réinitialiser le mot de passe

Cette action force l'utilisateur à choisir un nouveau mot de passe à sa prochaine connexion.

### Procédure de réinitialisation
1.  Cliquez sur l'icône de **clé** dans la colonne Actions.
2.  Confirmez l'action dans la fenêtre contextuelle.

![Réinitialisation mot de passe](/api/admin/images/utilisateurs/btn_reset_mdp.png)

## 6. Supprimer un utilisateur

La suppression retire définitivement le compte et ses données associées.

### Procédure de suppression
1.  Cliquez sur l'icône de **poubelle** dans la colonne Actions.
2.  Lisez l'avertissement et confirmez la suppression.

![Suppression utilisateur](/api/admin/images/utilisateurs/btn_delete.png)

## 7. Filtrage et rafraîchissement

### Filtrer la liste
Utilisez la barre de recherche pour trouver un utilisateur par nom ou courriel.

![Barre de recherche](/api/admin/images/utilisateurs/search-bar_users.png)

### Actualiser les données
Utilisez le bouton de rafraîchissement pour mettre à jour la liste manuellement.

![Bouton rafraîchissement](/api/admin/images/utilisateurs/refresh.png)