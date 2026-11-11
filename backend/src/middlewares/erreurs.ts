import type { NextFunction, Request, Response } from 'express';
import { ErreurMetier } from '../domain/ErreurMetier.js';

// Dernier middleware : transforme toute erreur en réponse JSON avec le bon code HTTP.
// Les détails techniques restent dans les logs du serveur, jamais dans la réponse.
export function gererErreurs(erreur: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (erreur instanceof ErreurMetier) {
    res.status(erreur.statut).json({ erreur: erreur.message });
    return;
  }

  const code = (erreur as { code?: string; type?: string }) ?? {};
  if (code.type === 'entity.parse.failed') {
    res.status(400).json({ erreur: 'Le corps de la requête n’est pas un JSON valide.' });
    return;
  }
  if (code.type === 'entity.too.large') {
    res.status(413).json({ erreur: 'Requête trop volumineuse.' });
    return;
  }
  // Codes PostgreSQL : 23505 = valeur unique en double, 23514 = contrainte CHECK refusée.
  if (code.code === '23505') {
    res.status(409).json({ erreur: 'Cette valeur existe déjà.' });
    return;
  }
  if (code.code === '23514') {
    res.status(400).json({ erreur: 'Donnée refusée par les règles de la base.' });
    return;
  }

  console.error(erreur);
  res.status(500).json({ erreur: 'Erreur interne du serveur.' });
}
