-- Règle 24 : le premier admin est créé directement en base de données.
-- Identifiant : admin  |  Mot de passe de DÉVELOPPEMENT : Admin1234!
-- À changer avant toute mise en ligne : générez un nouveau hash bcrypt.
INSERT INTO utilisateur (identifiant, mot_de_passe, nom, role)
VALUES ('admin', '$2b$12$oUCOhQYebcaNe6ZXzazSk..5JVYX9X6MpXHJEeX3Uj5kPnRODlJ7G', 'Administrateur', 'admin')
ON CONFLICT (identifiant) DO NOTHING;
