import { Router } from 'express';
import { utilisateurConnecte } from '../middlewares/authentification.js';
import { AdminService } from '../services/AdminService.js';
import { lireIdentifiantNumerique } from '../services/validation.js';

// Routes réservées aux admins (le contrôle du rôle est fait dans app.ts).
export const adminRouter = Router();
const admin = new AdminService();

adminRouter.get('/utilisateurs', async (_req, res) => {
  res.json(await admin.listerUtilisateurs());
});

adminRouter.delete('/utilisateurs/:id', async (req, res) => {
  await admin.supprimerCompte(utilisateurConnecte(res).id, lireIdentifiantNumerique(req.params.id));
  res.status(204).end();
});

adminRouter.post('/admins', async (req, res) => {
  res.status(201).json(await admin.creerAdmin(req.body));
});

adminRouter.get('/virements', async (req, res) => {
  res.json(await admin.listerVirements(req.query.etat));
});

adminRouter.post('/virements/:id/acceptation', async (req, res) => {
  res.json(await admin.accepter(utilisateurConnecte(res).id, lireIdentifiantNumerique(req.params.id)));
});

adminRouter.post('/virements/:id/annulation', async (req, res) => {
  res.json(await admin.annuler(utilisateurConnecte(res).id, lireIdentifiantNumerique(req.params.id)));
});

adminRouter.get('/journal', async (_req, res) => {
  res.json(await admin.journal());
});
