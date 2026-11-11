import { Router } from 'express';
import { utilisateurConnecte } from '../middlewares/authentification.js';
import { CompteService } from '../services/CompteService.js';

// Routes réservées aux clients : dépôt, retrait et historique des opérations.
export const compteRouter = Router();
const comptes = new CompteService();

compteRouter.post('/depot', async (req, res) => {
  res.json(await comptes.deposer(utilisateurConnecte(res).id, req.body));
});

compteRouter.post('/retrait', async (req, res) => {
  res.json(await comptes.retirer(utilisateurConnecte(res).id, req.body));
});

compteRouter.get('/operations', async (_req, res) => {
  res.json(await comptes.operations(utilisateurConnecte(res).id));
});
