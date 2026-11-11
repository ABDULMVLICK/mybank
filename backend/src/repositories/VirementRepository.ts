import type { Executeur } from '../db/postgres.js';
import { depuisBase, versBase, versEuros } from '../domain/montant.js';
import { EtatVirement, Virement } from '../domain/Virement.js';

interface LigneVirement {
  id_virement: number;
  montant: string;
  date_virement: Date;
  etat: EtatVirement;
  id_expediteur: number;
  id_beneficiaire: number;
}

interface LigneVirementDetaillee extends LigneVirement {
  identifiant_expediteur: string;
  identifiant_beneficiaire: string;
}

// Ce que l'API renvoie au front : les identifiants lisibles plutôt que des numéros.
export interface VueVirement {
  id: number;
  montant: number;
  date: Date;
  etat: EtatVirement;
  idExpediteur: number;
  expediteur: string;
  beneficiaire: string;
}

const SELECT_DETAILLE = `
  SELECT v.*, e.identifiant AS identifiant_expediteur, b.identifiant AS identifiant_beneficiaire
    FROM virement v
    JOIN utilisateur e ON e.id_utilisateur = v.id_expediteur
    JOIN utilisateur b ON b.id_utilisateur = v.id_beneficiaire`;

export class VirementRepository {
  private readonly db: Executeur;

  constructor(db: Executeur) {
    this.db = db;
  }

  private static fabriquer(l: LigneVirement): Virement {
    return new Virement(l.id_virement, l.id_expediteur, l.id_beneficiaire, depuisBase(l.montant), l.etat, l.date_virement);
  }

  private static versVue(l: LigneVirementDetaillee): VueVirement {
    return {
      id: l.id_virement,
      montant: versEuros(depuisBase(l.montant)),
      date: l.date_virement,
      etat: l.etat,
      idExpediteur: l.id_expediteur,
      expediteur: l.identifiant_expediteur,
      beneficiaire: l.identifiant_beneficiaire,
    };
  }

  async creer(idExpediteur: number, idBeneficiaire: number, montantCentimes: number): Promise<Virement> {
    const { rows } = await this.db.query<LigneVirement>(
      'INSERT INTO virement (id_expediteur, id_beneficiaire, montant) VALUES ($1, $2, $3) RETURNING *',
      [idExpediteur, idBeneficiaire, versBase(montantCentimes)],
    );
    return VirementRepository.fabriquer(rows[0]);
  }

  async trouverParId(id: number, verrouiller = false): Promise<Virement | null> {
    const { rows } = await this.db.query<LigneVirement>(
      `SELECT * FROM virement WHERE id_virement = $1${verrouiller ? ' FOR UPDATE' : ''}`,
      [id],
    );
    return rows[0] ? VirementRepository.fabriquer(rows[0]) : null;
  }

  async enregistrer(virement: Virement): Promise<void> {
    await this.db.query('UPDATE virement SET montant = $2, etat = $3 WHERE id_virement = $1', [
      virement.getId(),
      versBase(virement.getMontantCentimes()),
      virement.getEtat(),
    ]);
  }

  async listerPourUtilisateur(idUtilisateur: number): Promise<VueVirement[]> {
    const { rows } = await this.db.query<LigneVirementDetaillee>(
      `${SELECT_DETAILLE} WHERE v.id_expediteur = $1 OR v.id_beneficiaire = $1 ORDER BY v.date_virement DESC, v.id_virement DESC`,
      [idUtilisateur],
    );
    return rows.map(VirementRepository.versVue);
  }

  async listerParEtat(etat: EtatVirement): Promise<VueVirement[]> {
    const { rows } = await this.db.query<LigneVirementDetaillee>(
      `${SELECT_DETAILLE} WHERE v.etat = $1 ORDER BY v.date_virement, v.id_virement`,
      [etat],
    );
    return rows.map(VirementRepository.versVue);
  }

  // Quand un compte est supprimé, ses virements encore en attente ne pourront jamais être acceptés.
  async annulerEnAttente(idUtilisateur: number): Promise<number> {
    const { rowCount } = await this.db.query(
      "UPDATE virement SET etat = 'annule' WHERE etat = 'en_attente' AND (id_expediteur = $1 OR id_beneficiaire = $1)",
      [idUtilisateur],
    );
    return rowCount ?? 0;
  }
}
