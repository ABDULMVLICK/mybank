import { Client } from './Client.js';
import { Utilisateur, type Role } from './Utilisateur.js';
import { Virement } from './Virement.js';

export class Admin extends Utilisateur {
  constructor(id: number, identifiant: string, nom: string) {
    super(id, identifiant, nom);
  }

  getRole(): Role {
    return 'admin';
  }

  // Règles 15, 17 et 18 : l'argent bouge quand l'admin accepte, et le solde est vérifié à ce moment-là.
  // Si le solde est insuffisant ou qu'un des comptes a été supprimé, le virement est annulé.
  accepter(virement: Virement, expediteur: Client, beneficiaire: Client): void {
    const montant = virement.getMontantCentimes();
    const possible = expediteur.estActif() && beneficiaire.estActif() && expediteur.getSoldeCentimes() >= montant;

    if (!possible) {
      virement.marquerAnnule();
      return;
    }
    expediteur.retirer(montant);
    beneficiaire.deposer(montant);
    virement.marquerAccepte();
  }

  // Règle 18 : l'admin peut refuser un virement en attente. Aucun solde ne change.
  annuler(virement: Virement): void {
    virement.marquerAnnule();
  }

  // Règle 20 : un admin peut supprimer un compte client (mêmes conditions que pour le client lui-même).
  supprimerCompte(client: Client): void {
    client.desactiver();
  }
}
