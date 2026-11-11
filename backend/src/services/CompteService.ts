import { journaliser } from '../db/journal.js';
import { enTransaction, pool } from '../db/postgres.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import { versCentimes } from '../domain/montant.js';
import { OperationRepository, type TypeOperation, type VueOperation } from '../repositories/OperationRepository.js';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository.js';
import { VirementRepository } from '../repositories/VirementRepository.js';
import { lireChamp, lireTexte } from './validation.js';
import { exigerClient, versVueUtilisateur, type VueUtilisateur } from './vues.js';

// Le service orchestre : il ouvre la transaction, charge les objets,
// appelle les méthodes métier (qui vérifient les règles), puis enregistre.
export class CompteService {
  async consulter(idUtilisateur: number): Promise<VueUtilisateur> {
    const utilisateur = await new UtilisateurRepository(pool).trouverParId(idUtilisateur);
    if (!utilisateur) throw new ErreurMetier('Compte introuvable.', 404);
    return versVueUtilisateur(utilisateur);
  }

  async deposer(idClient: number, corps: unknown): Promise<VueUtilisateur> {
    return this.mouvement(idClient, corps, 'depot');
  }

  async retirer(idClient: number, corps: unknown): Promise<VueUtilisateur> {
    return this.mouvement(idClient, corps, 'retrait');
  }

  private async mouvement(idClient: number, corps: unknown, type: TypeOperation): Promise<VueUtilisateur> {
    const montant = versCentimes(lireChamp(corps, 'montant'));
    const client = await enTransaction(async (tx) => {
      const utilisateurs = new UtilisateurRepository(tx);
      const client = exigerClient(await utilisateurs.trouverParId(idClient, true));
      if (type === 'depot') client.deposer(montant);
      else client.retirer(montant);
      await utilisateurs.enregistrer(client);
      await new OperationRepository(tx).creer(idClient, type, montant);
      return client;
    });
    await journaliser(type, idClient, { montantCentimes: montant });
    return versVueUtilisateur(client);
  }

  async operations(idClient: number): Promise<VueOperation[]> {
    return new OperationRepository(pool).listerPourUtilisateur(idClient);
  }

  async changerNom(idUtilisateur: number, corps: unknown): Promise<VueUtilisateur> {
    const nom = lireTexte(corps, 'nom');
    const utilisateurs = new UtilisateurRepository(pool);
    const utilisateur = await utilisateurs.trouverParId(idUtilisateur);
    if (!utilisateur) throw new ErreurMetier('Compte introuvable.', 404);
    utilisateur.changerNom(nom);
    await utilisateurs.enregistrer(utilisateur);
    return versVueUtilisateur(utilisateur);
  }

  // Règles 7 à 9 : le client supprime son propre compte.
  async supprimerSonCompte(idClient: number): Promise<void> {
    await enTransaction(async (tx) => {
      const utilisateurs = new UtilisateurRepository(tx);
      const client = exigerClient(await utilisateurs.trouverParId(idClient, true));
      client.desactiver();
      await utilisateurs.enregistrer(client);
      await new VirementRepository(tx).annulerEnAttente(idClient);
    });
    await journaliser('compte_supprime', idClient, { par: 'client' });
  }
}
