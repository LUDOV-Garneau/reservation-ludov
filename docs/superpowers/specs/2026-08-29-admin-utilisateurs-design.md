# Gestion des utilisateurs (module admin) : tri, filtres, actions groupées et retravail du UI

Date : 2026-08-29
Onglet visé : `admin > Utilisateurs` (`?tab=users`, onglet par défaut)

## Problème

L'onglet Utilisateurs est la porte d'entrée du panneau admin : c'est l'onglet
servi par défaut. Il souffre de quatre choses.

1. **La colonne « Nom » est vide en production.** L'API renvoie `firstname` /
   `lastname` (`src/app/api/admin/users/route.ts:31`), le tableau lit
   `user.firstName` / `user.lastName` (`UsersTable.tsx:113`). Aucune couche de
   mapping entre les deux. L'écran affiche donc une liste de lignes sans nom.
2. **On ne peut ni trier ni filtrer.** Recherche plein texte ou rien. Pour
   répondre à « qui sont les admins ? » ou « qui n'a jamais activé son
   compte ? », il faut parcourir les pages à la main — alors que la deuxième
   question est justement celle que la carte de stats « Utilisateur(s) non
   configuré(s) » pose à l'écran sans permettre d'y répondre.
3. **Aucune action de masse.** Réinitialiser le mot de passe d'une cohorte
   (début de session, arrivée d'un groupe d'étudiants) se fait une ligne à la
   fois, chaque fois avec un dialogue de confirmation.
4. **La présentation gaspille l'espace et casse sur petit écran.** Trois
   cartes de stats de même icône (`User` × 3) et de cercles de 64 px occupent
   le premier écran ; en dessous, `md:` masque le rôle et `lg:` masque
   l'e-mail et la date, si bien qu'un téléphone affiche deux colonnes : un nom
   (vide, cf. point 1) et un bouton.

## Périmètre

Dans le périmètre :

- correction du bug d'affichage des noms ;
- tri par colonne, filtre par rôle et par statut d'activation ;
- sélection multiple et actions groupées (réinitialisation, suppression) ;
- nombre de lignes par page réglable ;
- retravail du UI : bandeau de stats compact et cliquable, tableau à avatars,
  actions au survol, barre de sélection, états vides distincts ;
- découpage de `UsersTable.tsx` (542 lignes) en unités testables ;
- passage aux tokens de thème pour que le mode sombre fonctionne.

Hors périmètre, explicitement (à demander séparément si voulu) :

- la page de détail `admin/user/[id]` (484 lignes, mériterait sa propre passe) ;
- l'export CSV de la liste ;
- la promotion / rétrogradation d'un admin depuis la liste ;
- la relance d'invitation aux comptes jamais activés.

## Ce qui existe aujourd'hui

- `src/components/admin/UsersTab.tsx` : 12 lignes, enveloppe `UsersTable` dans
  un `TabsContent`. Chargé en `dynamic()` par `admin/page.tsx`.
- `src/components/admin/users/UsersTable.tsx` (542 lignes) : fetch des
  utilisateurs et des stats, recherche débouncée à 350 ms envoyée au serveur,
  pagination figée à 10, rendu de ligne, skeleton, hook `useAlert` (sonner) et
  layout, tout dans le même fichier.
- `src/components/admin/users/CardStats.tsx` : trois cartes `border-l-4`, la
  même icône `User` pour les trois, cercle de 64 px, couleurs cyan / orange /
  vert en dur.
- `src/components/admin/users/ActionBar.tsx` : champ de recherche, bouton de
  rafraîchissement, et un `DropdownMenu` qui contient à la fois le formulaire
  d'import CSV (`AddUserCsv.tsx`) et un `AddUserForm` — lequel ouvre son propre
  `Dialog` depuis l'intérieur du menu déroulant. La chaîne
  `"Ajouter un utilisateur"` y est codée en dur (ligne 127), non traduite.
- `src/components/admin/users/Pagination.tsx` (`PaginationControls`) :
  pagination complète (première / précédente / plages / suivante / dernière),
  sans notion de taille de page. Propre à l'onglet Utilisateurs ; l'onglet
  Réservations a son propre composant homonyme sous `reservations/list/`.
- `src/components/admin/users/DialogConfirmationResetsPassword.tsx` et
  `DialogConfirmationDeleteUser.tsx` : composants à *render prop*
  (`children({ open, loading })`), un dialogue par utilisateur ciblé.
- `src/hooks/usePagination.ts` : `page`, `totalPages`, `goToPage`,
  `resetPage`, borne la page au total.
