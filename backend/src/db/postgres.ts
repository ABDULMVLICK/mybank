import pg from 'pg';
import { config } from '../config.js';

// Un « pool » garde plusieurs connexions ouvertes et les réutilise.
export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Un repository peut travailler avec le pool, ou avec une connexion
// qui est en train d'exécuter une transaction.
export type Executeur = pg.Pool | pg.PoolClient;

// Exécute plusieurs requêtes comme un tout : soit tout réussit (COMMIT),
// soit tout est annulé (ROLLBACK). Indispensable pour un virement.
export async function enTransaction<T>(travail: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultat = await travail(client);
    await client.query('COMMIT');
    return resultat;
  } catch (erreur) {
    await client.query('ROLLBACK');
    throw erreur;
  } finally {
    client.release();
  }
}
