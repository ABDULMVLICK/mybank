import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerApp } from '../../src/app.js';
import { pool } from '../../src/db/postgres.js';

// Tests d'intégration : la vraie API, la vraie base PostgreSQL.
// Ils ne tournent que si DATABASE_URL est définie (en CI, une base de test est fournie).
// ATTENTION : la base indiquée est vidée au début des tests.

const app = creerApp();
const base = process.env.DATABASE_URL ? describe : describe.skip;

async function connecter(identifiant: string, motDePasse: string) {
  const agent = request.agent(app); // l'agent garde le cookie entre les requêtes, comme un navigateur
  const reponse = await agent.post('/api/auth/connexion').send({ identifiant, motDePasse });
  expect(reponse.status).toBe(200);
  return agent;
}

base('API myBank', () => {
  beforeAll(async () => {
    const schema = await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8');
    await pool.query('DROP TABLE IF EXISTS virement, operation, utilisateur CASCADE');
    await pool.query(schema);
    // Règle 24 : le premier admin est créé directement en base.
    const hache = await bcrypt.hash('AdminTest123', 4);
    await pool.query("INSERT INTO utilisateur (identifiant, mot_de_passe, nom, role) VALUES ('admin', $1, 'Admin', 'admin')", [hache]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('inscrit deux clients, et refuse un identifiant déjà pris', async () => {
    const awa = await request(app).post('/api/auth/inscription').send({ identifiant: 'awa', motDePasse: 'MotDePasse1', nom: 'Awa' });
    expect(awa.status).toBe(201);
    expect(awa.body).toMatchObject({ identifiant: 'awa', role: 'client', solde: 0 });
    expect(awa.body.motDePasse).toBeUndefined();

    await request(app).post('/api/auth/inscription').send({ identifiant: 'bilal', motDePasse: 'MotDePasse2', nom: 'Bilal' }).expect(201);
    await request(app).post('/api/auth/inscription').send({ identifiant: 'awa', motDePasse: 'MotDePasse1', nom: 'Awa bis' }).expect(409);
  });

  it('refuse un mauvais mot de passe sans dire si l’identifiant existe', async () => {
    const reponse = await request(app).post('/api/auth/connexion').send({ identifiant: 'awa', motDePasse: 'faux12345' });
    expect(reponse.status).toBe(401);
    expect(reponse.body.erreur).toBe('Identifiant ou mot de passe incorrect.');
  });

  it('pose le jeton dans un cookie httpOnly et SameSite=Strict', async () => {
    const reponse = await request(app).post('/api/auth/connexion').send({ identifiant: 'awa', motDePasse: 'MotDePasse1' });
    const cookie = String(reponse.headers['set-cookie']);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('résiste à une tentative d’injection SQL', async () => {
    const reponse = await request(app).post('/api/auth/connexion').send({ identifiant: "' OR '1'='1", motDePasse: "' OR '1'='1" });
    expect(reponse.status).toBe(401);
  });

  it('refuse l’accès sans connexion (401) et l’espace admin à un client (403)', async () => {
    await request(app).get('/api/moi').expect(401);
    const awa = await connecter('awa', 'MotDePasse1');
    await awa.get('/api/admin/utilisateurs').expect(403);
  });

  it('fait un virement complet : dépôt, création, acceptation par l’admin', async () => {
    const awa = await connecter('awa', 'MotDePasse1');
    const depot = await awa.post('/api/compte/depot').send({ montant: 100 });
    expect(depot.body.solde).toBe(100);

    const creation = await awa.post('/api/virements').send({ identifiantBeneficiaire: 'bilal', montant: 50 });
    expect(creation.status).toBe(201);
    expect(creation.body.etat).toBe('en_attente');

    // Le solde n'a pas encore bougé : l'argent ne part qu'à l'acceptation (règle 15).
    expect((await awa.get('/api/moi')).body.solde).toBe(100);

    const admin = await connecter('admin', 'AdminTest123');
    const acceptation = await admin.post(`/api/admin/virements/${creation.body.id}/acceptation`);
    expect(acceptation.status).toBe(200);
    expect(acceptation.body.etat).toBe('accepte');

    expect((await awa.get('/api/moi')).body.solde).toBe(50);
    const bilal = await connecter('bilal', 'MotDePasse2');
    expect((await bilal.get('/api/moi')).body.solde).toBe(50);
  });

  it('annule le virement à l’acceptation si le solde est devenu insuffisant (règle 17)', async () => {
    const awa = await connecter('awa', 'MotDePasse1');
    const creation = await awa.post('/api/virements').send({ identifiantBeneficiaire: 'bilal', montant: 80 });
    const admin = await connecter('admin', 'AdminTest123');
    const acceptation = await admin.post(`/api/admin/virements/${creation.body.id}/acceptation`);
    expect(acceptation.body.etat).toBe('annule');
    expect((await awa.get('/api/moi')).body.solde).toBe(50);
  });

  it('laisse l’admin annuler un virement en attente, puis le fige (règles 14 et 18)', async () => {
    const awa = await connecter('awa', 'MotDePasse1');
    const creation = await awa.post('/api/virements').send({ identifiantBeneficiaire: 'bilal', montant: 5 });
    const admin = await connecter('admin', 'AdminTest123');
    const annulation = await admin.post(`/api/admin/virements/${creation.body.id}/annulation`);
    expect(annulation.body.etat).toBe('annule');
    await admin.post(`/api/admin/virements/${creation.body.id}/acceptation`).expect(409);
    expect((await awa.get('/api/moi')).body.solde).toBe(50);
  });

  it('applique les règles du virement (montant, soi-même, bénéficiaire inconnu)', async () => {
    const awa = await connecter('awa', 'MotDePasse1');
    await awa.post('/api/virements').send({ identifiantBeneficiaire: 'bilal', montant: 600 }).expect(400);
    await awa.post('/api/virements').send({ identifiantBeneficiaire: 'awa', montant: 10 }).expect(400);
    await awa.post('/api/virements').send({ identifiantBeneficiaire: 'inconnu', montant: 10 }).expect(404);
  });

  it('empêche un client de changer l’état d’un virement (règle 16)', async () => {
    const awa = await connecter('awa', 'MotDePasse1');
    const creation = await awa.post('/api/virements').send({ identifiantBeneficiaire: 'bilal', montant: 5 });
    await awa.post(`/api/admin/virements/${creation.body.id}/acceptation`).expect(403);
    await awa.post(`/api/admin/virements/${creation.body.id}/annulation`).expect(403);
  });

  it('refuse la suppression d’un compte avec un solde, puis l’accepte à zéro', async () => {
    const bilal = await connecter('bilal', 'MotDePasse2');
    await bilal.delete('/api/moi').expect(409);
    await bilal.post('/api/compte/retrait').send({ montant: 50 }).expect(200);
    await bilal.delete('/api/moi').expect(204);
    await request(app).post('/api/auth/connexion').send({ identifiant: 'bilal', motDePasse: 'MotDePasse2' }).expect(401);
  });
});
