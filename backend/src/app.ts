import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { adminRouter } from './controllers/adminController.js';
import { authRouter } from './controllers/authController.js';
import { compteRouter } from './controllers/compteController.js';
import { moiRouter } from './controllers/moiController.js';
import { virementRouter } from './controllers/virementController.js';
import { config } from './config.js';
import { authentifier, exigerRole } from './middlewares/authentification.js';
import { gererErreurs } from './middlewares/erreurs.js';

// Architecture en couches :
//   controllers  -> lisent la requête HTTP et renvoient la réponse
//   services     -> orchestrent les cas d'utilisation (transactions, journal)
//   domain       -> classes métier qui portent les règles de gestion
//   repositories -> seul endroit où l'on écrit du SQL
export function creerApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(helmet()); // en-têtes de sécurité HTTP
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.get('/api/sante', (_req, res) => {
    res.json({ statut: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/moi', authentifier, moiRouter);
  app.use('/api/compte', authentifier, exigerRole('client'), compteRouter);
  app.use('/api/virements', authentifier, exigerRole('client'), virementRouter);
  app.use('/api/admin', authentifier, exigerRole('admin'), adminRouter);

  // Production : le front compilé est servi par l'API. Toute adresse hors /api renvoie index.html (routes React).
  if (config.dossierPublic) {
    const dossier = path.resolve(config.dossierPublic);
    app.use(express.static(dossier));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(dossier, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ erreur: 'Route introuvable.' });
  });
  app.use(gererErreurs);

  return app;
}
