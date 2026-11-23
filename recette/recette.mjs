// Recette : scénarios système (S01 à S06) et d'acceptation (A01 à A06), joués dans un vrai navigateur
// sur l'image de production lancée en local avec une base vierge. Voir recette/README.md.
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';
const U = 'http://127.0.0.1:8099';
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9333' }); // Chrome lancé avec --remote-debugging-port=9333
const R = [];
const note = (id, ok, obtenu) => { R.push({ id, ok, obtenu }); console.log(id, ok ? 'OK' : 'KO', '|', obtenu); };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (t) => t.replace(/[  ]/g, ' ');
const texte = async (p) => norm(await p.evaluate(() => document.body.innerText));
const mdp = 'Recette123';
let logins = 0; // limite : 5 connexions par minute
async function jeton() { if (logins && logins % 4 === 0) { await pause(62000); } logins++; }
async function page() { const c = await b.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width: 1280, height: 900 }); p.dialogues = 0; p.on('dialog', async (d) => { p.dialogues++; await d.dismiss(); }); return p; }
async function taper(p, sel, v) { await p.waitForSelector(sel); await p.$eval(sel, (e) => e.focus()); await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, v); }
async function bouton(p, libelle) { await p.evaluate((l) => { const x = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === l); if (!x) throw new Error('bouton absent : ' + l); x.click(); }, libelle); await pause(900); }
async function inscrire(p, id, nom) { await jeton(); await p.goto(U + '/inscription', { waitUntil: 'networkidle0' }); await taper(p, '#identifiant', id); await taper(p, '#nom', nom); await taper(p, '#motDePasse', mdp); await bouton(p, 'Créer mon compte'); await pause(900); }
async function connecter(p, id, m) { await jeton(); await p.goto(U + '/connexion', { waitUntil: 'networkidle0' }); await taper(p, '#identifiant', id); await taper(p, '#motDePasse', m); await bouton(p, 'Se connecter'); await pause(900); }
async function aller(p, ch) { await p.goto(U + ch, { waitUntil: 'networkidle0' }); await pause(300); }
async function solde(p) { await aller(p, '/'); return norm(await p.$eval('.solde strong', (e) => e.textContent)); }
async function virement(p, a, m) { await aller(p, '/virements'); await taper(p, '#beneficiaire', a); await taper(p, '#montantVirement', m); await bouton(p, 'Envoyer'); }
const lignes = (p) => p.$$eval('table tbody tr', (t) => t.map((x) => x.innerText.replace(/[  ]/g, ' ').replace(/\s+/g, ' ')));
async function accepter(p, n) { await aller(p, '/admin'); await bouton(p, n ?? 'Accepter'); }

const awa = await page();
await inscrire(awa, 'awa', 'Awa Test');
let t = await texte(awa);
const arrive = t.includes('Solde disponible') || t.toLowerCase().includes('solde disponible');
const s0 = await solde(awa);
note('A01', s0 === '0,00 €', `compte créé et connecté, solde ${s0}`);
await bouton(awa, 'Se déconnecter'); const apres = awa.url();
await connecter(awa, 'awa', mdp); const s1 = await solde(awa);
note('S01', arrive && s0 === '0,00 €' && apres.endsWith('/connexion') && s1 === '0,00 €', `solde ${s0} ; déconnexion → ${new URL(apres).pathname} ; reconnexion ${s1}`);

await taper(awa, '#montant', '120,50'); await bouton(awa, 'Déposer');
await taper(awa, '#montant', '20'); await bouton(awa, 'Retirer');
const s2 = await solde(awa); const op = await lignes(awa);
note('S02', s2 === '100,50 €' && op.length === 2, `solde ${s2}, ${op.length} lignes`);
await taper(awa, '#montant', '0,50'); await bouton(awa, 'Retirer');

