import { Admin } from '../domain/Admin.js';
import { Client } from '../domain/Client.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import { versEuros } from '../domain/montant.js';
import type { Role } from '../domain/Utilisateur.js';

// Ce que l'API renvoie sur un utilisateur. Le mot de passe n'en fait jamais partie.
export interface VueUtilisateur {
  id: number;
  identifiant: string;
  nom: string;
  role: Role;
  solde?: number;
}

export function versVueUtilisateur(utilisateur: Client | Admin): VueUtilisateur {
  const vue: VueUtilisateur = {
    id: utilisateur.getId(),
    identifiant: utilisateur.getIdentifiant(),
    nom: utilisateur.getNom(),
    role: utilisateur.getRole(),
  };
  if (utilisateur instanceof Client) vue.solde = versEuros(utilisateur.getSoldeCentimes());
  return vue;
}

export function exigerClient(utilisateur: Client | Admin | null, message = 'Compte introuvable.'): Client {
  if (!(utilisateur instanceof Client) || !utilisateur.estActif()) {
    throw new ErreurMetier(message, 404);
  }
  return utilisateur;
}

export function exigerAdmin(utilisateur: Client | Admin | null): Admin {
  if (!(utilisateur instanceof Admin)) {
    throw new ErreurMetier('Accès refusé.', 403);
  }
  return utilisateur;
}
