# myBank

Application web de banque fictive : dépôts, retraits et virements entre clients, validés par un administrateur.
Projet réalisé pour le titre professionnel Concepteur Développeur d'Applications (CDA).

> Banque fictive : aucun argent réel, aucune donnée bancaire réelle.

## Stack

| Couche | Technologie |
|---|---|
| Front-end | React 19, TypeScript, Vite, React Router |
| API | Node.js, Express 5, TypeScript |
| Base relationnelle | PostgreSQL 16 (comptes, opérations, virements) |
| Base NoSQL | MongoDB 7 (journal des actions) |
| Sécurité | bcrypt, JWT en cookie httpOnly, helmet, limite de tentatives |
| Tests | Vitest, Supertest |
| DevOps | Docker, Docker Compose, GitHub Actions (CI/CD), Railway |

## Lancer le projet avec Docker (recommandé)

Prérequis : Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

Ouvrez http://localhost:8080.

Au premier démarrage, PostgreSQL crée les tables (`database/schema.sql`) puis le premier administrateur (`database/seed.sql`, identifiant `admin`). Le mot de passe de développement est indiqué en commentaire dans `seed.sql` : changez-le avant toute mise en ligne.

Pour repartir d'une base vide : `docker compose down -v`.

## Lancer en développement

Il faut une base PostgreSQL sur `localhost:5432` (utilisateur, mot de passe et base : `mybank`), avec `schema.sql` et `seed.sql` exécutés.

```bash
cd backend && npm install && npm run dev      # API sur le port 3000
cd frontend && npm install && npm run dev     # site sur http://localhost:5173
```

MongoDB est facultatif en développement : sans `MONGO_URL`, le journal est désactivé.

## Tests

```bash
cd backend && npm test
```

Les tests unitaires tournent toujours. Les tests d'intégration ne tournent que si `DATABASE_URL` pointe vers une base de test, **qui est vidée au début des tests**.

```bash
DATABASE_URL=postgres://mybank:mybank@localhost:55432/mybank_test npm test
```

## Intégration et déploiement continus

Le workflow `.github/workflows/ci.yml` tourne à chaque push et pull request :

1. **backend** : vérification des types, tests unitaires et d'intégration sur PostgreSQL ;
2. **frontend** : tests et construction ;
3. **docker** : construction des images (développement et production), si tout est vert ;
4. **deploy** : sur `main` uniquement, déploie sur Railway (`railway up`), puis vérifie que `/api/sante` répond en ligne.

### Mettre en place le déploiement (une seule fois)

1. Sur Railway, créer un projet avec une base **PostgreSQL** et un service vide nommé **`mybank`**. Le fichier `railway.json` indique de construire le `Dockerfile` et de surveiller `/api/sante`.
2. Variables du service `mybank` : `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `JWT_SECRET` (longue valeur aléatoire), `ADMIN_MOT_DE_PASSE`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`, `INIT_BASE=true` (et `MONGO_URL` si vous utilisez MongoDB). Railway fournit `PORT`.
3. Générer un domaine public pour le service (*Settings* → *Networking*).
4. Créer un jeton de projet (*Project Settings* → *Tokens*).
5. Sur GitHub, *Settings* → *Secrets and variables* → *Actions* : ajouter le secret `RAILWAY_TOKEN` et la variable `APP_URL` (l'adresse du site). Tant que `APP_URL` n'existe pas, le job deploy est sauté.

Ensuite, chaque push sur `main` est testé, construit puis déployé automatiquement.

En production, une seule image (`Dockerfile` à la racine) contient l'API et le front compilé. Au premier démarrage, l'API crée les tables et le premier administrateur (`INIT_BASE=true`).

## Architecture

```
backend/src
├── controllers/   routes HTTP : lisent la requête, renvoient la réponse
├── middlewares/   authentification, contrôle des rôles, gestion des erreurs
├── services/      cas d'utilisation : transactions, validation, journal
├── domain/        classes métier (Utilisateur, Client, Admin, Virement) : les règles de gestion
├── repositories/  seul endroit où l'on écrit du SQL (requêtes paramétrées)
└── db/            connexion PostgreSQL et journal MongoDB
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL |
| `MONGO_URL` | connexion MongoDB (facultatif) |
| `JWT_SECRET` | clé de signature des jetons, obligatoire en production |
| `COOKIE_SECURE` | `true` quand le site est servi en HTTPS |
| `TRUST_PROXY` | `true` derrière un reverse proxy (Nginx, Railway) |
| `INIT_BASE` | `true` pour créer les tables au démarrage si la base est vide |
| `ADMIN_MOT_DE_PASSE` | avec `INIT_BASE`, crée le premier admin s'il n'en existe aucun |
| `DOSSIER_PUBLIC` | dossier du front compilé à servir (défini dans l'image de production) |
