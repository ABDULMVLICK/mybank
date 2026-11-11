import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { appelApi, messageErreur } from '../api';
import { useAuth } from '../AuthContext';

export default function Inscription() {
  const { utilisateur, connecter } = useAuth();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [nom, setNom] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (utilisateur) return <Navigate to="/" replace />;

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await appelApi('/auth/inscription', 'POST', { identifiant, nom, motDePasse });
      await connecter(identifiant, motDePasse);
      navigate('/');
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <main className="auth">
      <form className="carte formulaire" onSubmit={envoyer}>
        <span className="logo">my<b>Bank</b></span>
        <h1>Créer un compte</h1>
        <label htmlFor="identifiant">Identifiant</label>
        <input id="identifiant" autoComplete="username" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
        <small>3 à 30 caractères : lettres, chiffres, point, tiret.</small>
        <label htmlFor="nom">Nom et prénom</label>
        <input id="nom" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <label htmlFor="motDePasse">Mot de passe</label>
        <input id="motDePasse" type="password" autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        <small>Au moins 8 caractères, avec une lettre et un chiffre.</small>
        <p className="discret">
          Vos données servent uniquement à faire fonctionner votre compte. Vous pouvez supprimer votre compte à tout moment depuis votre profil.
        </p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" disabled={envoi}>{envoi ? 'Création…' : 'Créer mon compte'}</button>
        <p className="discret">Déjà inscrit ? <Link to="/connexion">Se connecter</Link></p>
      </form>
    </main>
  );
}
