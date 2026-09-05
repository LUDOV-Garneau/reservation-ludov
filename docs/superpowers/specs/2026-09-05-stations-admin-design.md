# Refonte de l'onglet « Stations » de l'admin

Date : 2026-09-05

## Problème principal : la suppression détruit l'historique

[delete-station/route.ts](../../../src/app/api/admin/delete-station/route.ts)
exécute `db.delete(reservation).where(eq(reservation.station, stationId))`
**avant** de supprimer la station. Supprimer une station efface donc toutes ses
réservations, passées comprises — tout l'historique de fréquentation de ce
poste — et la modale n'annonce que « Cette action est définitive ».

Les clés `deleteStationDialog.whatGonnaHappen`, `theStation`, `deleted`,
`stationWontBeAccessible` et `reservationDeleted` (« Les réservations à venir
seront également supprimées ») existent dans `fr.json` et `en.json` : quelqu'un
a écrit l'avertissement, il n'a jamais été rendu.

**Décision** : la suppression est refusée quand la station porte au moins une
réservation. L'API répond 409 avec le décompte, et la modale propose de
**désactiver** la station à la place — ce qui la retire du parcours de
réservation sans toucher à l'historique. Une station sans aucune réservation
reste supprimable.

## Les autres défauts

**La recherche ne cherche que la page affichée.** `filteredStations` filtre les
dix lignes déjà reçues ; il n'y a aucune recherche côté serveur. Même faute que
l'onglet Réservations avant sa refonte.

**La colonne des plateformes n'existe pas.** L'API renvoie `consoles` et
`consolesId`, le client s'en sert uniquement pour la recherche locale, et les
clés `table.header.platforms` / `table.noPlatforms` ne sont jamais lues. Or
c'est la donnée qui décide de ce qu'une station peut accueillir.

**Les dates de création sont fausses.** `add-station` et `update-station`
écrivent `new Date().toISOString().slice(0, 19)`, soit de l'UTC dans une colonne
`datetime` que tout le reste de l'application lit en heure locale : la date
affichée dans la table décale de quatre à cinq heures, et bascule d'un jour en
soirée.

**Le code mort.** `ConfirmDialog` et l'état `confirmDialog` occupent une
soixantaine de lignes que rien n'ouvre : `setConfirmDialog` n'est jamais appelé
avec autre chose que `null`. `AddStationForm` embarque un bloc `<style jsx>` qui
définit une animation `slideIn` inutilisée. `StationsTab` déclare un `t` dont il
ne se sert pas. `ActionBar` est exporté sous le nom `CardStationStats`.

**La duplication.** `AddStationForm` (336 lignes) et `UpdateStationForm` (381)
sont le même formulaire à un interrupteur près. `useAlert` est recopié dans
quatre fichiers. Deux composants `Pagination` quasi identiques coexistent, et
Stations importait celui de l'onglet Utilisateurs.

**L'authentification.** Quatre routes recopient les cinq mêmes lignes de
`verifyToken` au lieu d'utiliser `withAdmin`, déjà en place ailleurs.

**Les validations manquantes.** `limit` et `page` ne sont pas bornés
(`limit=100000` passe) ; l'unicité du nom est vérifiée à la création mais pas à
la modification, donc deux stations peuvent finir homonymes ; les identifiants
de plateformes ne sont jamais confrontés à `console_type`.

**Le reste.** Aucun tri, aucun filtre actives/inactives, aucun état dans l'URL.
Date formatée en `fr-FR` quelle que soit la locale. Une quinzaine de chaînes
françaises en dur dans les formulaires. Couleurs en dur (`border-gray-200`,
`bg-red-50`, `hover:bg-gray-100`) donc illisible en thème sombre.

## API

Les quatre routes verbales sont remplacées par une ressource :

| Avant | Après |
| --- | --- |
| `GET /api/admin/stations` | inchangé, enrichi |
| `POST /api/admin/add-station` | `POST /api/admin/stations` |
| `PUT /api/admin/update-station` | `PATCH /api/admin/stations/[id]` |
| `DELETE /api/admin/delete-station` | `DELETE /api/admin/stations/[id]` |

Toutes passent par `withAdmin`.

### `GET /api/admin/stations`

Paramètres, validés avec repli silencieux sur le défaut :

| Param | Valeurs | Défaut |
| --- | --- | --- |
| `page` | entier ≥ 1 | `1` |
| `limit` | 10, 25, 50, 100 | `10` |
| `all` | `1` pour tout renvoyer, sans pagination | absent |
| `search` | nom de station ou nom de plateforme | vide |
| `status` | `all` \| `active` \| `inactive` | `all` |
| `sort` | `name` \| `created` \| `platforms` \| `status` | `name` |
| `dir` | `asc` \| `desc` | `asc` |

