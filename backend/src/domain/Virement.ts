import { ErreurMetier } from './ErreurMetier.js';

// Règle 14 : les 3 états possibles d'un virement.
// en attente → accepté (l'argent bouge) ou en attente → annulé. Accepté et annulé sont définitifs.
export enum EtatVirement {
  EN_ATTENTE = 'en_attente',
  ACCEPTE = 'accepte',
  ANNULE = 'annule',
}

export class Virement {
  static readonly MIN_CENTIMES = 100; // 1 €
  static readonly MAX_CENTIMES = 50_000; // 500 €

  private readonly id: number;
  private readonly idExpediteur: number;
  private readonly idBeneficiaire: number;
  private readonly montantCentimes: number;
  private etat: EtatVirement;
  private readonly date: Date;

  constructor(id: number, idExpediteur: number, idBeneficiaire: number, montantCentimes: number, etat: EtatVirement, date: Date) {
    this.id = id;
    this.idExpediteur = idExpediteur;
    this.idBeneficiaire = idBeneficiaire;
    this.montantCentimes = montantCentimes;
    this.etat = etat;
    this.date = date;
  }

  // Règle 12 : entre 1 € et 500 €. « static » : la vérification se fait avant même que le virement existe.
  static verifierMontant(montantCentimes: number): void {
    if (montantCentimes < Virement.MIN_CENTIMES || montantCentimes > Virement.MAX_CENTIMES) {
      throw new ErreurMetier("Le montant d'un virement doit être compris entre 1 € et 500 €.");
    }
  }

  // Règle 11 : pas de virement à soi-même.
  static verifierParticipants(idExpediteur: number, idBeneficiaire: number): void {
    if (idExpediteur === idBeneficiaire) {
      throw new ErreurMetier('Vous ne pouvez pas vous envoyer un virement.');
    }
  }

  getId(): number {
    return this.id;
  }

  getIdExpediteur(): number {
    return this.idExpediteur;
  }

  getIdBeneficiaire(): number {
    return this.idBeneficiaire;
  }

  getMontantCentimes(): number {
    return this.montantCentimes;
  }

  getEtat(): EtatVirement {
    return this.etat;
  }

  getDate(): Date {
    return this.date;
  }

  // Règles 16 et 18 : seul l'admin change l'état, et seulement d'un virement en attente.
  // Le montant n'a pas de méthode pour être modifié : il est fixé à la création (règle 19).
  marquerAccepte(): void {
    this.verifierEnAttente();
    this.etat = EtatVirement.ACCEPTE;
  }

  marquerAnnule(): void {
    this.verifierEnAttente();
    this.etat = EtatVirement.ANNULE;
  }

  private verifierEnAttente(): void {
    if (this.etat !== EtatVirement.EN_ATTENTE) {
      throw new ErreurMetier(`Ce virement est déjà ${this.etat === EtatVirement.ACCEPTE ? 'accepté' : 'annulé'} : il ne peut plus changer.`, 409);
    }
  }
}