- `src/components/admin/EmptyState.tsx` : partagé par les onglets Stations et
  Réservations. Icône + titre, pas de description ni d'action.
- `GET /api/admin/users` : recherche serveur sur `CONCAT(firstname, lastname)`
  et `email`, pagination serveur, tri figé sur `users.id`. Protégé par
  `withAdmin`.
- `GET /api/admin/users/stats` : total, `password IS NULL`, et nombre
  d'utilisateurs distincts ayant une réservation. Une seule requête.
- `DELETE /api/admin/users/delete-user` et
  `POST /api/admin/users/reset-password` : un seul id par appel. Tous deux
  réimplémentent la vérification du jeton à la main au lieu d'utiliser
  `withAdmin`, et refusent l'id de l'appelant.

Faits de schéma qui cadrent la solution (`src/db/schema.ts:401`) :

- `users.password` est **nullable**. C'est le marqueur de « compte jamais
  configuré » : `reset-password` le remet à `NULL` et envoie un courriel, et la
  stat `totalUserNotBoarded` compte exactement `password IS NULL`.
- `users.lastLogin` est nullable et n'est aujourd'hui affiché nulle part dans
  la liste (seulement sur la page de détail).
- `users.isAdmin` est un `tinyint`, pas un booléen : l'API le renvoie tel quel
  et le client le traite en booléen par coercition implicite.

## Décisions

### D1 — Les noms sont corrigés côté client, pas côté API

Deux façons de réparer le bug : renommer les clés dans le `select` Drizzle
(`firstName: users.firstname`), ou aligner le type client sur ce que l'API
renvoie déjà. On choisit la seconde. La colonne s'appelle `firstname` dans le
schéma, la page de détail (`admin/user/[id]/page.tsx:31`) type déjà son
`UserDetails` avec `firstname` / `lastname`, et `get-user-details` renvoie la
même forme. Renommer côté API créerait deux conventions pour la même donnée
selon l'endpoint. Le type `User` du tableau passe donc à `firstname` /
`lastname`, et les deux dialogues de confirmation — dont les props
`targetUser` utilisent `firstName?` / `lastName?` — sont alignés aussi.

### D2 — Tri et filtres côté serveur

La recherche et la pagination sont déjà serveur. Faire le tri côté client ne
trierait que la page courante : sur 10 lignes affichées et 300 en base, un tri
« par date de création » qui ne réordonne que la page visible est un piège.
`GET /api/admin/users` accepte donc :

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `sort` | `name` \| `email` \| `createdAt` \| `lastLogin` \| `role` | `name` |
| `order` | `asc` \| `desc` | `asc` |
| `role` | `all` \| `admin` \| `user` | `all` |
| `status` | `all` \| `active` \| `pending` | `all` |

`sort` est validé contre une table de correspondance explicite vers les
colonnes Drizzle — jamais interpolé dans du SQL. Une valeur inconnue retombe
sur le défaut plutôt que de renvoyer 400 : un lien partagé avec un paramètre
périmé doit afficher la liste, pas une erreur.

`status=pending` signifie `password IS NULL`, `status=active` signifie
`password IS NOT NULL`. Le `select` gagne un champ booléen `hasPassword`
calculé en SQL (`users.password IS NOT NULL`) — on expose le booléen, jamais
le hash.

Le tri par défaut passe de `users.id` à `name` : l'ordre d'insertion en base
n'a aucun sens pour qui cherche quelqu'un.

### D3 — Les tuiles de stats sont des filtres

Les trois stats deviennent cliquables et pilotent le filtre `status` :
« Total » → `status=all`, « Non configurés » → `status=pending`. La tuile
active porte un anneau d'accent. La troisième stat (utilisateurs avec
réservation) n'a **pas** d'équivalent en filtre — il faudrait une jointure sur
`reservation` dans la liste — elle reste donc informative, sans affordance de
clic, et c'est assumé plutôt que masqué : elle est rendue comme une tuile
statique, visuellement distincte des deux autres (pas de curseur, pas d'anneau
au survol).

### D4 — Un endpoint groupé côté serveur plutôt qu'une boucle client

`POST /api/admin/users/bulk`, corps `{ action, userIds }` avec `action` dans
`"reset-password" | "delete"`. Traitement **séquentiel**, réponse
`{ succeeded: number[], failed: { id: number, error: string }[] }`, statut 200
même en cas d'échecs partiels — l'appelant lit le détail.

Une boucle client sur les endpoints unitaires existants aurait évité d'écrire
un endpoint, mais une réinitialisation envoie un courriel : quarante requêtes
parallèles depuis le navigateur, c'est quarante envois SMTP concurrents, et
aucun moyen de rendre compte proprement d'un échec partiel. Le traitement est
séquentiel pour la même raison.

