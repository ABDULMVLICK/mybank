import { ErreurMetier } from './ErreurMetier.js';

// Tous les calculs se font en centimes (nombres entiers).
// En JavaScript, 0.1 + 0.2 donne 0.30000000000000004 : avec des entiers, ce problème disparaît.

const PLAFOND_CENTIMES = 1_000_000; // 10 000 € par opération, garde-fou technique

export function versCentimes(valeur: unknown): number {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
    throw new ErreurMetier('Le montant doit être un nombre.');
  }
  const centimes = Math.round(valeur * 100);
  if (Math.abs(valeur * 100 - centimes) > 1e-6) {
    throw new ErreurMetier('Le montant ne peut pas avoir plus de 2 décimales.');
  }
  if (centimes <= 0) {
    throw new ErreurMetier('Le montant doit être supérieur à 0.');
  }
  if (centimes > PLAFOND_CENTIMES) {
    throw new ErreurMetier('Le montant ne peut pas dépasser 10 000 € par opération.');
  }
  return centimes;
}

// PostgreSQL renvoie un NUMERIC sous forme de texte, par exemple "125.50".
export function depuisBase(valeur: string): number {
  return Math.round(Number(valeur) * 100);
}

export function versBase(centimes: number): string {
  return (centimes / 100).toFixed(2);
}

export function versEuros(centimes: number): number {
  return centimes / 100;
}
