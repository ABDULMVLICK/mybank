import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  async function seDeconnecter() {
    await deconnecter();
    navigate('/connexion');
  }

  return (
    <div className="page">
      <header className="entete">
        <span className="logo">my<b>Bank</b></span>
        <nav className="menu" aria-label="Navigation principale">
          {utilisateur?.role === 'client' && (
            <>
              <NavLink to="/" end>Mon compte</NavLink>
              <NavLink to="/virements">Virements</NavLink>
            </>
          )}
          {utilisateur?.role === 'admin' && <NavLink to="/admin">Administration</NavLink>}
          <NavLink to="/profil">Profil</NavLink>
          <button type="button" className="lien" onClick={seDeconnecter}>Se déconnecter</button>
        </nav>
      </header>
      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}
