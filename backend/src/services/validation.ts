import { ErreurMetier } from '../domain/ErreurMetier.js';

// Le corps d'une requête vient de l'extérieur : on ne lui fait jamais confiance.
// Ces fonctions vérifient la présence et le type de chaque champ.

export function lireChamp(corps: unknown, champ: string): unknown {
  if (typeof corps !== 'object' || corps === null) {
    throw new ErreurMetier('La requête doit contenir un objet JSON.');
  }
  return (corps as Record<string, unknown>)[champ];
}

export function lireTexte(corps: unknown, champ: string): string {
  const valeur = lireChamp(corps, champ);
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    throw new ErreurMetier(`Le champ « ${champ} » est obligatoire.`);
  }
  return valeur.trim();
}

export function validerIdentifiant(identifiant: string): string {
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(identifiant)) {
    throw new ErreurMetier("L'identifiant doit faire 3 à 30 caractères : lettres, chiffres, point, tiret ou soulignement.");
  }
  return identifiant.toLowerCase();
}

export function validerMotDePasse(motDePasse: string): string {
  if (motDePasse.length < 8 || !/[a-zA-Z]/.test(motDePasse) || !/[0-9]/.test(motDePasse)) {
    throw new ErreurMetier('Le mot de passe doit faire au moins 8 caractères, avec au moins une lettre et un chiffre.');
  }
  return motDePasse;
}

export function lireIdentifiantNumerique(valeur: string | string[] | undefined): number {
  const id = Number(valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErreurMetier('Identifiant invalide.', 400);
  }
  return id;
}
