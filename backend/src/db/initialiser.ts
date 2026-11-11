import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool } from './postgres.js';

// Utilisé en production, où la base est un service géré (pas de scripts d'initialisation Docker) :
// 1. si la table utilisateur n'existe pas, on exécute database/schema.sql ;
// 2. règle 24 : s'il n'y a aucun admin et que ADMIN_MOT_DE_PASSE est fourni, on crée le premier admin.
// Les deux étapes ne font rien si c'est déjà fait : on peut redémarrer autant de fois qu'on veut.

function cheminSchema(): string {
  const candidats = [process.env.SCHEMA_SQL, 'database/schema.sql', '../database/schema.sql'].filter(Boolean) as string[];
  const trouve = candidats.map((c) => path.resolve(c)).find((c) => existsSync(c));
  if (!trouve) throw new Error('Fichier schema.sql introuvable.');
  return trouve;
}

export async function initialiserBase(): Promise<void> {
  const { rows } = await pool.query<{ table: string | null }>("SELECT to_regclass('public.utilisateur') AS table");
  if (!rows[0].table) {
    await pool.query(await readFile(cheminSchema(), 'utf8'));
    console.log('Base vide : tables créées à partir de schema.sql.');
  }

  const motDePasse = process.env.ADMIN_MOT_DE_PASSE;
  if (!motDePasse) return;
  const { rowCount } = await pool.query("SELECT 1 FROM utilisateur WHERE role = 'admin' LIMIT 1");
  if (rowCount) return;
  const identifiant = (process.env.ADMIN_IDENTIFIANT ?? 'admin').toLowerCase();
  const hache = await bcrypt.hash(motDePasse, 12);
  await pool.query("INSERT INTO utilisateur (identifiant, mot_de_passe, nom, role) VALUES ($1, $2, 'Administrateur', 'admin')", [identifiant, hache]);
  console.log(`Premier administrateur créé : ${identifiant}`);
}
