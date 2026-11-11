// Point d'entrée unique pour parler à l'API.
// Le jeton est dans un cookie httpOnly : le navigateur l'envoie tout seul, le code JavaScript ne le voit jamais.

export type Role = 'client' | 'admin';
export type EtatVirement = 'en_attente' | 'accepte' | 'annule';

export interface Utilisateur {
  id: number;
  identifiant: string;
  nom: string;
  role: Role;
  solde?: number;
}

export interface Operation {
  id: number;
  type: 'depot' | 'retrait';
  montant: number;
  date: string;
}

export interface Virement {
  id: number;
  montant: number;
  date: string;
  etat: EtatVirement;
  idExpediteur: number;
  expediteur: string;
  beneficiaire: string;
}

export interface UtilisateurAdmin extends Utilisateur {
  solde: number;
  actif: boolean;
}

export interface EntreeJournal {
  action: string;
  idUtilisateur: number | null;
  details: Record<string, unknown>;
  date: string;
}

export class ErreurApi extends Error {
  readonly statut: number;

  constructor(message: string, statut: number) {
    super(message);
    this.statut = statut;
  }
}

export async function appelApi<T>(chemin: string, methode = 'GET', corps?: unknown): Promise<T> {
  const reponse = await fetch(`/api${chemin}`, {
    method: methode,
    credentials: 'same-origin',
    headers: corps === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  if (reponse.status === 204) return undefined as T;
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    throw new ErreurApi(donnees.erreur ?? 'Une erreur est survenue. Réessayez.', reponse.status);
  }
  return donnees as T;
}

export function messageErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : 'Une erreur est survenue. Réessayez.';
}
