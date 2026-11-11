import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { appelApi, messageErreur } from '../api';
import { useAuth } from '../AuthContext';

export default function Profil() {
  const { utilisateur, rafraichir } = useAuth();
  const navigate = useNavigate();
  const [nom, setNom] = useState(utilisateur?.nom ?? '');
  const [confirmation, setConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  async function changerNom(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur('');
    setMessage('');
    try {
      await appelApi('/moi', 'PATCH', { nom });
      await rafraichir();
      setMessage('Nom modifié.');
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function supprimer() {
    setErreur('');
    try {
      await appelApi('/moi', 'DELETE');
      await rafraichir();
      navigate('/connexion');
    } catch (e) {
      setConfirmation(false);
      setErreur(messageErreur(e));
    }
  }

  return (
    <>
      <section className="carte">
        <h2>Mon profil</h2>
        <p className="discret">Identifiant : <b>{utilisateur?.identifiant}</b> · Rôle : {utilisateur?.role === 'admin' ? 'administrateur' : 'client'}</p>
        <form className="ligne" onSubmit={changerNom}>
          <label htmlFor="nom" className="masque">Nom</label>
          <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          <button type="submit">Enregistrer</button>
        </form>
        {message && <p className="succes" role="status">{message}</p>}
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>

      {utilisateur?.role === 'client' && (
        <section className="carte">
          <h2>Supprimer mon compte</h2>
          <p className="discret">
            Votre solde doit être à zéro. Vos données personnelles seront anonymisées ; l'historique des virements reste conservé pour les autres clients.
          </p>
          {confirmation ? (
            <div className="ligne">
              <button type="button" className="danger" onClick={supprimer}>Oui, supprimer définitivement</button>
              <button type="button" className="secondaire" onClick={() => setConfirmation(false)}>Garder mon compte</button>
            </div>
          ) : (
            <button type="button" className="secondaire" onClick={() => setConfirmation(true)}>Supprimer mon compte</button>
          )}
        </section>
      )}
    </>
  );
}