const bilal = await page(); await inscrire(bilal, 'bilal', 'Bilal Test');
await virement(awa, 'bilal', '50'); let v = await lignes(awa); const s3 = await solde(awa);
note('A02', v.length === 1 && v[0].includes('En attente') && s3 === '100,00 €', `${v[0]} ; solde ${s3}`);
const admin = await page(); await connecter(admin, 'admin', 'RecetteLocale1'); await accepter(admin);
const sa = await solde(awa), sb = await solde(bilal); await aller(awa, '/virements'); const va = await lignes(awa); await aller(bilal, '/virements'); const vb = await lignes(bilal);
const okV = sa === '50,00 €' && sb === '50,00 €' && va[0].includes('Accepté') && vb[0].includes('Accepté');
note('A03', okV, `Awa ${sa}, Bilal ${sb}, ${va[0]}`);
note('S03', okV, `Awa ${sa} (100 − 50), Bilal ${sb}, Accepté chez les deux`);
await virement(awa, 'bilal', '80'); await accepter(admin);
const sa4 = await solde(awa), sb4 = await solde(bilal); await aller(awa, '/virements'); const v4 = await lignes(awa);
note('A04', sa4 === '50,00 €' && sb4 === '50,00 €' && v4.some((l) => l.includes('80,00') && l.includes('Annulé')), `Awa ${sa4}, Bilal ${sb4}, ${v4.find((l) => l.includes('80,00'))}`);
const n0 = v4.length;
await virement(awa, 'bilal', 'abc'); const e1 = norm(await awa.$eval('.erreur', (e) => e.textContent).catch(() => 'aucun message'));
await virement(awa, 'bilal', '600'); const e2 = norm(await awa.$eval('.erreur', (e) => e.textContent).catch(() => 'aucun message'));
await aller(awa, '/virements'); const n1 = (await lignes(awa)).length;
note('S04', e1 !== 'aucun message' && e2 !== 'aucun message' && n0 === n1, `abc : « ${e1} » ; 600 : « ${e2} » ; virements ${n0} → ${n1}`);
note('A05', /1.*500/.test(e2), `« ${e2} »`);
await aller(awa, '/profil'); await taper(awa, '#nom', '<script>alert(1)</script>'); await bouton(awa, 'Enregistrer');
const ts = await solde(awa) && await texte(awa);
note('S05', awa.dialogues === 0 && ts.includes('<script>alert(1)</script>'), `affiché en texte : ${ts.includes('<script>alert(1)</script>')} ; alertes : ${awa.dialogues}`);
const larg = [];
for (const [p, ch] of [[awa, '/'], [awa, '/virements'], [awa, '/profil'], [awa, '/confidentialite'], [admin, '/admin']]) { await p.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true }); await aller(p, ch); larg.push([ch, await p.evaluate(() => document.documentElement.scrollWidth)]); }
note('S06', larg.every(([, w]) => w <= 375), larg.map((x) => x.join(' ')).join(' ; '));
await admin.setViewport({ width: 1280, height: 900 });
const claire = await page(); await inscrire(claire, 'claire', 'Claire Test');
await aller(claire, '/profil'); await bouton(claire, 'Supprimer mon compte'); await bouton(claire, 'Oui, supprimer définitivement');
await connecter(claire, 'claire', mdp); const ec = norm(await claire.$eval('.erreur', (e) => e.textContent).catch(() => 'connecté !'));
await aller(admin, '/admin'); const ta = await texte(admin);
note('A06', ec !== 'connecté !' && !ta.includes('Claire Test'), `reconnexion : « ${ec} » ; nom visible par l'admin : ${ta.includes('Claire Test')}`);
note('JOURNAL', /virement_accepte/.test(ta), `journal visible : ${/virement_accepte/.test(ta)}`);
await admin.screenshot({ path: 'admin.png', fullPage: true });
for (const [p, ch] of [[awa, '/'], [awa, '/virements'], [awa, '/profil'], [admin, '/admin']]) {
  await p.setViewport({ width: 1280, height: 900 });
  await virement(awa, 'bilal', '10').catch(() => {});
  const r = await lighthouse(U + ch, { port: 9333, output: 'json', logLevel: 'error', onlyCategories: ['accessibility'], disableStorageReset: true, locale: 'en-US' }, undefined, p);
  const c = r.lhr.categories.accessibility;
  console.log('A11Y', ch, r.lhr.finalDisplayedUrl, Math.round(c.score * 100), Object.values(r.lhr.audits).filter((a) => a.score === 0).map((a) => a.id).join(','));
}
await b.disconnect();
console.log(R.filter((r) => r.ok).length + '/' + R.length);
