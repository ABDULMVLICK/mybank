import { Router, type CookieOptions } from 'express';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config.js';
import { NOM_COOKIE } from '../middlewares/authentification.js';
import { AuthService } from '../services/AuthService.js';
import { versVueUtilisateur } from '../services/vues.js';

export const authRouter = Router();
const auth = new AuthService();

// Le jeton est rangé dans un cookie que le JavaScript de la page ne peut pas lire (httpOnly) :
// une faille XSS ne permettrait pas de le voler. SameSite=strict bloque les requêtes venant d'un autre site (CSRF).
const optionsCookie: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.cookieSecure,
  path: '/',
};

// Force brute : au plus 5 tentatives de connexion par minute et par adresse IP.
const limiteConnexion = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => config.test,
  message: { erreur: 'Trop de tentatives. Réessayez dans une minute.' },
});

authRouter.post('/inscription', async (req, res) => {
  const client = await auth.inscrire(req.body);
  res.status(201).json(versVueUtilisateur(client));
});

authRouter.post('/connexion', limiteConnexion, async (req, res) => {
  const { jeton, utilisateur } = await auth.connecter(req.body);
  res.cookie(NOM_COOKIE, jeton, { ...optionsCookie, maxAge: 60 * 60 * 1000 });
  res.json(versVueUtilisateur(utilisateur));
});

authRouter.post('/deconnexion', (_req, res) => {
  res.clearCookie(NOM_COOKIE, optionsCookie);
  res.status(204).end();
});
