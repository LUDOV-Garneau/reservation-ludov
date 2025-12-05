# Gestion des réservations

Ce guide explique comment gérer les réservations dans le panneau d'administration. Vous pouvez consulter l'historique, voir les détails complets et annuler des réservations.

## 1. Accès au panneau des réservations

1.  Accédez à la page d'administration.
2.  Cliquez sur l'onglet **Réservations**.

## 2. Tableau des réservations

Le tableau affiche toutes les réservations du système. Chaque ligne représente une réservation avec :
*   **Utilisateur** : Le nom de l'utilisateur ayant effectué la réservation.
*   **Console** : La plateforme réservée.
*   **Jeux** : La liste des jeux sélectionnés.
*   **Date et Heure** : Le moment prévu pour la réservation.
*   **Station** : La station assignée.
*   **Statut** : L'état actuel (À venir, Passée, Annulée).
*   **Actions** : Les options pour voir les détails ou supprimer.

### Recherche et rafraîchissement
*   Utilisez la barre de recherche pour trouver une réservation par nom d'utilisateur.
*   Utilisez le bouton de rafraîchissement pour actualiser la liste manuellement.

![Recherche](/api/admin/images/reservations/recherche.png)

![Rafraîchissement](/api/admin/images/reservations/refresh.png)

## 3. Afficher les détails

Pour consulter les informations complètes d'une réservation, cliquez sur l'icône d'**œil** dans la colonne Actions ou directement sur la ligne de la réservation.

![Actions](/api/admin/images/reservations/actions.png)

La page de détails affiche :
*   Les informations de l'utilisateur.
*   Le statut de la réservation.
*   La console, les jeux et les accessoires réservés.
*   Le cours associé (si applicable).

![En-tête des détails](/api/admin/images/reservations/details-entete.png)

![Détails complets](/api/admin/images/reservations/details.png)

## 4. Supprimer une réservation

La suppression annule la réservation et libère la plage horaire si elle est à venir.

### Procédure de suppression

1.  Cliquez sur l'icône de **poubelle** dans la colonne Actions.
2.  Confirmez la suppression dans la fenêtre contextuelle.

> **Attention** : Cette action est irréversible.

![Suppression](/api/admin/images/reservations/suppression.png)

## 5. Métriques

Les métriques en haut du tableau affichent :
*   Nombre total de réservations.
*   Nombre de réservations à venir.
*   Nombre de réservations passées.

![Métriques](/api/admin/images/reservations/metriques.png)
