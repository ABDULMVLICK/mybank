import type { Executeur } from '../db/postgres.js';
import { depuisBase, versBase, versEuros } from '../domain/montant.js';

export type TypeOperation = 'depot' | 'retrait';

export interface VueOperation {
  id: number;
  type: TypeOperation;
  montant: number;
  date: Date;
}

interface LigneOperation {
  id_operation: number;
  type: TypeOperation;
  montant: string;
  date_operation: Date;
}

// Règle 6 : chaque dépôt et chaque retrait sont conservés.
export class OperationRepository {
  private readonly db: Executeur;

  constructor(db: Executeur) {
    this.db = db;
  }

  async creer(idUtilisateur: number, type: TypeOperation, montantCentimes: number): Promise<void> {
    await this.db.query('INSERT INTO operation (id_utilisateur, type, montant) VALUES ($1, $2, $3)', [
      idUtilisateur,
      type,
      versBase(montantCentimes),
    ]);
  }

  async listerPourUtilisateur(idUtilisateur: number): Promise<VueOperation[]> {
    const { rows } = await this.db.query<LigneOperation>(
      'SELECT id_operation, type, montant, date_operation FROM operation WHERE id_utilisateur = $1 ORDER BY date_operation DESC, id_operation DESC',
      [idUtilisateur],
    );
    return rows.map((l) => ({ id: l.id_operation, type: l.type, montant: versEuros(depuisBase(l.montant)), date: l.date_operation }));
  }
}
