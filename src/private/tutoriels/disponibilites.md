# Gestion des disponibilités

Ce guide explique comment définir les plages horaires d'ouverture du laboratoire LUDOV. Le système fonctionne avec deux types de disponibilités : les horaires hebdomadaires récurrents et les ouvertures spécifiques.

## 1. Disponibilités par semaine (récurrent)

L'onglet **Par semaine** permet de définir l'horaire standard qui se répète chaque semaine.

![Vue d'ensemble de la semaine](/api/admin/images/disponibilites/semaine.png)

### Configuration des jours

1.  **Activation des jours** : Utilisez les interrupteurs (toggles) pour activer ou désactiver chaque jour de la semaine. Un jour désactivé signifie que le laboratoire est fermé.
2.  **Plages horaires** : Pour chaque jour activé, définissez les heures d'ouverture (ex: 9h00 à 17h00). Vous pouvez ajouter plusieurs plages pour une même journée (ex: matin et après-midi).

![Configuration hebdomadaire](/api/admin/images/disponibilites/semaine-hebdomadaire.png)

### Période de validité

Vous pouvez définir pour quelle période cet horaire hebdomadaire est valide :
*   **Toujours valide** : L'horaire s'applique indéfiniment.
*   **Plage de dates** : L'horaire ne s'applique que pour une période donnée (ex: Session Automne 2025).

![Option de validité](/api/admin/images/disponibilites/semaine-disponibilite-toujours.png)

### Exceptions (Blocage)

Les exceptions dans cet onglet servent à **bloquer** des plages horaires pour des dates précises (ex: jour férié, absence du responsable).
*   Sélectionnez une date spécifique.
*   Indiquez les heures où le laboratoire sera fermé exceptionnellement, malgré l'horaire hebdomadaire.

![Exceptions de la semaine](/api/admin/images/disponibilites/semaine-exceptions.png)

## 2. Disponibilités spécifiques (ouvertures supplémentaires)

L'onglet **Dates spécifiques** est utilisé pour ajouter des ouvertures ponctuelles qui ne font pas partie de l'horaire régulier (ex: ouverture spéciale fin de session, fin de semaine de jam).

![Sélection dates spécifiques](/api/admin/images/disponibilites/specifique-selection.png)

1.  Sélectionnez la ou les dates désirées dans le calendrier.
2.  Définissez les plages horaires d'ouverture pour ces dates.

![Configuration spécifique](/api/admin/images/disponibilites/specifique.png)

Ces disponibilités s'ajoutent à l'horaire hebdomadaire existant.

## Enregistrement

N'oubliez pas de sauvegarder vos modifications en cliquant sur le bouton de confirmation pour qu'elles soient prises en compte par le système de réservation.
