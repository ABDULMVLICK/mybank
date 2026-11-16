"""Génère les wireframes myBank (SVG gris, basse fidélité) et le schéma d'enchaînement des écrans."""
import html, sys

OUT = sys.argv[1]
F = "font-family='Arial, Helvetica, sans-serif'"
G1, G2, G3, G4, TX = '#f2f2f2', '#d9d9d9', '#bdbdbd', '#8c8c8c', '#333333'
NOTE = '#d9480f'


class Ecran:
    def __init__(self, w, h, titre):
        self.w, self.h, self.titre, self.el, self.notes = w, h, titre, [], []

    def rect(self, x, y, w, h, fill=G1, stroke=G3, r=4, dash=False):
        d = " stroke-dasharray='6 4'" if dash else ''
        self.el.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='{r}' fill='{fill}' stroke='{stroke}' stroke-width='1.5'{d}/>")

    def txt(self, x, y, t, size=14, bold=False, color=TX, anchor='start'):
        b = " font-weight='700'" if bold else ''
        self.el.append(f"<text x='{x}' y='{y}' {F} font-size='{size}'{b} fill='{color}' text-anchor='{anchor}'>{html.escape(t)}</text>")

    def ligne(self, x1, y1, x2, y2, color=G3, w=1.5):
        self.el.append(f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{color}' stroke-width='{w}'/>")

    def champ(self, x, y, w, label, placeholder=''):
        self.txt(x, y, label, 13, color=G4)
        self.rect(x, y + 8, w, 36, '#ffffff', G3)
        if placeholder:
            self.txt(x + 12, y + 31, placeholder, 13, color=G3)

    def bouton(self, x, y, w, t, plein=True, h=38):
        self.rect(x, y, w, h, G4 if plein else '#ffffff', G4, 6)
        self.txt(x + w / 2, y + h / 2 + 5, t, 14, True, '#ffffff' if plein else TX, 'middle')

    def texte_bloc(self, x, y, w, n=3, h=8):
        for i in range(n):
            self.rect(x, y + i * (h + 8), w * (0.95 if i < n - 1 else 0.6), h, G2, G2, 3)

    def tableau(self, x, y, w, cols, lignes, badge_col=None, boutons=None):
        lc = w / len(cols)
        self.rect(x, y, w, 34, G2, G3, 0)
        for i, c in enumerate(cols):
            self.txt(x + 10 + i * lc, y + 22, c, 12, True)
        for r in range(lignes):
            yy = y + 34 + r * 36
            self.ligne(x, yy + 36, x + w, yy + 36, G2)
            for i in range(len(cols)):
                if badge_col is not None and i == badge_col:
                    self.rect(x + 10 + i * lc, yy + 9, 74, 20, G2, G4, 10)
                    self.txt(x + 47 + i * lc, yy + 23, 'État', 11, anchor='middle')
                elif boutons and i == len(cols) - 1:
                    bx = x + 10 + i * lc
                    for k, b in enumerate(boutons):
                        self.bouton(bx + k * 84, yy + 6, 78, b, k == 0, 24)
                else:
                    self.rect(x + 10 + i * lc, yy + 14, lc * 0.6, 8, G2, G2, 3)
        return y + 34 + lignes * 36

    def entete(self, items, actif=0, mobile=False):
        self.rect(0, 0, self.w, 56, G4, G4, 0)
        self.txt(20, 35, 'myBank', 20, True, '#ffffff')
        if mobile:
            self.rect(self.w - 56, 14, 36, 28, '#ffffff', '#ffffff', 4)
            for k in range(3):
                self.ligne(self.w - 48, 22 + k * 6, self.w - 28, 22 + k * 6, G4, 2)
            return
        x = 170
        for i, it in enumerate(items):
            self.txt(x, 35, it, 14, i == actif, '#ffffff')
            if i == actif:
                self.ligne(x, 44, x + len(it) * 7.5, 44, '#ffffff', 3)
            x += len(it) * 8 + 34
        self.bouton(self.w - 150, 10, 130, 'Déconnexion', False, 36)

    def carte(self, x, y, w, h, titre=None):
        self.rect(x, y, w, h, '#ffffff', G3, 8)
        if titre:
            self.txt(x + 20, y + 32, titre, 17, True)

    def note(self, n, x, y, texte):
        self.el.append(f"<circle cx='{x}' cy='{y}' r='13' fill='{NOTE}'/>")
        self.txt(x, y + 5, str(n), 13, True, '#ffffff', 'middle')
        self.notes.append((n, texte))

    def svg(self, legende=True):
        lh = 30 + 24 * len(self.notes) if legende and self.notes else 0
        W, H = self.w + 40, self.h + 80 + lh
        out = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H}' viewBox='0 0 {W} {H}'>",
               f"<rect width='{W}' height='{H}' fill='#ffffff'/>",
               f"<text x='20' y='30' {F} font-size='18' font-weight='700' fill='{TX}'>{html.escape(self.titre)}</text>",
               f"<g transform='translate(20,48)'><rect x='-1' y='-1' width='{self.w + 2}' height='{self.h + 2}' fill='#fafafa' stroke='{TX}' stroke-width='2' rx='6'/>"]
        out += self.el + ['</g>']
        y = self.h + 82
        for n, t in self.notes:
            out.append(f"<circle cx='32' cy='{y}' r='10' fill='{NOTE}'/><text x='32' y='{y + 4}' {F} font-size='11' font-weight='700' fill='#fff' text-anchor='middle'>{n}</text>")
            out.append(f"<text x='52' y='{y + 5}' {F} font-size='14' fill='{TX}'>{html.escape(t)}</text>")
            y += 24
        out.append('</svg>')
        return '\n'.join(out)


