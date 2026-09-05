# Refonte de l'onglet « Plateformes » de l'admin

Date : 2026-09-04

## Problème

L'onglet « Plateformes » de l'admin (`?tab=consolePhotos`) ne sait faire qu'une
chose : poser ou retirer la photo d'un `console_type`. Tout le reste de la
plateforme — sa description, ses exemplaires physiques, les stations qui la
proposent — n'est visible nulle part, alors que ce sont ces données qui
décident si une plateforme est réservable.

Trois défauts s'ajoutent :

- le code s'appelle `consolePhotos` alors que l'écran s'appelle « Plateformes » ;
- `DialogConfirmationRemoveConsolePhoto` a ses textes en dur, hors i18n ;
- les deux fichiers utilisent `bg-white` / `text-gray-900` / `bg-red-50`, donc
  sont illisibles en mode sombre.

## Périmètre

Ce que l'admin peut modifier : **photo et description**. Le **nom reste en
lecture seule** — `console_type` est réécrit chaque nuit par la synchro Koha
(dépôt `seeding_ludov`), un nom modifié à la main serait écrasé sans bruit. Le
refus du champ `name` est appliqué côté serveur, pas seulement masqué côté
client.

Les exemplaires (`console_stock`) sont affichés en lecture seule, pour la même
raison.

## API

### `GET /api/admin/console-type`

Trois autres écrans consomment déjà cette route et n'attendent qu'un tableau
`{id, name, picture}` : [AddStationForm](../../../src/components/admin/stations/AddStationForm.tsx),
[UpdateStationForm](../../../src/components/admin/stations/UpdateStationForm.tsx)
et [GamesImagesManager](../../../src/components/admin/games/GamesImagesManager.tsx).
La forme du corps est donc inchangée ; les agrégats n'arrivent que si
`?stats=1` est passé, de sorte que ces trois appelants ne paient pas les
jointures :

| Champ | Source |
| --- | --- |
| `description` | `console_type.description` |
| `unitsTotal` / `unitsActive` | `console_stock` (`is_active = 1 AND holding = 0`) |
| `gamesCount` | `games.console_type_id` |
| `stationsCount` | stations **actives** dont `consoles` contient l'id |

`stationsCount` compte les stations actives parce que c'est le critère du
parcours de réservation : une plateforme sans station active n'est pas
proposée à l'étape 1. L'écran s'en sert pour marquer « non réservable ».

### `PATCH /api/admin/console-type/[id]`

Accepte `picture` et/ou `description`, chacun facultatif, `null` pour vider.
La lecture du corps est extraite dans `src/lib/platformUpdate.ts`, fonction
pure testée séparément : validation du chemin d'image (inchangée), description
trimée et bornée à 2000 caractères, rejet explicite de `name`.

## Composants

```
src/hooks/usePlatformsFilters.ts          recherche, photo=all|yes|no, view=grid|table (dans l'URL)
src/components/admin/PlatformsTab.tsx
src/components/admin/platforms/
  types.ts             PlatformRow, PlatformStats
  platformsLogic.ts    filtrage + calcul des stats — fonctions pures, testées
  PlatformsManager.tsx orchestrateur : chargement, garde anti-course, toasts
  PlatformsStatsBar.tsx
  PlatformsFilters.tsx
  PlatformsGrid.tsx
  PlatformsTable.tsx
  PlatformDialog.tsx   fiche : nom en lecture seule, description, photo
  PlatformsSkeleton.tsx
```

Le découpage suit l'onglet « Jeux », le patron le plus récent du dépôt : un
hook qui porte l'état dans l'URL, un orchestrateur qui parle au réseau, des
vues qui ne reçoivent que des données et des rappels.

La liste entière est chargée une fois (`console_type` compte ~120 lignes) puis
filtrée **et paginée côté client**, avec `PaginationControls` — le composant
déjà partagé par les onglets Réservations et Jeux. Page et taille de page sont
portées par l'URL (`page`, `size`), 24 par défaut.

`src/components/admin/console-photos/` et `ConsolePhotosTab.tsx` disparaissent.

## Nommage

Valeur d'onglet `consolePhotos` → `platforms`, clés i18n `admin.consolePhotos`
→ `admin.platforms` (fr et en). `admin/page.tsx` garde un cas `consolePhotos`
qui rend le même onglet, pour que les liens déjà partagés continuent de
fonctionner.

## Thème

Couleurs semantiques shadcn (`bg-card`, `text-muted-foreground`, `border`) et
variantes `dark:` explicites sur les accents colorés, comme
`UsersStatsBar`. Plus aucun `bg-white` ni `text-gray-*`.

## Vérification

Pas de React Testing Library dans le dépôt et vitest tourne en environnement
`node` : les tests portent sur `platformsLogic.ts` et sur
`src/lib/platformUpdate.ts`. Puis `tsc --noEmit`, `eslint`, `vitest run`, et un
passage dans l'application en clair et en sombre (`npm run build` échoue en
local, disque exFAT).
