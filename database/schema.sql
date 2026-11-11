-- MPD de myBank pour PostgreSQL.
-- Les contraintes CHECK font respecter les règles de gestion par la base elle-même,
-- même si le code oubliait un contrôle.

CREATE TABLE utilisateur (
  id_utilisateur SERIAL PRIMARY KEY,
  identifiant    VARCHAR(50)   NOT NULL UNIQUE,                    -- règle 3
  mot_de_passe   VARCHAR(255)  NOT NULL,                           -- haché avec bcrypt, jamais en clair
  nom            VARCHAR(100)  NOT NULL,
  role           VARCHAR(10)   NOT NULL DEFAULT 'client'
                 CHECK (role IN ('client', 'admin')),
  solde          NUMERIC(10,2) NOT NULL DEFAULT 0
                 CHECK (solde >= 0),                               -- règle 4
  actif          BOOLEAN       NOT NULL DEFAULT TRUE,              -- règle 8
  CHECK (role = 'client' OR solde = 0)                             -- règle 23 : un admin n'a pas de solde
);

CREATE TABLE operation (
  id_operation   SERIAL PRIMARY KEY,
  type           VARCHAR(10)   NOT NULL CHECK (type IN ('depot', 'retrait')),
  montant        NUMERIC(10,2) NOT NULL CHECK (montant > 0),
  date_operation TIMESTAMP     NOT NULL DEFAULT NOW(),
  id_utilisateur INT           NOT NULL REFERENCES utilisateur(id_utilisateur)
);

CREATE TABLE virement (
  id_virement     SERIAL PRIMARY KEY,
  montant         NUMERIC(10,2) NOT NULL
                  CHECK (montant BETWEEN 1 AND 500),               -- règle 12
  date_virement   TIMESTAMP     NOT NULL DEFAULT NOW(),
  etat            VARCHAR(10)   NOT NULL DEFAULT 'en_attente'
                  CHECK (etat IN ('en_attente', 'accepte', 'annule')), -- règle 14
  id_expediteur   INT NOT NULL REFERENCES utilisateur(id_utilisateur),
  id_beneficiaire INT NOT NULL REFERENCES utilisateur(id_utilisateur),
  CHECK (id_expediteur <> id_beneficiaire)                         -- règle 11
);

-- Index sur les clés étrangères : elles servent à chaque affichage d'historique.
CREATE INDEX idx_operation_utilisateur ON operation(id_utilisateur);
CREATE INDEX idx_virement_expediteur   ON virement(id_expediteur);
CREATE INDEX idx_virement_beneficiaire ON virement(id_beneficiaire);
CREATE INDEX idx_virement_etat         ON virement(etat);