ecrans = {}
MENU_C = ['Mon compte', 'Virements', 'Profil']
MENU_A = ['Administration', 'Profil']

# 1. Connexion
e = Ecran(960, 560, 'Wireframe 1 — Connexion (ordinateur)')
e.carte(300, 70, 360, 420)
e.txt(480, 125, 'myBank', 28, True, anchor='middle'); e.note(1, 330, 115, 'Logo : rappelle l\'application, sans menu (visiteur non connecté)')
e.txt(480, 160, 'Connexion', 18, True, anchor='middle')
e.champ(330, 195, 300, 'Identifiant'); e.champ(330, 265, 300, 'Mot de passe')
e.note(2, 650, 245, 'Champs avec libellé visible (accessibilité)')
e.rect(330, 330, 300, 30, '#ffffff', G4, 4, True); e.txt(345, 350, 'Message d\'erreur (role="alert")', 12, color=G4)
e.note(3, 650, 345, 'Zone d\'erreur : « Identifiant ou mot de passe incorrect »')
e.bouton(330, 375, 300, 'Se connecter'); e.note(4, 650, 394, 'Action principale')
e.txt(480, 445, 'Pas encore de compte ? Créer un compte', 13, color=G4, anchor='middle'); e.note(5, 650, 441, 'Lien vers l\'inscription')
ecrans['wf1_connexion'] = e

# 2. Inscription
e = Ecran(960, 620, 'Wireframe 2 — Inscription (ordinateur)')
e.carte(300, 40, 360, 540)
e.txt(480, 92, 'myBank', 28, True, anchor='middle'); e.txt(480, 125, 'Créer un compte', 18, True, anchor='middle')
e.champ(330, 155, 300, 'Identifiant', '3 à 30 caractères'); e.note(1, 650, 185, 'Identifiant unique (règle 3)')
e.champ(330, 225, 300, 'Nom'); e.champ(330, 295, 300, 'Mot de passe', '8 caractères, lettre et chiffre')
e.note(2, 650, 325, 'Règle de mot de passe affichée avant la saisie')
e.rect(330, 360, 300, 66, G1, G3, 4); e.texte_bloc(342, 372, 276, 3)
e.note(3, 650, 393, 'Information RGPD : usage des données, droit à l\'effacement')
e.bouton(330, 445, 300, 'Créer mon compte'); e.note(4, 650, 464, 'Compte client créé avec un solde de 0 €')
e.txt(480, 515, 'Déjà inscrit ? Se connecter', 13, color=G4, anchor='middle')
ecrans['wf2_inscription'] = e

