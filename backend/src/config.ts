// Configuration lue dans les variables d'environnement.
// Aucun secret n'est écrit dans le code : en production, il faut les fournir.

const production = process.env.NODE_ENV === 'production';

function lire(nom: string, valeurDeDev: string): string {
  const valeur = process.env[nom];
  if (valeur) return valeur;
  if (production) throw new Error(`Variable d'environnement manquante : ${nom}`);
  return valeurDeDev;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: lire('DATABASE_URL', 'postgres://mybank:mybank@localhost:5432/mybank'),
  mongoUrl: process.env.MONGO_URL, // facultatif : sans MongoDB, le journal est simplement désactivé
  jwtSecret: lire('JWT_SECRET', 'secret-de-developpement-uniquement'),
  cookieSecure: process.env.COOKIE_SECURE === 'true', // true dès que le site est en HTTPS
  test: process.env.NODE_ENV === 'test',
  // Derrière un reverse proxy (Nginx, hébergeur), l'adresse IP réelle est dans X-Forwarded-For.
  trustProxy: process.env.TRUST_PROXY === 'true',
  // En production, l'API sert aussi le front React compilé : une seule origine.
  dossierPublic: process.env.DOSSIER_PUBLIC,
  // Au démarrage : crée les tables si la base est vide, puis le premier admin (règle 24).
  initBase: process.env.INIT_BASE === 'true',
};
