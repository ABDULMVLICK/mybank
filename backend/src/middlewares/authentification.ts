import type { NextFunction, Request, Response } from 'express';
import { pool } from '../db/postgres.js';
import { Client } from '../domain/Client.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import type { Role } from '../domain/Utilisateur.js';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository.js';
import { AuthService } from '../services/AuthService.js';

export const NOM_COOKIE = 'jeton';

export interface UtilisateurConnecte {
  id: number;
  role: Role;
}

// Vérifie le jeton reçu dans le cookie, puis recharge l'utilisateur en base :
// un compte supprimé entre-temps est refusé, et le rôle vient de la base, pas du jeton.
export async function authentifier(req: Request, res: Response, next: NextFunction): Promise<void> {
  const jeton: unknown = req.cookies?.[NOM_COOKIE];
  if (typeof jeton !== 'string') throw new ErreurMetier('Vous devez être connecté.', 401);

  let id: number;
  try {
    id = AuthService.verifierJeton(jeton).id;
  } catch {
    throw new ErreurMetier('Session expirée : reconnectez-vous.', 401);
  }

  const utilisateur = await new UtilisateurRepository(pool).trouverParId(id);
  if (!utilisateur || (utilisateur instanceof Client && !utilisateur.estActif())) {
    throw new ErreurMetier('Vous devez être connecté.', 401);
  }
  const connecte: UtilisateurConnecte = { id: utilisateur.getId(), role: utilisateur.getRole() };
  res.locals.utilisateur = connecte;
  next();
}

// Contrôle d'accès par rôle : 403 si le rôle ne correspond pas.
export function exigerRole(role: Role) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (utilisateurConnecte(res).role !== role) throw new ErreurMetier('Accès refusé.', 403);
    next();
  };
}

export function utilisateurConnecte(res: Response): UtilisateurConnecte {
  return res.locals.utilisateur as UtilisateurConnecte;
}