# 3. Mon compte
e = Ecran(960, 640, 'Wireframe 3 — Mon compte (client, ordinateur)')
e.entete(MENU_C, 0); e.note(1, 440, 28, 'Menu du client, onglet actif souligné')
e.carte(30, 80, 900, 110)
e.txt(55, 115, 'Mon solde', 14, color=G4); e.txt(55, 165, '0,00 €', 40, True)
e.note(2, 300, 150, 'Le solde, information principale, en grand')
e.carte(30, 210, 440, 120, 'Déposer'); e.rect(55, 260, 230, 38, '#ffffff', G3); e.txt(67, 284, 'Montant (€)', 13, color=G3); e.bouton(300, 260, 140, 'Déposer')
e.carte(490, 210, 440, 120, 'Retirer'); e.rect(515, 260, 230, 38, '#ffffff', G3); e.txt(527, 284, 'Montant (€)', 13, color=G3); e.bouton(760, 260, 140, 'Retirer')
e.note(3, 470, 230, 'Dépôt et retrait côte à côte ; accepte « 12,50 »')
e.carte(30, 350, 900, 270, 'Historique des opérations')
e.tableau(55, 400, 850, ['Date', 'Type', 'Montant'], 5)
e.note(4, 905, 372, 'Dépôts et retraits, du plus récent au plus ancien (règle 6)')
ecrans['wf3_compte'] = e

# 4. Virements
e = Ecran(960, 620, 'Wireframe 4 — Virements (client, ordinateur)')
e.entete(MENU_C, 1)
e.carte(30, 80, 900, 170, 'Nouveau virement')
e.rect(55, 130, 330, 38, '#ffffff', G3); e.txt(67, 154, 'Identifiant du bénéficiaire', 13, color=G3)
e.rect(400, 130, 250, 38, '#ffffff', G3); e.txt(412, 154, 'Montant (1 à 500 €)', 13, color=G3)
e.bouton(665, 130, 160, 'Envoyer')
e.note(1, 905, 150, 'Bénéficiaire existant et différent de soi, 1 à 500 € (règles 11, 12)')
e.rect(55, 185, 770, 44, G1, G4, 4, True); e.txt(70, 212, 'Message : « Virement envoyé. Il est en attente… »', 13, color=G4)
e.note(2, 840, 207, 'Rappelle que le compte n\'est débité qu\'à l\'acceptation')
e.carte(30, 270, 900, 330, 'Mes virements')
e.tableau(55, 320, 850, ['Date', 'Sens', 'Avec', 'Montant', 'État'], 6, badge_col=4)
e.note(3, 905, 292, 'Envoyés et reçus ; badge d\'état avec texte, sans bouton (règle 16)')
ecrans['wf4_virements'] = e

# 5. Profil
e = Ecran(960, 520, 'Wireframe 5 — Profil (client ou administrateur)')
e.entete(MENU_C, 2)
e.carte(30, 80, 900, 190, 'Mes informations')
e.txt(55, 135, 'Identifiant : awa', 14); e.txt(55, 160, 'Rôle : client', 14)
e.rect(55, 185, 330, 38, '#ffffff', G3); e.txt(67, 209, 'Nom', 13, color=G3); e.bouton(400, 185, 160, 'Enregistrer')
e.note(1, 590, 204, 'Modifier son nom, 2 à 100 caractères (règle 5)')
e.carte(30, 290, 900, 200, 'Supprimer mon compte')
e.texte_bloc(55, 335, 600, 2)
e.bouton(55, 380, 230, 'Supprimer mon compte', False); e.note(2, 300, 399, 'Refusé tant que le solde n\'est pas à zéro (règle 9)')
e.rect(55, 430, 520, 44, G1, G4, 4, True); e.txt(70, 457, 'Confirmation dans la page : « Confirmer » / « Annuler »', 13, color=G4)
e.note(3, 590, 452, 'Action irréversible : confirmation, puis retour à la connexion')
ecrans['wf5_profil'] = e

