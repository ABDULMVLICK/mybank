import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { journaliser } from '../db/journal.js';
import { pool } from '../db/postgres.js';
import { Admin } from '../domain/Admin.js';
import { Client } from '../domain/Client.js';
import { ErreurMetier } from '../domain/ErreurMetier.js';
import type { Role } from '../domain/Utilisateur.js';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository.js';
import { lireTexte, validerIdentifiant, validerMotDePasse } from './validation.js';

const COUT_BCRYPT = 12; // plus le coût est élevé, plus une attaque par force brute est lente
const DUREE_JETON = '1h';

export interface ContenuJeton {
  id: number;
  role: Role;
}

export class AuthService {
  private readonly utilisateurs = new UtilisateurRepository(pool);

  // Règles 2 et 3 : création avec identifiant unique et mot de passe.
  async creerCompte(corps: unknown, role: Role): Promise<Client | Admin> {
    const identifiant = validerIdentifiant(lireTexte(corps, 'identifiant'));
    const motDePasse = validerMotDePasse(lireTexte(corps, 'motDePasse'));
    const nom = lireTexte(corps, 'nom');
    if (nom.length < 2 || nom.length > 100) {
      throw new ErreurMetier('Le nom doit contenir entre 2 et 100 caractères.');
    }
    if (await this.utilisateurs.trouverParIdentifiant(identifiant)) {
      throw new ErreurMetier('Cet identifiant est déjà utilisé.', 409);
    }
    // On ne stocke jamais le mot de passe : seulement son empreinte bcrypt, avec un sel aléatoire.
    const motDePasseHache = await bcrypt.hash(motDePasse, COUT_BCRYPT);
    const utilisateur = await this.utilisateurs.creer(identifiant, motDePasseHache, nom, role);
    await journaliser('compte_cree', utilisateur.getId(), { role });
    return utilisateur;
  }

  async inscrire(corps: unknown): Promise<Client | Admin> {
    return this.creerCompte(corps, 'client');
  }

  async connecter(corps: unknown): Promise<{ jeton: string; utilisateur: Client | Admin }> {
    const identifiant = lireTexte(corps, 'identifiant').toLowerCase();
    const motDePasse = lireTexte(corps, 'motDePasse');
    const trouve = await this.utilisateurs.trouverPourConnexion(identifiant);

    const actif = trouve !== null && !(trouve.utilisateur instanceof Client && !trouve.utilisateur.estActif());
    const motDePasseCorrect = actif && (await bcrypt.compare(motDePasse, trouve.motDePasseHache));

    // Même message dans tous les cas : on ne révèle pas si l'identifiant existe.
    if (!trouve || !motDePasseCorrect) {
      await journaliser('connexion_refusee', null, { identifiant });
      throw new ErreurMetier('Identifiant ou mot de passe incorrect.', 401);
    }

    const contenu: ContenuJeton = { id: trouve.utilisateur.getId(), role: trouve.utilisateur.getRole() };
    const jeton = jwt.sign(contenu, config.jwtSecret, { expiresIn: DUREE_JETON });
    await journaliser('connexion', contenu.id);
    return { jeton, utilisateur: trouve.utilisateur };
  }

  // Vérifie la signature et la date d'expiration du jeton. Lève une erreur s'il est faux.
  static verifierJeton(jeton: string): ContenuJeton {
    const contenu = jwt.verify(jeton, config.jwtSecret) as jwt.JwtPayload;
    return { id: Number(contenu.id), role: contenu.role as Role };
  }
}
