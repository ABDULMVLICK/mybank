import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { appelApi, messageErreur, type EntreeJournal, type UtilisateurAdmin, type Virement } from '../api';
import { formatDate, formatEuros } from '../format';

export default function Admin() {
  const [enAttente, setEnAttente] = useState<Virement[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[]>([]);
  const [journal, setJournal] = useState<EntreeJournal[]>([]);
  const [aSupprimer, setASupprimer] = useState<number | null>(null);
  const [nouvelAdmin, setNouvelAdmin] = useState({ identifiant: '', nom: '', motDePasse: '' });
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const [virements, liste, entrees] = await Promise.all([
      appelApi<Virement[]>('/admin/virements?etat=en_attente'),
      appelApi<UtilisateurAdmin[]>('/admin/utilisateurs'),
      appelApi<EntreeJournal[]>('/admin/journal'),
    ]);
    setEnAttente(virements);
    setUtilisateurs(liste);
    setJournal(entrees);
  }, []);

  useEffect(() => {
    charger().catch((e) => setErreur(messageErreur(e)));
  }, [charger]);

  async function action(travail: () => Promise<string>) {
    setErreur('');
    setMessage('');
    try {
      setMessage(await travail());
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  // Règle 18 : l'admin accepte (l'argent bouge) ou annule un virement en attente.
  function accepter(id: number) {
    void action(async () => {
      const resultat = await appelApi<Virement>(`/admin/virements/${id}/acceptation`, 'POST');
      return resultat.etat === 'accepte' ? 'Virement accepté : les soldes ont été mis à jour.' : 'Solde insuffisant : le virement a été annulé.';
    });
  }

  function annuler(id: number) {
    void action(async () => {
      await appelApi<Virement>(`/admin/virements/${id}/annulation`, 'POST');
      return 'Virement annulé. Aucun solde n’a changé.';
    });
  }

  function supprimer(id: number) {
    setASupprimer(null);
    void action(async () => {
      await appelApi(`/admin/utilisateurs/${id}`, 'DELETE');
      return 'Compte supprimé et anonymisé.';
    });
  }

  function creerAdmin(evenement: FormEvent) {
    evenement.preventDefault();
    void action(async () => {
      await appelApi('/admin/admins', 'POST', nouvelAdmin);
      setNouvelAdmin({ identifiant: '', nom: '', motDePasse: '' });
      return 'Compte administrateur créé.';
    });
  }

  return (
    <>
      {message && <p className="succes" role="status">{message}</p>}
      {erreur && <p className="erreur" role="alert">{erreur}</p>}

      <section className="carte">
        <h2>Virements en attente <span className="compteur">{enAttente.length}</span></h2>
        {enAttente.length === 0 ? (
          <p className="discret">Aucun virement en attente.</p>
        ) : (
          <div className="tableau">
            <table>
              <thead><tr><th>Date</th><th>De</th><th>Vers</th><th className="nombre">Montant</th><th></th></tr></thead>
              <tbody>
                {enAttente.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDate(v.date)}</td>
                    <td>{v.expediteur}</td>
                    <td>{v.beneficiaire}</td>
                    <td className="nombre">{formatEuros(v.montant)}</td>
                    <td className="actions">
                      <button type="button" onClick={() => accepter(v.id)}>Accepter</button>
                      <button type="button" className="secondaire" onClick={() => annuler(v.id)}>Annuler</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="carte">
        <h2>Utilisateurs</h2>
        <div className="tableau">
          <table>
            <thead><tr><th>Identifiant</th><th>Nom</th><th>Rôle</th><th className="nombre">Solde</th><th></th></tr></thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className={u.actif ? '' : 'inactif'}>
                  <td>{u.identifiant}</td>
                  <td>{u.nom}</td>
                  <td>{u.role === 'admin' ? 'Admin' : 'Client'}</td>
                  <td className="nombre">{u.role === 'client' ? formatEuros(u.solde) : '—'}</td>
                  <td className="actions">
                    {u.role === 'client' && u.actif && (aSupprimer === u.id ? (
                      <>
                        <button type="button" className="lien danger" onClick={() => supprimer(u.id)}>Confirmer</button>
                        <button type="button" className="lien" onClick={() => setASupprimer(null)}>Annuler</button>
                      </>
                    ) : (
                      <button type="button" className="lien danger" onClick={() => setASupprimer(u.id)}>Supprimer</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="carte">
        <h2>Créer un administrateur</h2>
        <form className="ligne" onSubmit={creerAdmin}>
          <label htmlFor="adminId" className="masque">Identifiant</label>
          <input id="adminId" placeholder="Identifiant" value={nouvelAdmin.identifiant} onChange={(e) => setNouvelAdmin({ ...nouvelAdmin, identifiant: e.target.value })} required />
          <label htmlFor="adminNom" className="masque">Nom</label>
          <input id="adminNom" placeholder="Nom" value={nouvelAdmin.nom} onChange={(e) => setNouvelAdmin({ ...nouvelAdmin, nom: e.target.value })} required />
          <label htmlFor="adminMdp" className="masque">Mot de passe</label>
          <input id="adminMdp" type="password" autoComplete="new-password" placeholder="Mot de passe" value={nouvelAdmin.motDePasse} onChange={(e) => setNouvelAdmin({ ...nouvelAdmin, motDePasse: e.target.value })} required />
          <button type="submit">Créer</button>
        </form>
      </section>

      <section className="carte">
        <h2>Journal des actions</h2>
        {journal.length === 0 ? (
          <p className="discret">Journal vide ou MongoDB non connecté.</p>
        ) : (
          <ul className="journal">
            {journal.map((entree, i) => (
              <li key={i}>
                <span className="discret">{formatDate(entree.date)}</span> <b>{entree.action}</b>
                {entree.idUtilisateur !== null && <> · utilisateur n° {entree.idUtilisateur}</>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
