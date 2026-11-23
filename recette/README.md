# Recette

Joue les 12 scénarios du plan de tests (S01 à S06, A01 à A06) dans Chrome, puis mesure l'accessibilité des pages connectées.

```bash
docker build -t mybank-production .
docker network create mb-rec
docker run -d --rm --name mb-pg --network mb-rec -e POSTGRES_USER=mybank -e POSTGRES_PASSWORD=mybank -e POSTGRES_DB=mybank postgres:16-alpine
docker run -d --rm --name mb-mongo --network mb-rec mongo:7
docker run -d --rm --name mb-app --network mb-rec -p 127.0.0.1:8099:3000 -e DATABASE_URL=postgres://mybank:mybank@mb-pg:5432/mybank -e MONGO_URL=mongodb://mb-mongo:27017/mybank -e JWT_SECRET=recette-locale -e INIT_BASE=true -e ADMIN_MOT_DE_PASSE=RecetteLocale1 mybank-production
cd recette && npm install && node recette.mjs
```

Ces valeurs ne servent qu'à la base jetable de la recette. Le script ne vise que `127.0.0.1`.