Règles reprises des endpoints unitaires : l'id de l'admin appelant est retiré
de la liste (il n'échoue pas, il est ignoré) ; un id introuvable finit dans
`failed`. Plafond de 100 ids par appel. L'endpoint utilise `withAdmin`.

### D5 — `withAdmin` sur les endpoints unitaires

`delete-user` et `reset-password` réimplémentent la lecture du cookie
`SESSION`, `verifyToken` et le contrôle `isAdmin`, alors que le reste du
dossier passe par `withAdmin`. Écrire un troisième endpoint utilisateurs avec
sa propre copie de ce bloc figerait la divergence. Les deux sont alignés sur
`withAdmin` dans le cadre de ce travail — la logique métier (refus de
soi-même, 404, cascade sur `reservation`) est inchangée.

### D6 — L'e-mail passe sous le nom, la colonne disparaît

Aujourd'hui l'e-mail est une colonne `hidden lg:table-cell`. Il devient la
deuxième ligne de la cellule « Utilisateur », sous le nom, en `text-sm
text-muted-foreground`. Conséquence : plus rien à masquer par breakpoint pour
cette donnée, et un téléphone affiche enfin nom + e-mail + rôle au lieu d'un
nom seul. Un avatar à initiales (couleur dérivée de `user.id`, palette fixe)
ancre la ligne à gauche.

### D7 — L'ajout d'utilisateur devient un dialogue à onglets

Le `DropdownMenu` actuel contient un formulaire d'upload CSV *et* un
`AddUserForm` qui ouvre son propre `Dialog` — un dialogue imbriqué dans un
menu déroulant, avec les conflits de focus et de fermeture que ça implique
(d'où les `e.preventDefault()` sur `onSelect` un peu partout). Le bouton
« Ajouter » ouvre désormais un `Dialog` unique à deux onglets, *Manuel* et
*Import CSV*, qui réutilise `AddUserForm` et `AddUserCsv` **sans les
réécrire** : seul leur mode de présentation change. `AddUserForm` expose déjà
une prop `trigger` ; il reçoit un mode « inline » pour être rendu sans son
propre `Dialog`.

## Architecture cible

`UsersTable.tsx` passe de 542 lignes à environ 130, réduit à l'orchestration.

```
src/components/admin/users/
  UsersTable.tsx           orchestration : compose hook + sous-composants
  useAdminUsers.ts         (nouveau) fetch, recherche, tri, filtres, pagination
  useUserSelection.ts      (nouveau) sélection multiple, exclusion de soi
  UsersStatsBar.tsx        (remplace CardStats.tsx)
  UsersToolbar.tsx         (remplace ActionBar.tsx)
  UsersBulkBar.tsx         (nouveau) barre d'actions groupées
  UserRow.tsx              (extrait) une ligne du tableau
  UserRowActions.tsx       (extrait) actions desktop + menu mobile
  UserAvatar.tsx           (nouveau) initiales colorées
  RoleBadge.tsx            (extrait de UsersTable)
  StatusBadge.tsx          (nouveau) actif / jamais configuré
  SortableHeader.tsx       (nouveau) en-tête cliquable + chevron
  UsersTableSkeleton.tsx   (extrait)
  AddUserDialog.tsx        (nouveau) dialogue à onglets
  Pagination.tsx           (modifié) + sélecteur de lignes par page
  DialogConfirmationDeleteUser.tsx      (inchangé, sauf firstname/lastname)
  DialogConfirmationResetsPassword.tsx  (inchangé, sauf firstname/lastname)
  AddUserForm.tsx / AddUserCsv.tsx      (inchangés, présentation seulement)
```

Frontières : `useAdminUsers` ne connaît que l'API et renvoie un état ; il
n'importe aucun composant. `useUserSelection` ne connaît que des ids et l'id
courant. Les composants de présentation ne font aucun `fetch` — les deux
dialogues de confirmation en font encore, et c'est conservé : ils sont
autonomes et déjà utilisés tels quels.

## Flux de données

1. `UsersTable` monte `useAdminUsers`, qui charge en parallèle
   `/api/admin/users/stats` (une fois) et `/api/admin/users` (à chaque
   changement de page, recherche débouncée, tri ou filtre).
2. Un changement de recherche, de tri ou de filtre remet la page à 1 **dans le
   même cycle** que le changement, pas dans un `useEffect` séparé : le code
   actuel a un `useEffect` sur `debouncedSearch` qui appelle `resetPage()`
   après qu'un autre `useEffect` a déjà lancé le fetch de la page courante,
   d'où deux requêtes par frappe stabilisée.
3. La sélection est vidée à chaque changement de page ou de filtre — une
   sélection invisible sur laquelle on agit est un piège.
4. Après une action (unitaire ou groupée), `refresh()` recharge stats et liste.

## Gestion des erreurs

- Échec du chargement de la liste : aujourd'hui le catch vide la liste et
  laisse l'écran « Aucun utilisateur trouvé » — indistinguable d'une base
  vide. La cible affiche un état d'erreur explicite avec un bouton *Réessayer*.
- Échec du chargement des stats : les tuiles restent en `—`, la liste reste
  utilisable. Une stat manquante ne doit pas bloquer l'écran principal.
- Action groupée partiellement en échec : toast d'avertissement
  « 8 traités, 2 en échec » avec le détail en description, et la liste est
  rechargée pour refléter ce qui est réellement passé.
- Les retours passent par sonner, comme aujourd'hui (`<Toaster>` monté dans
  `app/[locale]/layout.tsx`).

## Présentation

- **Bandeau de stats** : trois tuiles compactes sur une ligne
  (`grid-cols-1 sm:grid-cols-3`), icônes distinctes `Users`, `MailWarning`,
  `CalendarCheck`, valeur en `text-2xl`, libellé en `text-sm
  text-muted-foreground`. Plus de cercle de 64 px ni de `border-l-4`.
- **Tableau** : colonnes `[case] Utilisateur · Rôle · Statut · Dernière
  connexion · Créé le · actions`. Les actions sont en
  `opacity-0 group-hover:opacity-100 focus-within:opacity-100` sur `sm:` et
  au-delà, et rendues dans un menu `⋯` toujours visible en dessous.
  `focus-within` est indispensable : sans lui, les actions deviennent
  inatteignables au clavier. Deux colonnes seulement se masquent par
  breakpoint : « Créé le » en dessous de `lg:` et « Dernière connexion » en
  dessous de `md:`. Un téléphone garde donc case, utilisateur (nom + e-mail),
  rôle, statut et actions — les colonnes qui servent à décider.
- **Barre de sélection** : dès qu'une ligne est cochée, `UsersBulkBar`
  remplace `UsersToolbar` — « 3 sélectionnés · Réinitialiser le mot de passe ·
  Supprimer · Annuler ». La case d'en-tête sélectionne la page courante et
  porte l'état indéterminé quand la sélection est partielle. Le compte de
  l'admin connecté n'a pas de case (les endpoints refusent déjà l'auto-action).
- **États vides** : « Aucun utilisateur ne correspond à ces filtres » avec un
  bouton *Effacer les filtres* quand une recherche ou un filtre est actif,
  « Aucun utilisateur » sinon. `EmptyState` étant partagé par d'autres onglets,
  il gagne deux props **optionnelles** `description?` et `action?` ; les
  appelants existants (Stations, Réservations) ne changent pas.
- **Thème** : les `gray-100` / `gray-200` / `gray-900` / `bg-[white]` en dur
  sont remplacés par `bg-muted`, `border-border`, `text-foreground`,
  `bg-background`. Le cyan-500 reste l'accent du panneau admin — la cohérence
  avec les dix autres onglets prime sur la pureté des tokens.

## Traductions

Nouvelles clés sous `admin.users` dans `src/i18n/messages/fr.json` et
`en.json`, par section : `filters.*` (rôle, statut, libellés d'options),
`sort.*`, `bulk.*` (compteur, actions, résultat partiel), `status.*`
(actif / jamais configuré), `table.header.lastLogin`, `pagination.perPage`,
`error.*` (échec de chargement, réessayer), `searchResult.noMatch` et
`searchResult.clearFilters`. La chaîne codée en dur `"Ajouter un
utilisateur"` (`ActionBar.tsx:127`) disparaît avec le composant ; le dialogue
réutilise `actionBar.dropDownMenuAddUser.addSingleUser`, qui porte déjà ce
texte.

## Vérification

Ce dépôt n'a pas de script `test` dans `package.json`, et `npm run build`
échoue en local pour une raison d'environnement (volume exFAT) sans rapport
avec le code. La vérification est donc :

- `npx tsc --noEmit` — sans erreur ;
- `npm run lint` — sans erreur ni avertissement nouveau ;
- passage manuel dans l'application lancée en `npm run dev` : noms affichés,
  tri sur chaque colonne, chaque filtre, sélection multiple et les deux
  actions groupées, changement de taille de page, rendu à 375 px, mode sombre,
  et les deux états vides.
