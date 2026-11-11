import { journaliser, lireJournal } from '../db/journal.js';
import { enTransaction, pool } from '../db/postgres.js';
import { Client } from '../domain/Client.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import { EtatVirement } from '../domain/Virement.js';
import { UtilisateurRepository, type VueUtilisateurAdmin } from '../repositories/UtilisateurRepository.js';
import { VirementRepository, type VueVirement } from '../repositories/VirementRepository.js';
import { AuthService } from './AuthService.js';
import { exigerAdmin, versVueUtilisateur, type VueUtilisateur } from './vues.js';

export class AdminService {
  private readonly auth = new AuthService();

  async listerUtilisateurs(): Promise<VueUtilisateurAdmin[]> {
    return new UtilisateurRepository(pool).lister();
  }

  async listerVirements(etat: unknown): Promise<VueVirement[]> {
    const etats = Object.values(EtatVirement) as string[];
    const etatChoisi = typeof etat === 'string' && etats.includes(etat) ? (etat as EtatVirement) : EtatVirement.EN_ATTENTE;
    return new VirementRepository(pool).listerParEtat(etatChoisi);
  }

  // Règles 15, 17 et 18. Tout se passe dans UNE transaction :
  // débit, crédit et changement d'état réussissent ensemble, ou rien n'est fait.
  async accepter(idAdmin: number, idVirement: number): Promise<VueVirement> {
    const etat = await enTransaction(async (tx) => {
      const utilisateurs = new UtilisateurRepository(tx);
      const virements = new VirementRepository(tx);

      const admin = exigerAdmin(await utilisateurs.trouverParId(idAdmin));
      const virement = await virements.trouverParId(idVirement, true);
      if (!virement) throw new ErreurMetier('Virement introuvable.', 404);

      const comptes = await utilisateurs.verrouillerPlusieurs([virement.getIdExpediteur(), virement.getIdBeneficiaire()]);
      const expediteur = comptes.get(virement.getIdExpediteur());
      const beneficiaire = comptes.get(virement.getIdBeneficiaire());
      if (!(expediteur instanceof Client) || !(beneficiaire instanceof Client)) {
        throw new ErreurMetier('Comptes du virement introuvables.', 404);
      }

      admin.accepter(virement, expediteur, beneficiaire);

      await utilisateurs.enregistrer(expediteur);
      await utilisateurs.enregistrer(beneficiaire);
      await virements.enregistrer(virement);
      return virement.getEtat();
    });

    await journaliser(etat === EtatVirement.ACCEPTE ? 'virement_accepte' : 'virement_annule_solde_insuffisant', idAdmin, { idVirement });
    return this.trouverVue(etat, idVirement);
  }

  // Règle 18 : l'admin refuse un virement en attente. Aucun solde ne change.
  async annuler(idAdmin: number, idVirement: number): Promise<VueVirement> {
    await enTransaction(async (tx) => {
      const admin = exigerAdmin(await new UtilisateurRepository(tx).trouverParId(idAdmin));
      const virements = new VirementRepository(tx);
      const virement = await virements.trouverParId(idVirement, true);
      if (!virement) throw new ErreurMetier('Virement introuvable.', 404);
      admin.annuler(virement);
      await virements.enregistrer(virement);
    });
    await journaliser('virement_annule', idAdmin, { idVirement });
    return this.trouverVue(EtatVirement.ANNULE, idVirement);
  }

  private async trouverVue(etat: EtatVirement, idVirement: number): Promise<VueVirement> {
    const vue = (await new VirementRepository(pool).listerParEtat(etat)).find((v) => v.id === idVirement);
    if (!vue) throw new ErreurMetier('Virement introuvable.', 404);
    return vue;
  }

  // Règle 20 : seulement des comptes clients (un admin ne peut pas supprimer un autre admin).
  async supprimerCompte(idAdmin: number, idCible: number): Promise<void> {
    await enTransaction(async (tx) => {
      const utilisateurs = new UtilisateurRepository(tx);
      const admin = exigerAdmin(await utilisateurs.trouverParId(idAdmin));
      const cible = await utilisateurs.trouverParId(idCible, true);
      if (!cible) throw new ErreurMetier('Compte introuvable.', 404);
      if (!(cible instanceof Client)) throw new ErreurMetier('Un admin ne peut supprimer que des comptes clients.', 403);

      admin.supprimerCompte(cible);
      await utilisateurs.enregistrer(cible);
      await new VirementRepository(tx).annulerEnAttente(idCible);
    });
    await journaliser('compte_supprime', idAdmin, { par: 'admin', idCible });
  }

  // Règle 21 : un admin crée uniquement des comptes admin.
  async creerAdmin(corps: unknown): Promise<VueUtilisateur> {
    return versVueUtilisateur(await this.auth.creerCompte(corps, 'admin'));
  }

  async journal() {
    return lireJournal();
  }
}
