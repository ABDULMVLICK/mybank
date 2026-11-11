import type { EtatVirement } from './api';

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const dates = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export function formatEuros(montant: number): string {
  return euros.format(montant);
}

export function formatDate(date: string): string {
  return dates.format(new Date(date));
}

export function libelleEtat(etat: EtatVirement): string {
  return { en_attente: 'En attente', accepte: 'Accepté', annule: 'Annulé' }[etat];
}

// Un champ de formulaire donne du texte : on accepte la virgule française.
export function lireMontant(saisie: string): number {
  return Number(saisie.replace(',', '.').trim());
}
