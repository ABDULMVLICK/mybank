import { MongoClient, type Collection } from 'mongodb';

// Journal des actions, stocké dans MongoDB (base NoSQL).
// Chaque entrée est un document JSON libre : une action n'a pas toujours les mêmes détails,
// c'est pour ça qu'une base orientée documents convient mieux qu'une table SQL ici.

interface EntreeJournal {
  action: string;
  idUtilisateur: number | null;
  details: Record<string, unknown>;
  date: Date;
}

// Règle de conservation (RGPD) : une entrée du journal est effacée automatiquement après 12 mois.
const CONSERVATION_SECONDES = 365 * 24 * 60 * 60;

let collection: Collection<EntreeJournal> | null = null;

export async function connecterJournal(url: string | undefined): Promise<void> {
  if (!url) return;
  const client = new MongoClient(url);
  await client.connect();
  const journal = client.db().collection<EntreeJournal>('journal');
  // Index TTL : MongoDB supprime lui-même les documents dont la date est dépassée.
  await journal.createIndex({ date: 1 }, { expireAfterSeconds: CONSERVATION_SECONDES });
  collection = journal;
}

// Le journal ne doit jamais faire échouer une action bancaire : on enregistre l'erreur et on continue.
export async function journaliser(action: string, idUtilisateur: number | null, details: Record<string, unknown> = {}): Promise<void> {
  if (!collection) return;
  try {
    await collection.insertOne({ action, idUtilisateur, details, date: new Date() });
  } catch (erreur) {
    console.error('Journal indisponible :', erreur);
  }
}

export async function lireJournal(limite = 50) {
  if (!collection) return [];
  return collection.find({}, { projection: { _id: 0 } }).sort({ date: -1 }).limit(limite).toArray();
}
