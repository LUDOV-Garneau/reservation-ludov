export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  /**
   * Version de session au moment de la connexion (`users.session_version`).
   * Une réinitialisation de mot de passe incrémente la colonne, ce qui périme
   * les jetons émis avant. Absent des jetons émis avant l'ajout de la colonne :
   * traité comme 0, sinon le déploiement déconnecterait tout le monde.
   */
  sv?: number;
}
