import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { appelApi, messageErreur, type Virement } from '../api';
import { useAuth } from '../AuthContext';
import { formatDate, formatEuros, libelleEtat, lireMontant } from '../format';

// Le client crée ses virements et suit leur état. Seul l'admin accepte ou annule (règle 16).
export default function Virements() {
  const { utilisateur } = useAuth();
  const [virements, setVirements] = useState<Virement[]>([]);
  const [beneficiaire, setBeneficiaire] = useState('');
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setVirements(await appelApi<Virement[]>('/virements'));
  }, []);

  useEffect(() => {
    charger().catch((e) => setErreur(messageErreur(e)));
  }, [charger]);

  async function creer(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur('');
    setMessage('');
    try {
      await appelApi('/virements', 'POST', { identifiantBeneficiaire: beneficiaire, montant: lireMontant(montant) });
      setBeneficiaire('');
      setMontant('');
      setMessage("Virement envoyé. Il est en attente : votre compte sera débité quand l'administrateur l'acceptera.");
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  return (
    <>
      <section className="carte">
        <h2>Nouveau virement</h2>
        <form className="ligne" onSubmit={creer}>
          <label htmlFor="beneficiaire" className="masque">Identifiant du bénéficiaire</label>
          <input id="beneficiaire" placeholder="Identifiant du bénéficiaire" value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} required />
          <label htmlFor="montantVirement" className="masque">Montant en euros</label>
          <input id="montantVirement" inputMode="decimal" placeholder="Montant (1 à 500 €)" value={montant} onChange={(e) => setMontant(e.target.value)} required />
          <button type="submit">Envoyer</button>
        </form>
        {message && <p className="succes" role="status">{message}</p>}
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>

      <section className="carte">
        <h2>Mes virements</h2>
        {virements.length === 0 ? (
          <p className="discret">Aucun virement envoyé ni reçu.</p>
        ) : (
          <div className="tableau">
            <table>
              <thead>
                <tr><th>Date</th><th>Sens</th><th>Avec</th><th className="nombre">Montant</th><th>État</th></tr>
              </thead>
              <tbody>
                {virements.map((v) => {
                  const envoye = v.idExpediteur === utilisateur?.id;
                  return (
                    <tr key={v.id}>
                      <td>{formatDate(v.date)}</td>
                      <td>{envoye ? 'Envoyé' : 'Reçu'}</td>
                      <td>{envoye ? v.beneficiaire : v.expediteur}</td>
                      <td className="nombre">{formatEuros(v.montant)}</td>
                      <td><span className={`badge ${v.etat}`}>{libelleEtat(v.etat)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
