import { Link } from 'react-router-dom';

// Page publique : information des utilisateurs (RGPD, articles 12 à 14) et mentions légales.
export default function Confidentialite() {
  return (
    <main className="contenu">
      <p className="retour"><Link to="/">Retour à myBank</Link></p>
      <section className="carte texte">
        <h1>Confidentialité et mentions légales</h1>
        <p>
          myBank est une banque fictive, réalisée comme projet de formation. Aucun argent réel ne circule
          et aucune donnée bancaire n'est demandée.
        </p>

        <h2>Les données enregistrées</h2>
        <ul>
          <li>Votre identifiant, votre nom et votre mot de passe. Le mot de passe est haché : personne ne peut le relire.</li>
          <li>Vos opérations fictives : dépôts, retraits et virements.</li>
          <li>Un journal technique des actions : type d'action, numéro du compte, détails utiles (montant, numéro de virement), date, et l'identifiant saisi si une connexion est refusée.</li>
        </ul>

        <h2>Pourquoi</h2>
        <p>
          Ces données servent uniquement à faire fonctionner votre compte. Elles ne sont ni vendues, ni transmises
          à des partenaires, ni utilisées pour de la publicité.
        </p>

        <h2>Combien de temps</h2>
        <ul>
          <li>Votre compte : jusqu'à ce que vous le supprimiez.</li>
          <li>Le journal des actions : 12 mois, puis suppression automatique.</li>
          <li>Les montants et les dates des virements restent après la suppression, sans votre nom, car ils font partie de l'historique des autres clients.</li>
        </ul>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez consulter vos données, corriger votre nom et supprimer votre compte depuis la page Profil.
          À la suppression, votre identifiant et votre nom sont anonymisés. Pour une autre demande, vous pouvez passer
          par le <a href="https://github.com/ABDULMVLICK/mybank">dépôt du projet</a>. Vous pouvez aussi adresser
          une réclamation à la <a href="https://www.cnil.fr">CNIL</a>.
        </p>

        <h2>Cookie</h2>
        <p>
          Un seul cookie est utilisé, pour rester connecté. Il dure une heure, il est indispensable au service
          et il ne sert pas à vous suivre : aucun bandeau de consentement n'est nécessaire.
        </p>

        <h2>Mentions légales</h2>
        <p>
          Site non professionnel et non commercial, publié dans le cadre du titre professionnel Concepteur
          Développeur d'Applications. Hébergement : Railway Corporation, États-Unis (railway.com) ; les serveurs
          utilisés se trouvent aux Pays-Bas.
        </p>
      </section>
    </main>
  );
}
