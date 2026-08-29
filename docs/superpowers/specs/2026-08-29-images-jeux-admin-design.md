# Images des jeux (module admin) : filtres persistants, pagination réglable et retravail du UI

Date : 2026-08-29
Onglet visé : `admin > Images des jeux` (`?tab=games`)

## Problème

L'onglet des images de jeux sert à repérer les jeux sans jaquette et à leur en
donner une. Trois choses le rendent pénible :

1. La taille de page est figée à 12 items. Sur un catalogue de plusieurs
   centaines de jeux, parcourir les manques prend un nombre de clics absurde.
2. Les seuls filtres sont le titre et avec/sans image. Impossible de dire
   « montre-moi les jeux PS2 sans jaquette », alors que c'est exactement la
   façon dont le travail se fait : on traite un lot par console ou par station.
3. L'état de la vue vit uniquement en mémoire React. Un rechargement, un
   aller-retour vers un autre onglet ou un lien partagé repart de zéro.

S'y ajoute un problème de forme : un tableau à miniatures de 48 px est un
mauvais support pour un écran dont le sujet *est* l'image.

## Périmètre

Dans le périmètre :

- sélecteur du nombre d'items par page ;
- filtres par console et par station, en plus de la recherche et de
  avec/sans image ;
- persistance de tout l'état de la vue dans l'URL ;
- retravail du UI : bascule entre une vue grille et une vue tableau, barre de
  filtres compacte, puces de filtres actifs.

Hors périmètre, explicitement (à demander séparément si voulu) :

