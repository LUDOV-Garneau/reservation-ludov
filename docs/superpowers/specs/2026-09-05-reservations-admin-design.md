# Refonte de l'onglet « Réservations » de l'admin

Date : 2026-09-05

## Problème

L'onglet « Réservations » filtre par date **côté client, sur la page affichée**.
[ReservationsTable.tsx](../../../src/components/admin/reservations/list/ReservationsTable.tsx)
applique `filterReservations` aux dix lignes déjà reçues, alors que la recherche
texte, elle, est partie côté serveur. Filtrer sur le 3 septembre renvoie donc
« Aucune réservation trouvée » dès que ce jour n'est pas dans la première page,
sans que rien ne le signale, et la pagination continue d'annoncer le total non
filtré.

Quatre défauts s'ajoutent :

- aucun filtre par statut, alors que la route calcule déjà
  `cancelledReservations` — un compteur **jamais affiché** ;
- le tri par défaut est `date DESC, time DESC` : la réservation la plus lointaine
  dans le futur arrive en tête, et les créneaux de la semaine sont enterrés ;
- 31 couleurs en dur sur 8 fichiers (`hover:bg-gray-200` sur chaque ligne,
  `bg-red-50` sur la modale d'annulation) → onglet illisible en mode sombre ;
- des textes hors i18n (« Rafraîchir », « Complétée », toute la modale
  d'annulation) alors que les clés `deleteDialog.*` existent et ne sont pas
  lues, et `actionBar.toolTipRefresh` vaut « Rechercher… », ce qui est faux.

## Décisions de périmètre

**Les annulées restent visibles par défaut.** Le filtre de statut sert à isoler
une catégorie, pas à révéler des lignes cachées. En contrepartie la statistique
« total » — qui excluait les annulées — est doublée d'un compteur « annulées »,
de sorte que les quatre tuiles se recomposent : `total = à venir + passées`, et
`annulées` à côté.

**Le tri par défaut place les créneaux les plus proches en tête.** C'est ce que
l'équipe regarde en arrivant. Les colonnes date, usager, plateforme et statut
deviennent triables, l'état étant persisté dans l'URL.

Hors périmètre : sélection multiple, annulation en lot, export CSV.

## API — `GET /api/admin/reservations`

Paramètres, tous facultatifs, tous validés côté serveur avec repli silencieux
sur le défaut — une URL trafiquée à la main ne doit jamais casser la page :

| Param | Valeurs | Défaut |
| --- | --- | --- |
| `page` | entier ≥ 1 | `1` |
| `limit` | 10, 25, 50, 100 | `10` |
| `search` | texte libre (inchangé) | vide |
| `from` / `to` | `YYYY-MM-DD`, bornes incluses | aucune borne |
| `status` | `all` \| `upcoming` \| `past` \| `cancelled` | `all` |
| `sort` | `schedule` \| `user` \| `console` \| `status` | `schedule` |
| `dir` | `asc` \| `desc` | `asc` |

Une journée précise s'exprime `from=to=` ; le couple « mode spécifique / mode
plage » du composant actuel disparaît au profit de ces deux bornes. `from > to`
est un intervalle vide, pas une erreur : la liste est vide et la pagination
annonce zéro.

`status` se lit contre le même « maintenant » que les statistiques :
`upcoming` = non annulée et postérieure à l'instant courant, `past` = non
annulée et antérieure, `cancelled` = `archived = 1`.

Le tri `schedule` s'écrit en une clause :

```sql
ORDER BY is_past ASC,
         CASE WHEN is_past = 0 THEN dt END ASC,
         CASE WHEN is_past = 1 THEN dt END DESC
```

soit le prochain créneau en tête, puis les créneaux écoulés du plus récent au
plus ancien. `dir=desc` inverse l'ensemble.

**Le « maintenant » vient de Node**, jamais de `CURDATE()` / `CURTIME()` : c'est
déjà la règle de la route, et c'est ce qui évite que le fuseau du serveur MySQL
décale la frontière passé/futur.

`reservation` n'a aucun index sur `(date, time)` — [schema.ts](../../../src/db/schema.ts)
n'indexe que les clés étrangères et les rappels. Une migration Drizzle ajoute
`ix_res_date_time`, sans quoi chaque filtre de date balaie la table entière.

Les quatre compteurs renvoyés restent **globaux**, non filtrés : c'est un
tableau de bord. Le nombre de résultats du filtre courant est annoncé par la
barre de filtres et par la pagination.

## Découpage des composants

```
src/components/admin/reservations/list/
  ReservationsManager.tsx      orchestration
  ReservationsFilters.tsx      recherche + dates + statut + puces + réinit.
  ReservationsStatsBar.tsx     4 tuiles cliquables → appliquent le filtre
  ReservationsTable.tsx        en-têtes triables + corps + carte mobile
  ReservationRow.tsx           (ex-ReservationTableRow)
  ReservationsSkeleton.tsx
  Pagination.tsx               inchangé, hors couleur en dur
src/hooks/useReservationsFilters.ts    état dans le query string
src/lib/reservationsQuery.ts           params → clauses Drizzle, pur
```

`filterReservations`, `parseDateString` et `normalizeDate` disparaissent : le
filtrage part côté serveur. `ActionBar` est fondu dans `ReservationsFilters`,
ce qui règle au passage son nom d'export (`CardReservationStats`, copié-collé
de la barre de stats) et ses deux props mortes `onSuccess` / `onAlert`.
`usePagination` cède la place à la page lue dans l'URL.

`useReservationsFilters` reprend mot pour mot les deux règles de
[useAccessoriesFilters](../../../src/hooks/useAccessoriesFilters.ts), déjà en
place sur Accessoires, Jeux et Plateformes : une valeur par défaut ne s'écrit
jamais dans l'URL, une valeur invalide retombe silencieusement sur le défaut.
Les paramètres étrangers au hook sont préservés, à commencer par `tab`.

`src/lib/reservationsQuery.ts` est pur : il transforme les `searchParams` en
un objet `{page, limit, search, from, to, status, sort, dir}` normalisé et
expose les prédicats de statut. Il ne touche ni à Drizzle ni au réseau, donc il
se teste sans base.

## Présentation, mode sombre, i18n

Les 31 couleurs en dur passent aux tokens (`bg-card`, `border-border`,
`hover:bg-muted/50`, `text-muted-foreground`), y compris le `hover:bg-gray-200`
de chaque ligne et le bandeau `bg-red-50` / `text-red-900` de la modale
d'annulation, aujourd'hui illisible en thème sombre. Les badges de statut
abandonnent `bg-red-500` / `bg-cyan-500` / `bg-green-500` pour des paires
teinte-claire / teinte-sombre qui tiennent le contraste dans les deux thèmes.

Sous `md`, la table replie six colonnes sur dix : il ne reste que plateforme,
statut et actions. Elle est remplacée par une carte empilée qui garde usager,
date, heure et plateforme visibles.

Textes remis dans l'i18n : « Rafraîchir », « Complétée », et toute la modale
`DeleteReservationAction` — dont les clés `deleteDialog.*` déjà présentes dans
`fr.json` et `en.json`. `actionBar.toolTipRefresh` est corrigé.

## Tests

`src/lib/reservationsQuery.test.ts` couvre :

- bornes de date : `from` seul, `to` seul, les deux, `from > to`, format
  invalide ;
- les quatre statuts et le repli sur `all` ;
- l'ordre par défaut et l'inversion par `dir` ;
- le repli des valeurs invalides : `limit` hors liste, `page` négative, `sort`
  inconnu.

Pas de test d'intégration base : le dépôt n'a pas de harnais pour ça.

Vérification : `tsc --noEmit`, `eslint` et `vitest`. `npm run build` échoue de
toute façon en local sur ce disque, indépendamment de ce changement.
