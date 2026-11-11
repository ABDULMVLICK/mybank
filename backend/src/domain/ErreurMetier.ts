// Erreur prévue par les règles de gestion (montant invalide, solde insuffisant…).
// Elle porte le code HTTP à renvoyer, pour que l'API réponde un message clair.
export class ErreurMetier extends Error {
  readonly statut: number;

  constructor(message: string, statut = 400) {
    super(message);
    this.name = 'ErreurMetier';
    this.statut = statut;
  }
}
