import { journaliser } from '../db/journal.js';
import { pool } from '../db/postgres.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import { versCentimes } from '../domain/montant.js';
import { Virement } from '../domain/Virement.js';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository.js';
import { VirementRepository, type VueVirement } from '../repositories/VirementRepository.js';
import { lireChamp, lireTexte } from './validation.js';
import { exigerClient } from './vues.js';

// Le client peut seulement créer ses virements et les consulter (règle 16) :
// changer l'état d'un virement est réservé à l'admin.
export class VirementService {
  async lister(idClient: number): Promise<VueVirement[]> {
    return new VirementRepository(pool).listerPourUtilisateur(idClient);
  }

  // Règles 10 à 13 : le virement est créé à l'état « en attente ». L'argent ne bouge pas encore,
  // donc le solde n'est pas vérifié ici (règle 17 : il le sera quand l'admin acceptera).
  async creer(idExpediteur: number, corps: unknown): Promise<VueVirement> {
    const identifiantBeneficiaire = lireTexte(corps, 'identifiantBeneficiaire').toLowerCase();
    const montant = versCentimes(lireChamp(corps, 'montant'));
    Virement.verifierMontant(montant);

    const utilisateurs = new UtilisateurRepository(pool);
    exigerClient(await utilisateurs.trouverParId(idExpediteur));
    const beneficiaire = exigerClient(await utilisateurs.trouverParIdentifiant(identifiantBeneficiaire), 'Bénéficiaire introuvable.');
    Virement.verifierParticipants(idExpediteur, beneficiaire.getId());

    const virements = new VirementRepository(pool);
    const virement = await virements.creer(idExpediteur, beneficiaire.getId(), montant);
    await journaliser('virement_cree', idExpediteur, { idVirement: virement.getId(), montantCentimes: montant });

    const vue = (await virements.listerPourUtilisateur(idExpediteur)).find((v) => v.id === virement.getId());
    if (!vue) throw new ErreurMetier('Virement introuvable.', 404);
    return vue;
  }
}
