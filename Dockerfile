# Image de PRODUCTION « tout-en-un » : l'API Node sert aussi le front React compilé.
# Une seule origine pour le navigateur : pas de CORS, et le cookie SameSite=Strict fonctionne.
# (En local, docker-compose garde deux conteneurs séparés : Nginx pour le front, Node pour l'API.)

# Étape 1 : construire le front
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Étape 2 : compiler l'API
FROM node:22-alpine AS api
WORKDIR /api
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Étape 3 : image finale, sans outils de développement
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production DOSSIER_PUBLIC=/app/public
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=api /api/dist ./dist
COPY --from=front /front/dist ./public
COPY database/schema.sql ./database/schema.sql
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
