# Guide Complet : Gestion des Utilisateurs dans le Panneau d'Administration

## Table des matières

1. [Introduction](#introduction)
2. [Accès au module de gestion](#accès-au-module-de-gestion)
3. [Interface utilisateur](#interface-utilisateur)
4. [Création d'un nouvel utilisateur](#création-dun-nouvel-utilisateur)
5. [Modification des informations utilisateur](#modification-des-informations-utilisateur)
6. [Gestion avancée des permissions](#gestion-avancée-des-permissions)
7. [Désactivation et suppression d'utilisateurs](#désactivation-et-suppression-dutilisateurs)
8. [Réinitialisation des mots de passe](#réinitialisation-des-mots-de-passe)
9. [Recherche et filtrage](#recherche-et-filtrage)
10. [Bonnes pratiques et sécurité](#bonnes-pratiques-et-sécurité)
11. [Dépannage](#dépannage)

---

## Introduction

### À propos de ce guide

Ce guide détaillé vous accompagne dans toutes les étapes de la gestion des utilisateurs via le panneau d'administration. Que vous soyez administrateur système, gestionnaire de comptes ou responsable IT, vous trouverez ici toutes les informations nécessaires pour administrer efficacement les comptes utilisateurs de votre plateforme.

### Prérequis

Avant de commencer, assurez-vous de disposer de :

- Un compte administrateur actif avec les permissions appropriées
- Un accès au panneau d'administration de la plateforme
- Une connexion internet stable
- Un navigateur web à jour (Chrome, Firefox, Safari ou Edge recommandés)

### Rôles et permissions

Le système distingue trois niveaux d'accès principaux :

- **Administrateur** : Accès complet à toutes les fonctionnalités, y compris la gestion des utilisateurs et des paramètres système
- **Gestionnaire** : Peut créer et modifier des utilisateurs, mais avec des restrictions sur certaines fonctions critiques
- **Utilisateur** : Accès limité aux fonctionnalités de base sans droits d'administration

---

## Accès au module de gestion

### Étape 1 : Connexion au panneau d'administration

1. Ouvrez votre navigateur web
2. Saisissez l'URL du panneau d'administration dans la barre d'adresse
   - Format habituel : `https://votredomaine.com/admin`
3. Appuyez sur **Entrée** pour accéder à la page de connexion

### Étape 2 : Authentification

1. Sur la page de connexion, repérez les champs d'identification
2. Entrez votre **adresse email** d'administrateur dans le premier champ
3. Saisissez votre **mot de passe** dans le champ prévu à cet effet
   - Assurez-vous que la touche Caps Lock n'est pas activée
4. (Optionnel) Cochez la case **Se souvenir de moi** si vous utilisez un ordinateur personnel sécurisé
5. Cliquez sur le bouton **Se connecter**

### Étape 3 : Navigation vers le module Utilisateurs

1. Une fois connecté, vous arrivez sur le tableau de bord principal
2. Localisez le **menu de navigation principal** situé généralement à gauche de l'écran
3. Parcourez le menu et identifiez la section **Utilisateurs** (icône représentant souvent une silhouette ou plusieurs personnes)
4. Cliquez sur **Utilisateurs** pour accéder au module de gestion
5. La page se charge et affiche la liste complète des utilisateurs enregistrés

### Vérification des permissions

Si vous ne voyez pas l'option **Utilisateurs** dans le menu :

- Vérifiez que votre compte dispose des permissions nécessaires
- Contactez un administrateur principal pour demander l'accès
- Consultez la section des paramètres de compte pour voir vos permissions actuelles

---

## Interface utilisateur

### Vue d'ensemble de l'interface

L'interface du module Utilisateurs est organisée en plusieurs zones fonctionnelles :

#### Zone supérieure - Barre d'actions

Située en haut de la page, elle contient :

- **Bouton "+ Nouvel utilisateur"** : Permet de créer un nouveau compte (généralement en vert ou bleu)
- **Bouton "Exporter"** : Exporte la liste des utilisateurs au format CSV ou Excel
- **Bouton "Importer"** : Permet l'importation en masse d'utilisateurs
- **Menu d'actions groupées** : Pour effectuer des actions sur plusieurs utilisateurs simultanément

#### Zone de recherche et filtres

Positionnée sous la barre d'actions :

- **Barre de recherche** : Champ de saisie pour rechercher rapidement un utilisateur
- **Filtres déroulants** : Permettent de filtrer par rôle, statut, date, etc.
- **Bouton "Réinitialiser les filtres"** : Efface tous les critères de filtrage appliqués

#### Zone principale - Liste des utilisateurs

Cette section affiche un tableau avec les colonnes suivantes :

- **Case à cocher** : Pour sélectionner un ou plusieurs utilisateurs
- **Avatar/Photo** : Image de profil de l'utilisateur
- **Nom complet** : Prénom et nom de l'utilisateur
- **Email** : Adresse email associée au compte
- **Rôle** : Badge indiquant le niveau d'accès (Admin, Gestionnaire, Utilisateur)
- **Statut** : Indicateur visuel (Actif en vert, Inactif en gris)
- **Date de création** : Date d'enregistrement du compte
- **Dernière connexion** : Date et heure de la dernière activité
- **Actions** : Icônes pour éditer, désactiver ou supprimer

#### Zone inférieure - Pagination

En bas de page :

- **Indicateur de résultats** : "Affichage de 1-25 sur 150 utilisateurs"
- **Sélecteur de résultats par page** : 25, 50, 100 ou Tous
- **Boutons de navigation** : Précédent, numéros de page, Suivant

### Personnalisation de l'affichage

#### Ajuster les colonnes visibles

1. Cliquez sur l'icône **⚙️ Colonnes** en haut à droite du tableau
2. Cochez ou décochez les colonnes que vous souhaitez afficher/masquer
3. Les modifications sont sauvegardées automatiquement pour vos prochaines visites

#### Trier les données

1. Cliquez sur l'en-tête de n'importe quelle colonne pour trier
2. Premier clic : Tri croissant (A→Z, 0→9)
3. Deuxième clic : Tri décroissant (Z→A, 9→0)
4. Troisième clic : Retour à l'ordre par défaut

---

## Création d'un nouvel utilisateur

### Vue d'ensemble du processus

La création d'un utilisateur se déroule en plusieurs étapes clés. Ce processus vous permettra d'ajouter un nouveau compte avec toutes les informations et permissions nécessaires.

### Étape 1 : Initier la création

1. Depuis la page principale du module Utilisateurs, repérez le bouton **"+ Nouvel utilisateur"** en haut à droite
2. Cliquez sur ce bouton
3. Une fenêtre modale ou une nouvelle page s'ouvre avec le formulaire de création

### Étape 2 : Remplir les informations personnelles

#### Section Identité

**Nom complet** (Obligatoire)

1. Cliquez dans le champ **"Nom complet"**
2. Saisissez le prénom et le nom de l'utilisateur
   - Exemple : `Marie-Claude Tremblay`
3. Utilisez des majuscules appropriées
4. Évitez les caractères spéciaux non nécessaires

**Nom d'utilisateur** (Optionnel selon configuration)

1. Si présent, remplissez le champ **"Nom d'utilisateur"**
2. Utilisez uniquement des lettres, chiffres, points et traits d'union
   - Exemple : `m.tremblay` ou `marie-claude`
3. Le système peut suggérer automatiquement un nom basé sur l'email

**Adresse email** (Obligatoire)

1. Cliquez dans le champ **"Email"**
2. Saisissez une adresse email valide et unique
   - Format : `utilisateur@domaine.com`
3. Le système vérifie automatiquement :
   - La validité du format
   - L'unicité de l'adresse (un email ne peut être utilisé qu'une seule fois)
4. Si l'email existe déjà, un message d'erreur s'affiche en rouge sous le champ

**Numéro de téléphone** (Optionnel)

1. Remplissez le champ **"Téléphone"** si nécessaire
2. Respectez le format international si applicable
   - Exemple : `+1 514 555 0123` pour le Canada

### Étape 3 : Définir les identifiants de connexion

#### Mot de passe

**Option A : Création manuelle du mot de passe**

1. Cliquez dans le champ **"Mot de passe"**
2. Saisissez un mot de passe répondant aux critères de sécurité :
   - **Minimum 8 caractères** (recommandé : 12 caractères ou plus)
   - Au moins **une lettre majuscule** (A-Z)
   - Au moins **une lettre minuscule** (a-z)
   - Au moins **un chiffre** (0-9)
   - Au moins **un caractère spécial** (@, #, $, %, etc.)
3. Un indicateur de force du mot de passe s'affiche généralement :
   - Rouge : Faible
   - Orange : Moyen
   - Vert : Fort
4. Cliquez dans le champ **"Confirmer le mot de passe"**
5. Ressaisissez exactement le même mot de passe
6. Vérifiez que les deux champs correspondent (un ✓ vert apparaît si correct)

**Option B : Génération automatique**

1. Repérez le bouton **"Générer un mot de passe"** à côté du champ
2. Cliquez sur ce bouton
3. Le système crée automatiquement un mot de passe sécurisé
4. Cliquez sur l'icône **👁️ Afficher** pour voir le mot de passe généré
5. Copiez ce mot de passe pour le transmettre à l'utilisateur de manière sécurisée
6. Les deux champs (mot de passe et confirmation) sont remplis automatiquement

**Options de mot de passe**

- ☐ **Forcer le changement de mot de passe à la première connexion**

  - Cochez cette option pour obliger l'utilisateur à définir son propre mot de passe lors de sa première connexion
  - Recommandé pour la sécurité

- ☐ **Envoyer un email de bienvenue avec les identifiants**
  - Cochez pour que l'utilisateur reçoive automatiquement un email contenant ses informations de connexion
  - L'email inclut généralement un lien d'activation

### Étape 4 : Attribuer un rôle

#### Sélection du rôle principal

1. Localisez la section **"Rôle"** dans le formulaire
2. Cliquez sur le menu déroulant **"Sélectionner un rôle"**
3. Trois options principales apparaissent :

**Option 1 : Administrateur**

- **Description** : Accès complet à toutes les fonctionnalités
- **Permissions incluses** :
  - Gestion complète des utilisateurs (création, modification, suppression)
  - Accès aux paramètres système
  - Modification des configurations globales
  - Consultation de tous les journaux d'activité
  - Gestion des rôles et permissions
- **Quand l'utiliser** : Pour les responsables IT, directeurs techniques ou membres de l'équipe de direction
- Cliquez sur **"Administrateur"** pour sélectionner ce rôle

**Option 2 : Gestionnaire**

- **Description** : Permissions étendues avec certaines limitations
- **Permissions incluses** :
  - Création et modification des utilisateurs standards
  - Accès aux rapports et statistiques
  - Gestion du contenu et des données
  - Vue limitée des paramètres système
- **Restrictions** :
  - Ne peut pas modifier d'autres administrateurs
  - Ne peut pas accéder aux paramètres critiques
  - Ne peut pas supprimer définitivement des données importantes
- **Quand l'utiliser** : Pour les chefs d'équipe, superviseurs ou coordinateurs
- Cliquez sur **"Gestionnaire"** pour sélectionner ce rôle

**Option 3 : Utilisateur**

- **Description** : Accès de base aux fonctionnalités standards
- **Permissions incluses** :
  - Consultation des données autorisées
  - Modification de son propre profil
  - Utilisation des outils de base de la plateforme
  - Création de contenu dans son espace personnel
- **Restrictions** :
  - Aucun accès administratif
  - Ne peut pas gérer d'autres utilisateurs
  - Ne peut pas modifier les paramètres globaux
- **Quand l'utiliser** : Pour les employés, collaborateurs externes ou utilisateurs finaux standard
- Cliquez sur **"Utilisateur"** pour sélectionner ce rôle

### Étape 5 : Configurer les paramètres additionnels

#### Section Statut initial

**Statut du compte**

1. Repérez le sélecteur **"Statut"**
2. Choisissez entre :
   - **Actif** : Le compte est immédiatement opérationnel après création
   - **Inactif** : Le compte est créé mais désactivé (utile pour préparer des comptes à l'avance)
3. Par défaut, le statut **Actif** est recommandé

#### Section Informations organisationnelles

**Département** (Si applicable)

1. Cliquez sur le menu déroulant **"Département"**
2. Sélectionnez le département approprié :
   - Ressources Humaines
   - Informatique
   - Ventes
   - Marketing
   - Finance
   - Service Client
   - Autre
3. Cette information facilite le filtrage et l'organisation

**Manager/Superviseur** (Si applicable)

1. Cliquez sur le champ **"Responsable hiérarchique"**
2. Commencez à taper le nom du superviseur
3. Sélectionnez la personne appropriée dans la liste qui apparaît
4. Cette liaison permet une gestion hiérarchique des accès

**Localisation** (Si applicable)

1. Remplissez le champ **"Bureau/Site"**
2. Exemples : "Montréal - Siège social", "Toronto - Bureau régional"
3. Utile pour les organisations multi-sites

#### Section Notifications

**Préférences de notification**

- ☐ **Recevoir les notifications par email**
  - Cochez pour que l'utilisateur reçoive des alertes email
- ☐ **Recevoir les notifications in-app**

  - Cochez pour activer les notifications dans l'interface

- ☐ **Recevoir la newsletter hebdomadaire**
  - Cochez pour inscrire l'utilisateur aux communications régulières

### Étape 6 : Ajouter une photo de profil (Optionnel)

1. Repérez la zone **"Photo de profil"** généralement en haut du formulaire
2. Cliquez sur le bouton **"Choisir une image"** ou sur l'avatar par défaut
3. Une fenêtre de sélection de fichier s'ouvre
4. Naviguez jusqu'à l'image souhaitée sur votre ordinateur
5. Sélectionnez un fichier image (formats acceptés : JPG, PNG, GIF)
   - Taille maximale recommandée : 2 MB
   - Dimensions recommandées : 400x400 pixels minimum
6. Cliquez sur **"Ouvrir"**
7. L'image se charge et un aperçu s'affiche
8. (Si disponible) Utilisez l'outil de recadrage pour ajuster l'image
9. Cliquez sur **"Valider"** pour confirmer l'image

### Étape 7 : Révision et validation

#### Vérification pré-enregistrement

Avant de finaliser la création, vérifiez attentivement :

1. **Nom complet** : Orthographe correcte et complète
2. **Email** : Format valide et sans faute de frappe
3. **Mot de passe** : Respecte les critères de sécurité
4. **Rôle** : Approprié aux responsabilités de l'utilisateur
5. **Statut** : Actif ou Inactif selon vos besoins
6. **Options cochées** : Correspondent à vos intentions

#### Enregistrement du nouveau compte

**Méthode 1 : Enregistrement simple**

1. Une fois toutes les informations vérifiées, repérez les boutons en bas du formulaire
2. Cliquez sur le bouton **"Enregistrer"** (généralement en vert ou bleu)
3. Le système traite les informations (barre de progression ou indicateur de chargement)
4. Un message de confirmation s'affiche : "Utilisateur créé avec succès"
5. Vous êtes automatiquement redirigé vers la liste des utilisateurs
6. Le nouvel utilisateur apparaît en tête de liste

**Méthode 2 : Enregistrement et création d'un autre**

1. Si vous devez créer plusieurs utilisateurs consécutivement
2. Cliquez sur le bouton **"Enregistrer et créer un autre"**
3. Le compte est créé et enregistré
4. Le formulaire se réinitialise immédiatement
5. Vous pouvez directement saisir les informations du prochain utilisateur

**Méthode 3 : Enregistrement et modification**

1. Pour ajuster immédiatement des paramètres avancés
2. Cliquez sur **"Enregistrer et continuer à modifier"**
3. Le compte est créé
4. Vous restez sur la page de l'utilisateur en mode édition
5. Vous pouvez alors accéder aux onglets de permissions avancées

#### Annulation

Si vous souhaitez abandonner la création :

1. Cliquez sur le bouton **"Annuler"** ou **"X"** en haut du formulaire
2. Une fenêtre de confirmation peut apparaître : "Êtes-vous sûr de vouloir quitter sans enregistrer ?"
3. Cliquez sur **"Oui, quitter"** pour confirmer l'abandon
4. Toutes les données saisies seront perdues
5. Vous retournez à la liste des utilisateurs

### Étape 8 : Vérification post-création

#### Confirmation de la création

1. Repérez le message de succès affiché en haut de la page (généralement en vert)
2. Le message indique : "L'utilisateur [nom] a été créé avec succès"
3. Ce message disparaît automatiquement après quelques secondes

#### Vérification dans la liste

1. Retournez à la page principale du module Utilisateurs si nécessaire
2. Utilisez la barre de recherche pour trouver rapidement le nouvel utilisateur
3. Tapez le nom ou l'email de l'utilisateur créé
4. Vérifiez que toutes les informations sont correctes :
   - Le nom s'affiche correctement
   - Le rôle est bien celui assigné
   - Le statut est "Actif" (si c'était votre choix)
   - La date de création correspond à aujourd'hui

#### Vérification de l'email de bienvenue

Si vous avez coché l'option d'envoi d'email :

1. Demandez à l'utilisateur de vérifier sa boîte de réception
2. L'email peut prendre quelques minutes pour arriver
3. Pensez à vérifier le dossier spam/courrier indésirable
4. L'email contient généralement :
   - Les identifiants de connexion
   - Un lien d'activation du compte
   - Un lien vers la page de connexion
   - Les instructions de première connexion

#### Test de connexion (Recommandé)

Pour s'assurer que tout fonctionne :

1. Ouvrez une fenêtre de navigation privée/incognito
2. Accédez à la page de connexion de la plateforme
3. Entrez les identifiants du nouvel utilisateur
4. Vérifiez que la connexion s'effectue correctement
5. Confirmez que les permissions sont appliquées comme prévu
6. Déconnectez-vous et fermez la fenêtre privée

### Résolution des erreurs courantes lors de la création

#### Erreur : "Cette adresse email existe déjà"

**Cause** : Un compte avec cet email est déjà enregistré dans le système

**Solutions** :

1. Vérifiez l'orthographe de l'email
2. Recherchez si l'utilisateur existe déjà dans la liste
3. Si c'est un compte ancien désactivé, réactivez-le plutôt que d'en créer un nouveau
4. Utilisez une adresse email alternative si nécessaire

#### Erreur : "Le mot de passe ne respecte pas les critères de sécurité"

**Cause** : Le mot de passe est trop faible

**Solutions** :

1. Assurez-vous que le mot de passe contient au moins 8 caractères
2. Ajoutez des majuscules, des chiffres et des caractères spéciaux
3. Utilisez le générateur automatique de mot de passe
4. Consultez l'indicateur de force du mot de passe

#### Erreur : "Les mots de passe ne correspondent pas"

**Cause** : Le mot de passe et la confirmation sont différents

**Solutions** :

1. Effacez les deux champs
2. Ressaisissez le mot de passe soigneusement
3. Utilisez la fonction "Afficher le mot de passe" pour vérifier
4. Copiez-collez depuis le premier champ vers le second si autorisé

#### Erreur : "Vous n'avez pas les permissions nécessaires"

**Cause** : Votre compte n'a pas les droits pour créer des utilisateurs

**Solutions** :

1. Vérifiez vos permissions dans les paramètres de compte
2. Contactez un administrateur principal
3. Demandez l'attribution des permissions "Gestion des utilisateurs"

---

## Modification des informations utilisateur

### Vue d'ensemble du processus de modification

La modification d'un utilisateur existant permet de mettre à jour ses informations personnelles, de changer son rôle, d'ajuster ses permissions ou de corriger des erreurs. Ce processus est similaire à la création, mais avec des précautions supplémentaires pour éviter de perturber l'accès d'un utilisateur actif.

### Étape 1 : Localiser l'utilisateur à modifier

#### Méthode A : Recherche directe

1. Depuis la page principale du module Utilisateurs, repérez la **barre de recherche** en haut
2. Cliquez dans le champ de recherche
3. Commencez à taper :
   - Le nom complet de l'utilisateur, ou
   - Son adresse email, ou
   - Son nom d'utilisateur
4. Les résultats se filtrent automatiquement au fur et à mesure de votre saisie
5. Identifiez l'utilisateur souhaité dans la liste filtrée

#### Méthode B : Navigation dans la liste

1. Parcourez la liste complète des utilisateurs
2. Utilisez les **contrôles de pagination** en bas de page pour naviguer :
   - Cliquez sur **"Suivant"** pour voir la page suivante
   - Cliquez sur un numéro de page spécifique pour y accéder directement
   - Ajustez le nombre de résultats par page (25, 50, 100) pour voir plus d'utilisateurs
3. Utilisez le **tri des colonnes** pour faciliter la recherche :
   - Cliquez sur l'en-tête "Nom" pour trier alphabétiquement
   - Cliquez sur "Date de création" pour trier chronologiquement

#### Méthode C : Utilisation des filtres

1. Cliquez sur le bouton **"Filtres"** ou dépliez la zone de filtrage
2. Appliquez des critères pour affiner la liste :
   - **Filtre par rôle** : Sélectionnez "Administrateur", "Gestionnaire" ou "Utilisateur"
   - **Filtre par statut** : Choisissez "Actif" ou "Inactif"
   - **Filtre par département** : Sélectionnez un département spécifique
   - **Filtre par date** : Définissez une plage de dates de création
3. Cliquez sur **"Appliquer les filtres"**
4. La liste se met à jour pour n'afficher que les utilisateurs correspondants
5. Localisez votre utilisateur dans la liste filtrée

### Étape 2 : Accéder au mode édition

#### Ouvrir le formulaire de modification

1. Une fois l'utilisateur localisé dans la liste, repérez la colonne **"Actions"** à droite de la ligne
2. Identifiez l'icône **✏️ Éditer** (généralement un crayon)
3. Cliquez sur cette icône
4. Le formulaire de modification s'ouvre :
   - Soit dans une fenêtre modale (pop-up) au centre de l'écran
   - Soit dans une nouvelle page dédiée
5. Le formulaire est pré-rempli avec toutes les informations actuelles de l'utilisateur

#### Méthode alternative : Clic sur la ligne

Dans certaines interfaces :

1. Cliquez n'importe où sur la ligne de l'utilisateur (pas sur les icônes d'action)
2. Un panneau latéral ou une nouvelle page s'ouvre
3. Cliquez sur le bouton **"Modifier"** ou **"Éditer"** en haut de ce panneau
4. Le formulaire de modification devient actif

### Étape 3 : Modifier les informations personnelles

#### Modification du nom

1. Repérez le champ **"Nom complet"**
2. Cliquez dans le champ pour activer l'édition
3. Le texte existant est sélectionné ou un curseur apparaît
4. Modifiez le nom selon vos besoins :
   - Utilisez les touches **Retour arrière** ou **Suppr** pour effacer
   - Tapez le nouveau nom ou les corrections
5. Vérifiez l'orthographe et les majuscules

#### Modification de l'email

**Important** : Modifier l'email affecte les identifiants de connexion

1. Cliquez dans le champ **"Email"**
2. Modifiez l'adresse email
3. Un message d'avertissement peut apparaître :
   - "Attention : L'utilisateur devra se connecter avec cette nouvelle adresse"
4. Le système vérifie immédiatement si le nouvel email est déjà utilisé
5. Si l'email existe, un message d'erreur s'affiche : "Cette adresse est déjà associée à un autre compte"
6. Options disponibles :
   - ☐ **Envoyer un email de notification du changement**
     - Cochez pour informer l'utilisateur de la modification
   - ☐ **Conserver l'ancien email comme email secondaire**
     - Permet de garder une trace de l'ancienne adresse

#### Modification du téléphone

1. Cliquez dans le champ **"Numéro de téléphone"**
2. Mettez à jour le numéro
3. Respectez le format attendu (avec ou sans indicatif international)
4. Exemple : `+1 514 555 0123`

#### Modification de la photo de profil

**Pour remplacer une photo existante** :

1. Cliquez sur la photo de profil actuelle ou sur le bouton **"Changer la photo"**
2. Sélectionnez **"Télécharger une nouvelle image"**
3. Choisissez le nouveau fichier image
4. Ajustez le recadrage si nécessaire
5. Cliquez sur **"Valider"** pour confirmer

**Pour supprimer une photo** :

1. Cliquez sur la photo de profil
2. Sélectionnez **"Supprimer la photo"**
3. Une boîte de dialogue de confirmation apparaît
4. Cliquez sur **"Oui, supprimer"**
5. L'avatar par défaut remplace la photo personnalisée

### Étape 4 : Modification du rôle et des permissions

#### Changement de rôle

**Avant de modifier un rôle, considérez :**

- Les implications sur les accès existants de l'utilisateur
- Les projets ou tâches en cours nécessitant ses permissions actuelles
- La hiérarchie organisationnelle

**Procédure de modification :**

1. Localisez la section **"Rôle"** dans le formulaire
2. Cliquez sur le menu déroulant affichant le rôle actuel
3. La liste des rôles disponibles s'affiche :
   - Administrateur
   - Gestionnaire
   - Utilisateur
4. Sélectionnez le nouveau rôle souhaité

**Avertissements possibles selon le changement :**

**Passage de Utilisateur → Gestionnaire ou Administrateur :**

- Message : "Vous accordez des permissions élevées à cet utilisateur"
- Confirmez que c'est intentionnel

**Passage d'Administrateur → Gestionnaire ou Utilisateur :**

- Message : "Attention : Cet utilisateur perdra ses accès administratifs"
- Listez les permissions qui seront révoquées
- Une confirmation explicite est requise

**Rétrogradation de votre propre compte :**

- Message d'alerte : "Vous êtes sur le point de réduire vos propres permissions"
- Avertissement : "Vous ne pourrez peut-être pas modifier ce compte par la suite"
- Confirmation en deux étapes requise

5. Cochez la case **"Je comprends les implications de ce changement"**
6. Cliquez sur **"Confirmer le changement de rôle"**

#### Ajustement des permissions spécifiques

Si le système offre des permissions granulaires :

1. Repérez l'onglet ou la section **"Permissions détaillées"**
2. Cliquez pour développer cette section
3. Vous voyez une liste de permissions organisées par catégories :

\*\*Catégorie : G
