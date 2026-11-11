import { describe, expect, it } from 'vitest';
import { libelleEtat, lireMontant } from './format';

describe('format', () => {
  it('accepte la virgule française dans un montant', () => {
    expect(lireMontant('12,50')).toBe(12.5);
    expect(lireMontant(' 40 ')).toBe(40);
  });

  it('rend un texte non numérique invalide', () => {
    expect(Number.isNaN(lireMontant('abc'))).toBe(true);
  });

  it('traduit les états de virement', () => {
    expect(libelleEtat('en_attente')).toBe('En attente');
    expect(libelleEtat('accepte')).toBe('Accepté');
    expect(libelleEtat('annule')).toBe('Annulé');
  });
});