# 6. Administration
e = Ecran(960, 790, 'Wireframe 6 — Administration (administrateur)')
e.entete(MENU_A, 0); e.note(1, 400, 28, 'Menu de l\'admin : pas de solde, pas de virements à lui (règle 23)')
e.carte(30, 80, 900, 270, 'Virements en attente')
e.rect(262, 95, 34, 22, G2, G4, 11); e.txt(279, 111, '3', 12, True, anchor='middle')
e.tableau(55, 130, 850, ['Date', 'De', 'Vers', 'Montant', 'Actions'], 5, boutons=['Accepter', 'Annuler'])
e.note(2, 905, 102, 'Accepter : solde vérifié, débit et crédit ; sinon annulé (règles 15, 17, 18)')
e.carte(30, 370, 560, 245, 'Utilisateurs')
e.tableau(55, 420, 510, ['Identifiant', 'Solde', 'Actif', 'Action'], 4, boutons=['Supprimer'])
e.note(3, 565, 392, 'Supprimer un compte client (règle 20)')
e.carte(610, 370, 320, 245, 'Créer un administrateur')
e.rect(630, 420, 280, 32, '#ffffff', G3); e.txt(642, 441, 'Identifiant', 12, color=G3); e.rect(630, 462, 280, 32, '#ffffff', G3); e.txt(642, 483, 'Nom', 12, color=G3); e.rect(630, 504, 280, 32, '#ffffff', G3); e.txt(642, 525, 'Mot de passe', 12, color=G3)
e.bouton(630, 556, 280, 'Créer', h=34); e.note(4, 905, 392, 'Un admin crée seulement des admins (règle 21)')
e.carte(30, 635, 900, 130, 'Journal des actions')
e.texte_bloc(55, 680, 820, 4, 7); e.note(5, 905, 657, '50 dernières actions, lues dans MongoDB')
ecrans['wf6_admin'] = e

# 7. Mon compte mobile
e = Ecran(360, 740, 'Wireframe 7 — Mon compte (mobile)')
e.entete([], mobile=True); e.note(1, 280, 28, 'Menu replié dans un bouton')
e.carte(16, 76, 328, 110); e.txt(36, 108, 'Mon solde', 13, color=G4); e.txt(36, 160, '0,00 €', 36, True)
e.carte(16, 202, 328, 200, 'Déposer / Retirer')
e.rect(36, 250, 288, 38, '#ffffff', G3); e.txt(48, 274, 'Montant (€)', 13, color=G3)
e.bouton(36, 300, 288, 'Déposer'); e.bouton(36, 348, 288, 'Retirer', False)
e.note(2, 330, 222, 'Une colonne, boutons pleine largeur')
e.carte(16, 418, 328, 300, 'Historique')
for k in range(5):
    yy = 460 + k * 50
    e.rect(36, yy, 140, 8, G2, G2, 3); e.rect(36, yy + 16, 90, 8, G2, G2, 3); e.rect(250, yy + 4, 74, 12, G2, G2, 3)
    e.ligne(36, yy + 36, 324, yy + 36, G2)
e.note(3, 330, 438, 'Lignes empilées, sans défilement latéral')
ecrans['wf7_compte_mobile'] = e

# 8. Virements mobile
e = Ecran(360, 740, 'Wireframe 8 — Virements (mobile)')
e.entete([], mobile=True)
e.carte(16, 76, 328, 250, 'Nouveau virement')
e.rect(36, 122, 288, 38, '#ffffff', G3); e.txt(48, 146, 'Identifiant du bénéficiaire', 13, color=G3)
e.rect(36, 172, 288, 38, '#ffffff', G3); e.txt(48, 196, 'Montant (1 à 500 €)', 13, color=G3)
e.bouton(36, 222, 288, 'Envoyer'); e.rect(36, 272, 288, 38, G1, G4, 4, True); e.txt(48, 296, 'Message', 13, color=G4)
e.note(1, 330, 96, 'Champs empilés, clavier numérique')
e.carte(16, 342, 328, 376, 'Mes virements')
for k in range(5):
    yy = 384 + k * 64
    e.rect(36, yy, 120, 8, G2, G2, 3); e.rect(36, yy + 18, 170, 8, G2, G2, 3)
    e.rect(240, yy - 4, 84, 20, G2, G4, 10); e.txt(282, yy + 10, 'État', 11, anchor='middle')
    e.ligne(36, yy + 44, 324, yy + 44, G2)
e.note(2, 330, 362, 'Un virement par carte, avec son badge d\'état')
ecrans['wf8_virements_mobile'] = e

for nom, ecr in ecrans.items():
    open(f'{OUT}/{nom}.svg', 'w', encoding='utf-8').write(ecr.svg())

# Schéma d'enchaînement des écrans
W, H = 1240, 700
s = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{H}' viewBox='0 0 {W} {H}'>",
     f"<rect width='{W}' height='{H}' fill='#ffffff'/>",
     "<defs><marker id='f' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='8' markerHeight='8' orient='auto-start-reverse'><path d='M0,0 L10,5 L0,10 z' fill='#333'/></marker></defs>",
     f"<text x='30' y='40' {F} font-size='22' font-weight='700' fill='{TX}'>Enchaînement des écrans de myBank</text>",
     f"<text x='30' y='66' {F} font-size='14' fill='{G4}'>Chaque boîte renvoie au wireframe du même numéro. Les flèches portent l'événement qui déclenche le passage.</text>"]
