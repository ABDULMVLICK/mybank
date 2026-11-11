import { ErreurMetier } from './ErreurMetier.js';
import { Utilisateur, type Role } from './Utilisateur.js';

export class Client extends Utilisateur {
  // Encapsulation : le solde est privé. On ne peut le changer que par deposer() et retirer(),
  // qui vérifient les règles. Personne ne peut écrire client.soldeCentimes = -500.
  private soldeCentimes: number;
  private actif: boolean;

  constructor(id: number, identifiant: string, nom: string, soldeCentimes: number, actif: boolean) {
    super(id, identifiant, nom);
    this.soldeCentimes = soldeCentimes;
    this.actif = actif;
  }

  getRole(): Role {
    return 'client';
  }

  getSoldeCentimes(): number {
    return this.soldeCentimes;
  }

  estActif(): boolean {
    return this.actif;
  }

  deposer(montantCentimes: number): void {
    this.verifierActif();
    this.verifierPositif(montantCentimes);
    this.soldeCentimes += montantCentimes;
  }

  // Règle 4 : le solde ne peut jamais être négatif.
  retirer(montantCentimes: number): void {
    this.verifierActif();
    this.verifierPositif(montantCentimes);
    if (montantCentimes > this.soldeCentimes) {
      throw new ErreurMetier('Solde insuffisant.', 409);
    }
    this.soldeCentimes -= montantCentimes;
  }

  // Règles 7 à 9 : suppression = désactivation + anonymisation, refusée s'il reste de l'argent.
  desactiver(): void {
    if (!this.actif) {
      throw new ErreurMetier('Ce compte est déjà supprimé.', 409);
    }
    if (this.soldeCentimes !== 0) {
      throw new ErreurMetier('Le solde doit être à zéro avant de supprimer le compte.', 409);
    }
    this.actif = false;
    this.anonymiser();
  }

  private verifierActif(): void {
    if (!this.actif) {
      throw new ErreurMetier('Ce compte est supprimé.', 409);
    }
  }

  private verifierPositif(montantCentimes: number): void {
    if (!Number.isInteger(montantCentimes) || montantCentimes <= 0) {
      throw new ErreurMetier('Le montant doit être supérieur à 0.');
    }
  }
}
