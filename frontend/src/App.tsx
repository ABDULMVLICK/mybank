import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { Role } from './api';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Accueil from './pages/Accueil';
import Admin from './pages/Admin';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Profil from './pages/Profil';
import Virements from './pages/Virements';

// Route protégée : sans connexion, retour à la page de connexion ; avec le mauvais rôle, retour à l'accueil.
// Ce n'est qu'un confort d'affichage : la vraie protection est faite par l'API (401 / 403).
function Protegee({ role, children }: { role?: Role; children: ReactNode }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <p className="chargement">Chargement…</p>;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  if (role && utilisateur.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AccueilSelonRole() {
  const { utilisateur } = useAuth();
  return utilisateur?.role === 'admin' ? <Navigate to="/admin" replace /> : <Accueil />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route
        element={
          <Protegee>
            <Layout />
          </Protegee>
        }
      >
        <Route index element={<AccueilSelonRole />} />
        <Route path="virements" element={<Protegee role="client"><Virements /></Protegee>} />
        <Route path="profil" element={<Profil />} />
        <Route path="admin" element={<Protegee role="admin"><Admin /></Protegee>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
