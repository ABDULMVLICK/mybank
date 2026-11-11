import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { appelApi, type Utilisateur } from './api';

// Contexte partagé par toutes les pages : qui est connecté ?
interface ValeurAuth {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  rafraichir: () => Promise<void>;
  connecter: (identifiant: string, motDePasse: string) => Promise<void>;
  deconnecter: () => Promise<void>;
}

const ContexteAuth = createContext<ValeurAuth | null>(null);

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      setUtilisateur(await appelApi<Utilisateur>('/moi'));
    } catch {
      setUtilisateur(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  const connecter = useCallback(async (identifiant: string, motDePasse: string) => {
    setUtilisateur(await appelApi<Utilisateur>('/auth/connexion', 'POST', { identifiant, motDePasse }));
  }, []);

  const deconnecter = useCallback(async () => {
    await appelApi('/auth/deconnexion', 'POST');
    setUtilisateur(null);
  }, []);

  return (
    <ContexteAuth.Provider value={{ utilisateur, chargement, rafraichir, connecter, deconnecter }}>
      {children}
    </ContexteAuth.Provider>
  );
}

export function useAuth(): ValeurAuth {
  const valeur = useContext(ContexteAuth);
  if (!valeur) throw new Error('useAuth doit être utilisé dans FournisseurAuth');
  return valeur;
}