noeuds = {
    'vis': (40, 300, 140, 60, 'Visiteur', None, True),
    'con': (260, 300, 200, 70, 'Connexion', 1, False),
    'ins': (260, 470, 200, 70, 'Inscription', 2, False),
    'cpt': (620, 150, 220, 70, 'Mon compte', 3, False),
    'vir': (960, 150, 220, 70, 'Virements', 4, False),
    'pro': (790, 330, 220, 70, 'Profil', 5, False),
    'adm': (620, 500, 220, 70, 'Administration', 6, False),
}
for k, (x, y, w, h, t, n, ovale) in noeuds.items():
    if ovale:
        s.append(f"<ellipse cx='{x + w / 2}' cy='{y + h / 2}' rx='{w / 2}' ry='{h / 2}' fill='{G1}' stroke='{TX}' stroke-width='2'/>")
    else:
        s.append(f"<rect x='{x}' y='{y}' width='{w}' height='{h}' rx='8' fill='{G1}' stroke='{TX}' stroke-width='2'/>")
        s.append(f"<circle cx='{x + 18}' cy='{y + 18}' r='12' fill='{NOTE}'/><text x='{x + 18}' y='{y + 23}' {F} font-size='12' font-weight='700' fill='#fff' text-anchor='middle'>{n}</text>")
    s.append(f"<text x='{x + w / 2}' y='{y + h / 2 + 6}' {F} font-size='17' font-weight='700' fill='{TX}' text-anchor='middle'>{t}</text>")


def fleche(pts, label, lx, ly, double=False, dash=False):
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in pts)
    deb = " marker-start='url(#f)'" if double else ''
    da = " stroke-dasharray='7 5'" if dash else ''
    s.append(f"<path d='{d}' fill='none' stroke='#333' stroke-width='2'{da} marker-end='url(#f)'{deb}/>")
    if label:
        lw = len(label) * 7.2 + 14
        s.append(f"<rect x='{lx - lw / 2}' y='{ly - 13}' width='{lw}' height='22' rx='4' fill='#ffffff'/>")
        s.append(f"<text x='{lx}' y='{ly + 3}' {F} font-size='13' fill='{TX}' text-anchor='middle'>{html.escape(label)}</text>")


fleche([(180, 330), (258, 333)], 'arrive', 219, 312)
fleche([(330, 372), (330, 468)], 'Créer un compte', 330, 420)
fleche([(400, 468), (400, 372)], 'compte créé', 400, 445)
fleche([(460, 320), (540, 320), (540, 185), (618, 185)], 'rôle client', 540, 250)
fleche([(460, 350), (540, 350), (540, 535), (618, 535)], 'rôle admin', 540, 450)
fleche([(842, 185), (958, 185)], 'menu', 900, 172, double=True)
fleche([(760, 222), (840, 328)], 'menu', 780, 280, double=True)
fleche([(1070, 222), (960, 328)], 'menu', 1040, 280, double=True)
fleche([(780, 498), (840, 402)], 'menu', 840, 460, double=True)
fleche([(1010, 365), (1120, 365), (1120, 610), (225, 610), (225, 352), (258, 352)], '', 0, 0, dash=True)
s.append(f"<rect x='590' y='598' width='300' height='24' rx='4' fill='#ffffff'/><text x='740' y='615' {F} font-size='13' fill='{TX}' text-anchor='middle'>compte supprimé ou déconnexion → Connexion</text>")
s.append(f"<text x='30' y='{H - 60}' {F} font-size='13' fill='{G4}'>Toute page protégée renvoie à la Connexion si la session a expiré (réponse 401 de l'API).</text>")
s.append(f"<text x='30' y='{H - 38}' {F} font-size='13' fill='{G4}'>Un client qui ouvre /admin est renvoyé vers Mon compte ; l'API, elle, répond 403.</text>")
s.append('</svg>')
open(f'{OUT}/enchainement_ecrans.svg', 'w', encoding='utf-8').write('\n'.join(s))
print('ok', len(ecrans) + 1)
