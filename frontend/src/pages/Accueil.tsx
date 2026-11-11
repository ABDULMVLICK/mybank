import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { appelApi, messageErreur, type Operation } from '../api';
import { useAuth } from '../AuthContext';
import { formatDate, formatEuros, lireMontant } from '../format';

export default function Accueil() {
  const { utilisateur, rafraichir } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const chargerOperations = useCallback(async () => {
    setOperations(await appelApi<Operation[]>('/compte/operations'));
  }, []);

  useEffect(() => {
    chargerOperations().catch((e) => setErreur(messageErreur(e)));
  }, [chargerOperations]);

  async function mouvement(evenement: FormEvent, type: 'depot' | 'retrait') {
    evenement.preventDefault();
    setErreur('');
    setMessage('');
    try {
      await appelApi(`/compte/${type}`, 'POST', { montant: lireMontant(montant) });
      setMontant('');
      setMessage(type === 'depot' ? 'Dépôt enregistré.' : 'Retrait enregistré.');
      await Promise.all([rafraichir(), chargerOperations()]);
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  return (
    <>
      <section className="carte solde">
        <span className="etiquette">Solde disponible</span>
        <strong>{formatEuros(utilisateur?.solde ?? 0)}</strong>
        <span className="discret">Bonjour {utilisateur?.nom}</span>
      </section>

      <section className="carte">
        <h2>Déposer ou retirer</h2>
        <form className="ligne" onSubmit={(e) => mouvement(e, 'depot')}>
          <label htmlFor="montant" className="masque">Montant en euros</label>
          <input id="montant" inputMode="decimal" placeholder="Montant en €" value={montant} onChange={(e) => setMontant(e.target.value)} required />
          <button type="submit">Déposer</button>
          <button type="button" className="secondaire" onClick={(e) => mouvement(e, 'retrait')}>Retirer</button>
        </form>
        {message && <p className="succes" role="status">{message}</p>}
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>

      <section className="carte">
        <h2>Historique des opérations</h2>
        {operations.length === 0 ? (
          <p className="discret">Aucune opération pour l'instant. Faites un premier dépôt ci-dessus.</p>
        ) : (
          <div className="tableau">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th className="nombre">Montant</th></tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id}>
                    <td>{formatDate(op.date)}</td>
                    <td>{op.type === 'depot' ? 'Dépôt' : 'Retrait'}</td>
                    <td className={`nombre ${op.type === 'depot' ? 'positif' : 'negatif'}`}>
                      {op.type === 'depot' ? '+' : '−'}{formatEuros(op.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
