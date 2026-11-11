import { creerApp } from './app.js';
import { config } from './config.js';
import { initialiserBase } from './db/initialiser.js';
import { connecterJournal } from './db/journal.js';

if (config.initBase) {
  await initialiserBase();
}

try {
  await connecterJournal(config.mongoUrl);
} catch (erreur) {
  console.error('MongoDB injoignable, le journal est désactivé :', erreur);
}

creerApp().listen(config.port, () => {
  console.log(`API myBank démarrée sur le port ${config.port}`);
});
