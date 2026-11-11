import { Router } from 'express';
import { utilisateurConnecte } from '../middlewares/authentification.js';
import { VirementService } from '../services/VirementService.js';

// Routes réservées aux clients : consulter et créer leurs virements.
// Changer l'état d'un virement est réservé à l'admin (règle 16).
export const virementRouter = Router();
const virements = new VirementService();

virementRouter.get('/', async (_req, res) => {
  res.json(await virements.lister(utilisateurConnecte(res).id));
});

virementRouter.post('/', async (req, res) => {
  res.status(201).json(await virements.creer(utilisateurConnecte(res).id, req.body));
});