- bouton « retirer une image » (absent aujourd'hui côté jeux) ;
- suppression des fichiers orphelins sur le volume au remplacement ;
- élargissement de l'allowlist d'import distant (`images.igdb.com`,
  `cdn.mobygames.com`).

## Ce qui existe aujourd'hui

- `src/components/admin/games/GamesImagesTable.tsx` (320 lignes) : tableau
  paginé (12/page), recherche débouncée à 350 ms, filtre `hasImage`, bouton de
  rafraîchissement, dialogue d'import branché sur `ImageUploadField`.
- `GET /api/admin/games` : recherche par titre, filtre `hasImage`, pagination
  serveur, `pageSize` plafonné à 50.
- `PATCH /api/admin/games/[id]/image` : accepte `{ path }` ou `{ url }`.
- `src/components/admin/reservations/list/Pagination.tsx`
  (`PaginationControls`) : composant de pagination partagé, sans notion de
  taille de page. Également utilisé par l'onglet Réservations.
- `src/app/[locale]/(main)/admin/page.tsx` : synchronise déjà `?tab=` avec
  `router.replace`, en recopiant les params existants.

Faits de schéma qui cadrent la solution (`src/db/schema.ts`) :

- `games.consoleTypeId` est une clé étrangère nullable vers `console_type`,
  avec l'index `ix_games_console_type`. `games.platform` est un varchar libre
  hérité, moins fiable.
- `stations.consoles` est une colonne JSON contenant un tableau d'**ids de
  `console_type`**. C'est confirmé par `src/app/api/admin/stations/route.ts`,
  qui résout ce tableau en noms via `console_type`, et par
  `AddStationForm.tsx:120` qui l'écrit.

## Décisions

### D1 — « Filtrer par station » signifie « jouable sur les consoles de cette station »

Il n'existe pas de lien direct jeu → station. Le seul chemin est
`station.consoles` (ids de types de console) → `games.consoleTypeId`. Le
filtre station est donc résolu côté serveur en une liste d'ids de types de
console.

### D2 — Le filtre console s'appuie sur `consoleTypeId`, pas sur `platform`

`consoleTypeId` est une vraie clé étrangère, indexée, et alimentée par la
synchro Koha. `platform` est du texte libre et se prête mal à un filtre exact.

Conséquence assumée : les jeux dont `consoleTypeId` est NULL disparaissent dès
qu'un filtre console ou station est actif. Ils restent visibles sans filtre.
Aucune option « sans console associée » n'est ajoutée.

### D3 — L'état de la vue vit dans l'URL, écrit avec `router.replace`

`push` créerait une entrée d'historique par frappe au clavier dans la
recherche débouncée. `replace` garde le bouton Retour utilisable.

### D4 — Les valeurs par défaut ne sont jamais écrites dans l'URL

L'URL reste courte et lisible, et une URL nue équivaut à l'état par défaut.

### D5 — Le sélecteur de taille de page est ajouté à `PaginationControls` en props optionnelles

Le composant est partagé avec l'onglet Réservations. Sans les nouvelles props,
son comportement et son rendu sont strictement inchangés.

### D6 — La vue grille est le défaut

L'écran sert à repérer des images manquantes ; une grille rend les trous
visibles d'un coup d'œil. Le tableau reste disponible pour la lecture dense.

## Conception

### État de la vue et URL

Un hook `useGamesImagesFilters` est l'unique propriétaire de la lecture et de
l'écriture de l'état de la vue dans le query string.

| Param     | Valeurs                     | Défaut (omis de l'URL) |
| --------- | --------------------------- | ---------------------- |
| `q`       | texte libre                 | vide                   |
| `img`     | `all` \| `yes` \| `no`      | `all`                  |
| `console` | id entier de `console_type` | tous                   |
| `station` | id entier de `stations`     | toutes                 |
| `size`    | 12 \| 24 \| 48 \| 96        | 12                     |
| `page`    | entier ≥ 1                  | 1                      |
| `view`    | `grid` \| `table`           | `grid`                 |

Exemple : `/admin?tab=games&console=4&img=no`.

Règles :

- Toute valeur invalide ou hors liste retombe silencieusement sur le défaut.
  Une URL trafiquée à la main ne doit jamais casser la page.
- Tout changement de filtre (`q`, `img`, `console`, `station`) ou de `size`
  remet `page` à 1.
- `q` est débouncé à 350 ms avant d'être écrit dans l'URL et déclenché en
  requête, comme aujourd'hui.
- Les params sont écrits en préservant ceux qui ne relèvent pas de ce hook, à
  commencer par `tab`.
- Les filtres restent dans l'URL quand on change d'onglet. C'est voulu :
  revenir sur l'onglet restaure la vue.

### API

`GET /api/admin/games` accepte deux paramètres de plus :

- `consoleTypeId` : entier. Ajoute `games.console_type_id = ?`.
- `stationId` : entier. Le serveur charge la station, lit son tableau
  `consoles`, et ajoute `games.console_type_id IN (...)`.

Points de rupture à traiter explicitement :

- Station introuvable, ou station dont `consoles` est vide ou n'est pas un
  tableau : la requête doit renvoyer **zéro résultat**, pas le catalogue
  entier. `inArray` sur un tableau vide produit du SQL invalide en Drizzle ; le
  cas est court-circuité avant la requête.
- `consoleTypeId` et `stationId` fournis ensemble : les deux conditions
  s'appliquent (intersection). Si la console choisie n'appartient pas à la
  station, zéro résultat est le comportement correct.
- Paramètres non numériques : ignorés comme si absents.

Le plafond de `pageSize` passe de 50 à 100, pour rendre l'option 96 utilisable.

La réponse expose en plus le nom du type de console (jointure `LEFT JOIN` sur
`console_type`), afin que l'affichage montre la console réelle plutôt que le
champ texte `platform`. Le champ `platform` reste renvoyé, en repli quand
`consoleTypeId` est NULL.

Les listes des menus déroulants sont chargées depuis les endpoints existants :
`GET /api/admin/console-type` et `GET /api/admin/stations?page=1&limit=200`.
Aucun nouvel endpoint n'est créé.

### UI

**Barre de filtres** — une ligne : champ de recherche large, puis trois menus
(console, station, avec/sans image), et à droite la bascule de vue ▦/≡ et le
bouton de rafraîchissement. Elle passe en colonnes empilées sous `sm`.

**Puces de filtres actifs** — sous la barre, une puce par filtre non-défaut,
chacune retirable d'un clic, suivie du nombre de résultats. C'est ce qui rend
l'état compréhensible quand on arrive par une URL filtrée.

**Vue grille (défaut)** — cartes à jaquette large, ratio d'image fixe,
`object-cover`. Une carte sans image affiche un placeholder franc plutôt qu'un
blanc discret. Le bouton d'édition apparaît au survol **et au focus clavier** ;
la carte entière est activable.

**Vue tableau** — le tableau actuel, resserré : miniature plus grande, ligne
entière cliquable, libellé du bouton « Ajouter » ou « Modifier » selon l'état
de l'image.

**Pagination** — `PaginationControls` reçoit deux props optionnelles,
`pageSizeOptions` et `onPageSizeChange`, qui affichent un menu de taille de
page à côté du compteur « Affichage X-Y sur N ». Absentes, le composant rend
exactement ce qu'il rend aujourd'hui.

**Coût des images** — à 96 vignettes par page, le chargement compte. Les
images passent en `loading="lazy"` avec un attribut `sizes` correspondant aux
points de rupture de la grille.

### Découpage des fichiers

`GamesImagesTable.tsx` fait déjà 320 lignes et absorberait tout le nouveau
travail. Il est découpé en unités à responsabilité unique :

```
src/hooks/useGamesImagesFilters.ts    lecture/écriture de l'état dans l'URL
src/components/admin/games/
  GamesImagesManager.tsx              conteneur : fetch, état, choix de la vue
  GamesImagesFilters.tsx              barre + puces actives + bascule de vue
  GamesImagesGrid.tsx                 vue grille
  GamesImagesTable.tsx                vue tableau, allégée
  GameImageDialog.tsx                 dialogue d'import, extrait tel quel
```

`GamesImagesTab.tsx` importe désormais `GamesImagesManager`.

Le hook ne connaît que l'URL ; les composants de vue ne reçoivent que des
données et des rappels, sans toucher au routeur. Chaque fichier reste lisible
d'un seul tenant.

### Traductions

De nouvelles clés sont ajoutées sous `admin.gamesImages` dans
`src/i18n/messages/fr.json` **et** `en.json` : libellés des filtres console et
station, options « toutes », libellés de la bascule de vue, libellé du
sélecteur de taille de page, libellé de retrait d'une puce, et le libellé du
bouton « Ajouter » distinct de « Modifier ».

Attention : les deux fichiers de messages sont déjà modifiés dans l'arbre de
travail. Les clés doivent être ajoutées sans écraser ces modifications en
cours.

## Vérification

Le dépôt n'a aucun framework de test (`package.json` ne contient ni vitest, ni
jest, ni playwright), et `npm run build` échoue en local à cause du système de
fichiers exFAT. La vérification repose donc sur :

- `npx tsc --noEmit`
- `npm run lint`

et sur un passage manuel couvrant les cas qui cassent typiquement :

1. Filtre console seul, station seule, puis les deux ensemble.
2. Station sans consoles associées : liste vide, pas le catalogue entier.
3. Combinaison de filtres sans résultat : état vide, pagination cohérente.
4. Changement de taille de page depuis la page 5 : retour à la page 1.
5. Rechargement d'une URL filtrée : mêmes filtres, même vue, même page.
6. Aller vers un autre onglet puis revenir : filtres restaurés.
7. URL trafiquée (`size=999`, `console=abc`, `view=xyz`) : défauts appliqués,
   pas d'erreur.
8. Bascule grille / tableau : filtres et page conservés.
9. Navigation clavier dans la grille : le bouton d'édition est atteignable.
