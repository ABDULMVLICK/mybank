import { ErreurMetier } from './ErreurMetier.js';

export type Role = 'client' | 'admin';

// Classe abstraite : on ne crée jamais un « utilisateur » tout court,
// seulement un Client ou un Admin, qui héritent de ce qui est commun.
export abstract class Utilisateur {
  private readonly id: number;
  private identifiant: string;
  private nom: string;

  protected constructor(id: number, identifiant: string, nom: string) {
    this.id = id;
    this.identifiant = identifiant;
    this.nom = nom;
  }

  getId(): number {
    return this.id;
  }

  getIdentifiant(): string {
    return this.identifiant;
  }

  getNom(): string {
    return this.nom;
  }

  changerNom(nom: string): void {
    const propre = nom.trim();
    if (propre.length < 2 || propre.length > 100) {
      throw new ErreurMetier('Le nom doit contenir entre 2 et 100 caractères.');
    }
    this.nom = propre;
  }

  // Règle 8 : un compte supprimé est anonymisé, pas effacé, pour garder l'historique des virements.
  // « protected » : seules les classes filles peuvent l'appeler.
  protected anonymiser(): void {
    this.identifiant = `supprime-${this.id}`;
    this.nom = 'Compte supprimé';
  }

  // Méthode abstraite : chaque classe fille doit dire quel est son rôle.
  abstract getRole(): Role;
}