`all=1` existe pour [GamesImagesManager](../../../src/components/admin/games/GamesImagesManager.tsx),
seul autre appelant de la route, qui demandait jusqu'ici `limit=200` — valeur
qu'un `limit` borné rejetterait.

La forme du corps (`data.stations`, `data.total`) est **inchangée**, pour que ce
même appelant n'ait rien à réapprendre au-delà du paramètre.

La recherche porte sur le nom de la station et sur le nom des plateformes
qu'elle propose. `consoles` étant une colonne `json` d'identifiants, la
correspondance par plateforme est résolue en amont : les ids des `console_type`
dont le nom correspond sont cherchés d'abord, puis comparés au tableau via
`JSON_OVERLAPS`.

### `DELETE /api/admin/stations/[id]`

Compte d'abord les réservations rattachées. S'il y en a, répond **409** avec
`{ reservations, upcoming }` et ne touche à rien. Sinon supprime la station.

### `POST` et `PATCH`

Corps lus par `src/lib/stationUpdate.ts`, fonctions pures testées séparément.

`readStationPayload` (création) exige le nom — trimé, non vide, borné à 255
caractères — et `consoles`, tableau non vide d'entiers positifs dédoublonnés et
ordonnés. `isActive` n'y est pas accepté : une station naît active.

`readStationPatch` (modification) n'exige **aucun** champ, mais valide ceux qui
sont présents avec les mêmes règles. C'est ce qui permet de désactiver une
station en n'envoyant que `{isActive: false}` — exiger le corps complet rendait
indésactivable une station sans plateforme, précisément le cas où on veut la
retirer du parcours. Un patch vide est refusé (400) plutôt que d'aboutir à une
mise à jour qui ne toucherait que `lastUpdatedAt`.

Le nom est vérifié unique dans les deux cas, en excluant la station elle-même au
`PATCH`. Les identifiants de plateformes sont confrontés à `console_type` : un
id inconnu donne un 400 qui le nomme, plutôt qu'une station silencieusement
bancale.

Les horodatages sont écrits en heure locale via `toLocalDatetime`, ajouté à
`src/lib/dates.ts` à côté de `toLocalYmd`, et non plus en UTC.

## Découpage des composants

```
src/components/admin/stations/
  StationsManager.tsx        orchestration
  StationsFilters.tsx        recherche + statut + puces + ajout + rafraîchir
  StationsStatsBar.tsx       4 tuiles cliquables
  StationsTable.tsx          en-têtes triables, colonne Plateformes
  StationRow.tsx
  StationCard.tsx            rendu mobile
  StationFormDialog.tsx      création ET modification, un seul formulaire
  DeleteStationDialog.tsx    gère le 409 et propose la désactivation
  StationsSkeleton.tsx
src/hooks/useStationsFilters.ts
src/hooks/useAlert.ts        promu depuis reservations/list/hooks
src/components/admin/Pagination.tsx   promu depuis reservations/list
src/lib/stationsQuery.ts     params de liste → requête, pur
src/lib/stationUpdate.ts     corps POST/PATCH → valeurs validées, pur
```

Disparaissent : `ActionBar.tsx`, `CardStats.tsx`, `AddStationForm.tsx`,
`UpdateStationForm.tsx`, `DialogConfirmationDeleteStation.tsx`, l'ancien
`StationsTable.tsx`, et les routes `add-station`, `update-station`,
`delete-station`.

`useStationsFilters` reprend les deux règles des autres onglets : un défaut ne
s'écrit jamais dans l'URL, une valeur invalide retombe silencieusement dessus.

Les copies de `useAlert` restées dans `UsersTable` et `CoursTable` ne sont pas
touchées : ce sont d'autres onglets, ils auront leur propre refonte.

## Présentation

Tokens partout, plus une seule couleur en dur : bandeau de suppression et
encarts de plateformes en paires claire/sombre. La table gagne la colonne
Plateformes — badges tronqués au-delà de trois, le reste en `+ n`. Sous `md`,
carte empilée plutôt qu'une table amputée. Date affichée dans la locale active.

Toutes les chaînes françaises en dur des deux formulaires passent à l'i18n, y
compris le décompte « n plateformes sélectionnées », aujourd'hui pluralisé à la
main avec un `s` conditionnel.

## Tests

`src/lib/stationsQuery.test.ts` : bornes de `page` et `limit`, `all=1`, les
trois statuts, les quatre clés de tri, repli des valeurs invalides.

`src/lib/stationUpdate.test.ts` : nom vide, blanc, trop long, trimé ; `consoles`
absent, vide, non tableau, valeurs non entières ou négatives, dédoublonnage ;
rejet des champs inattendus ; et pour le patch, chaque champ seul, la
désactivation d'une station sans plateforme, et le refus du patch vide.

Pas de test d'intégration base : le dépôt n'a pas de harnais pour ça.

Vérification : `tsc --noEmit`, `eslint`, `vitest`. `npm run build` échoue de
toute façon en local sur ce disque.
