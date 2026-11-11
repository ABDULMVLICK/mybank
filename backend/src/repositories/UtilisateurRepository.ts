import type { Executeur } from '../db/postgres.js';
import { Admin } from '../domain/Admin.js';
import { Client } from '../domain/Client.js';
import type { Role } from '../domain/Utilisateur.js';
import { depuisBase, versBase, versEuros } from '../domain/montant.js';

// Le repository est la seule couche qui écrit du SQL pour les utilisateurs.
// Toutes les requêtes sont paramétrées ($1, $2…) : les valeurs sont envoyées à part,
// jamais collées dans le texte SQL. C'est ce qui empêche l'injection SQL.

interface LigneUtilisateur {
  id_utilisateur: number;
  identifiant: string;
  mot_de_passe: string;
  nom: string;
  role: Role;
  solde: string;
  actif: boolean;
}

export interface VueUtilisateurAdmin {
  id: number;
  identifiant: string;
  nom: string;
  role: Role;
  solde: number;
  actif: boolean;
}

const COLONNES = 'id_utilisateur, identifiant, mot_de_passe, nom, role, solde, actif';

export class UtilisateurRepository {
  private readonly db: Executeur;

  constructor(db: Executeur) {
    this.db = db;
  }

  // Transforme une ligne de la table en objet Client ou Admin.
  private static fabriquer(ligne: LigneUtilisateur): Client | Admin {
    if (ligne.role === 'admin') {
      return new Admin(ligne.id_utilisateur, ligne.identifiant, ligne.nom);
    }
    return new Client(ligne.id_utilisateur, ligne.identifiant, ligne.nom, depuisBase(ligne.solde), ligne.actif);
  }

  // « FOR UPDATE » verrouille la ligne jusqu'à la fin de la transaction :
  // deux opérations simultanées sur le même compte attendent leur tour.
  async trouverParId(id: number, verrouiller = false): Promise<Client | Admin | null> {
    const sql = `SELECT ${COLONNES} FROM utilisateur WHERE id_utilisateur = $1${verrouiller ? ' FOR UPDATE' : ''}`;
    const { rows } = await this.db.query<LigneUtilisateur>(sql, [id]);
    return rows[0] ? UtilisateurRepository.fabriquer(rows[0]) : null;
  }

  async trouverParIdentifiant(identifiant: string): Promise<Client | Admin | null> {
    const { rows } = await this.db.query<LigneUtilisateur>(`SELECT ${COLONNES} FROM utilisateur WHERE identifiant = $1`, [identifiant]);
    return rows[0] ? UtilisateurRepository.fabriquer(rows[0]) : null;
  }

  async trouverPourConnexion(identifiant: string): Promise<{ utilisateur: Client | Admin; motDePasseHache: string } | null> {
    const { rows } = await this.db.query<LigneUtilisateur>(`SELECT ${COLONNES} FROM utilisateur WHERE identifiant = $1`, [identifiant]);
    if (!rows[0]) return null;
    return { utilisateur: UtilisateurRepository.fabriquer(rows[0]), motDePasseHache: rows[0].mot_de_passe };
  }

  // Verrouille plusieurs comptes, toujours dans l'ordre des identifiants,
  // pour éviter que deux transactions s'attendent l'une l'autre (interblocage).
  async verrouillerPlusieurs(ids: number[]): Promise<Map<number, Client | Admin>> {
    const { rows } = await this.db.query<LigneUtilisateur>(
      `SELECT ${COLONNES} FROM utilisateur WHERE id_utilisateur = ANY($1) ORDER BY id_utilisateur FOR UPDATE`,
      [ids],
    );
    return new Map(rows.map((ligne) => [ligne.id_utilisateur, UtilisateurRepository.fabriquer(ligne)]));
  }

  async creer(identifiant: string, motDePasseHache: string, nom: string, role: Role): Promise<Client | Admin> {
    const { rows } = await this.db.query<LigneUtilisateur>(
      `INSERT INTO utilisateur (identifiant, mot_de_passe, nom, role) VALUES ($1, $2, $3, $4) RETURNING ${COLONNES}`,
      [identifiant, motDePasseHache, nom, role],
    );
    return UtilisateurRepository.fabriquer(rows[0]);
  }

  // Enregistre l'état de l'objet. Un compte désactivé perd aussi son mot de passe.
  async enregistrer(utilisateur: Client | Admin): Promise<void> {
    const solde = utilisateur instanceof Client ? utilisateur.getSoldeCentimes() : 0;
    const actif = utilisateur instanceof Client ? utilisateur.estActif() : true;
    await this.db.query(
      `UPDATE utilisateur
          SET identifiant = $2, nom = $3, solde = $4, actif = $5,
              mot_de_passe = CASE WHEN $5 THEN mot_de_passe ELSE '' END
        WHERE id_utilisateur = $1`,
      [utilisateur.getId(), utilisateur.getIdentifiant(), utilisateur.getNom(), versBase(solde), actif],
    );
  }

  async lister(): Promise<VueUtilisateurAdmin[]> {
    const { rows } = await this.db.query<LigneUtilisateur>(`SELECT ${COLONNES} FROM utilisateur ORDER BY id_utilisateur`);
    return rows.map((l) => ({
      id: l.id_utilisateur,
      identifiant: l.identifiant,
      nom: l.nom,
      role: l.role,
      solde: versEuros(depuisBase(l.solde)),
      actif: l.actif,
    }));
  }
}
