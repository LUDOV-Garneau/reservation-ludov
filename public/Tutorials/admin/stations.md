# Guide d'administration des stations

## Aperçu

Ce guide fournit des instructions détaillées pour les administrateurs sur la gestion des stations dans le système de réservation. Vous y trouverez des informations sur le fonctionnement de l'interface pour les stations.

## Accéder au panneau d'administration des stations
1. Accédez à la page d'administration
2. Cliquez sur l'onglet *Stations*

## Tableau des stations
Le tableau des stations affiche toutes les stations disponibles et inactives dans le système. Chaque ligne du tableau représente une station avec les colonnes suivantes :
- **Nom de la station** : Nom complet de la station.
- **Date de création** : Date à laquelle la station a été ajoutée au système.
- **Statut (Active/Inactif)** : Les stations actives sont mises en évidence en vert, tandis que les stations inactives sont en rouge.
- **Actions (Modifier, Supprimer)** : Boutons pour modifier ou supprimer une station.

Pour une navigation plus facile, il est possible de chercher une station spécifique en utilisant la barre de recherche située en haut du tableau.
![Recherche d'une station](/src/private/images/tutoriels/station/Recherche_Station.png)

Il est aussi possible de rafraîchir la liste des stations en cliquant sur le bouton de rafraîchissement situé à côté de la barre de recherche.
![Bouton de rafraîchissement](/src/private/images/tutoriels/station/Refresh_Station.png)

Situé en haut à droite du tableau, le bouton **Ajouter une nouvelle station** permet aux administrateurs d'ajouter rapidement une nouvelle station au système.
![Ajouter une nouvelle station](/src/private/images/tutoriels/station/Ajout_Station.png)

Situé dans la colonne des actions, le bouton **Modifier** permet de mettre à jour les informations d'une station existante, tandis que le bouton **Supprimer** permet de retirer une station du système. Un peu plus bas seront expliquées en détails ces fonctionnalités.
![actions possibles sur une station](/src/private/images/tutoriels/station/Actions_Station.png)

## Ajouter une nouvelle station
Le bouton **Ajouter une nouvelle station** ouvre un formulaire où les administrateurs peuvent saisir les informations nécessaires pour créer une nouvelle station. Les champs obligatoires incluent :
- **Nom de la station** : Le nom complet de la station.
- **Consoles associées** : Sélectionner les consoles disponibles à cette station.

### Comment ajouter une station :
1. Cliquez sur le bouton **Ajouter une nouvelle station**.

2. Entrez le nom de la station dans le champ prévu à cet effet.

3. Sélectionnez les consoles associées à cette station. Pour chaque consoles sélectionnée, assurez-vous de cliquer sur le bouton **Ajouter** pour l'associer correctement.
![Ajouter une nouvelle console à une station](/src/private/images/tutoriels/station/Ajouter_Console_Station.png)

4. Cliquez sur le bouton **Ajouter** dans le bas du formulaire pour créer la station.

## Modifier une station existante
Le bouton **Modifier** dans la colonne des actions ouvre un formulaire pré-rempli avec les informations actuelles de la station sélectionnée. Les administrateurs peuvent mettre à jour le nom de la station et les consoles associées.

### Comment modifer une station :
1. Cliquez sur le bouton **Modifier** à côté de la station que vous souhaitez mettre à jour.

2. Mettez à jour le nom de la station si nécessaire.

3. Modifiez les consoles associées en ajoutant ou supprimant des consoles selon vos besoins. Il est impossible d'ajouter une console déjà associée à cette station. Comme pour l'ajout, assurez-vous de cliquer sur le bouton **Ajouter** pour chaque console que vous souhaitez associer.

4. Cochez le champ **Active** pour changer le statut de la station.
![Changer le statut d'une station](/src/private/images/tutoriels/station/Station_Active.png)

5. Cliquez sur le bouton **Modifier** pour appliquer les modifications.

## Supprimer une station
Le bouton **Supprimer** dans la colonne des actions permet aux administrateurs de retirer une station du système. Une confirmation sera demandée avant la suppression définitive.

### Comment supprimer une station :

1. Cliquez sur le bouton **Supprimer** à côté de la station que vous souhaitez retirer.

2. Confirmez la suppression dans la fenêtre contextuelle qui apparaît. **Attention : cette action est irréversible.**

![Supression d'une station](/src/private/images/tutoriels/station/Suppression_Station.png)

## Métriques des stations
Les administrateurs peuvent consulter diverses métriques liées aux stations, telles que le nombre de stations actives, le nombre de stations inactives, et la station la plus réservée. Ces informations sont accessibles en haut du tableau des stations et seront changés automatiquement pour correspondre aux données actuelles.

![Métriques des stations](/src/private/images/tutoriels/station/Metriques_Station.png)