import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { messageErreur } from '../api';
import { useAuth } from '../AuthContext';

export default function Connexion() {
  const { utilisateur, connecter } = useAuth();
  const navigate = useNavigate();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (utilisateur) return <Navigate to="/" replace />;

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
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
        <h1>Connexion</h1>
        <label htmlFor="identifiant">Identifiant</label>
        <input id="identifiant" autoComplete="username" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
        <label htmlFor="motDePasse">Mot de passe</label>
        <input id="motDePasse" type="password" autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
        <p className="discret">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
      </form>
    </main>
  );
}
