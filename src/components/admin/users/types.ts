/** Forme renvoyée par `GET /api/admin/users`. */
export type AdminUser = {
  id: number;
  email: string;
  /** Le schéma et l'API utilisent `firstname`/`lastname`, pas `firstName`. */
  firstname: string;
  lastname: string;
  /** `tinyint` côté base : 0 ou 1. */
  isAdmin: number | boolean;
  createdAt: string;
  lastLogin: string | null;
  /** `false` = compte jamais configuré (mot de passe NULL en base). */
  hasPassword: boolean;
};

export type UserStats = {
  totalUser: number;
  totalUserNotBoarded: number;
  totalUserWithReservation: number;
};

/**
 * Les types de la vue (tri, filtres, taille de page) vivent dans
 * `useAdminUsersFilters` : c'est lui qui les lit et les écrit dans l'URL, donc
 * c'est lui qui en est la source de vérité.
 */

/**
 * Hauteur commune aux deux onglets du dialogue d'ajout. Sans elle, passer de
 * « Manuel » à « Import CSV » fait sauter la boîte de plusieurs centimètres.
 * Vit ici plutôt que dans l'un des deux panneaux : aucun des deux n'a de
 * raison de dépendre de l'autre.
 */
export const ADD_USER_PANE_MIN_H = "min-h-[19rem]";
