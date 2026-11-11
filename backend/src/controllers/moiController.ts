import { Router } from 'express';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import { utilisateurConnecte } from '../middlewares/authentification.js';
import { CompteService } from '../services/CompteService.js';

// Routes du profil de la personne connectée (client ou admin).
export const moiRouter = Router();
const comptes = new CompteService();

moiRouter.get('/', async (_req, res) => {
  res.json(await comptes.consulter(utilisateurConnecte(res).id));
});

moiRouter.patch('/', async (req, res) => {
  res.json(await comptes.changerNom(utilisateurConnecte(res).id, req.body));
});

// Règle 7 : un client supprime son propre compte. Un admin ne le peut pas (il resterait peut-être sans admin).
moiRouter.delete('/', async (_req, res) => {
  const moi = utilisateurConnecte(res);
  if (moi.role !== 'client') throw new ErreurMetier('Un compte admin ne peut pas être supprimé.', 403);
  await comptes.supprimerSonCompte(moi.id);
  res.clearCookie('jeton', { path: '/' });
  res.status(204).end();
});
