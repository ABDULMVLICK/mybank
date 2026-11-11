import { describe, expect, it } from 'vitest';
import { Admin } from '../../src/domain/Admin.js';
import { Client } from '../../src/domain/Client.js';
import { versCentimes } from '../../src/domain/montant.js';
import { EtatVirement, Virement } from '../../src/domain/Virement.js';

function nouveauVirement(montantCentimes = 5_000): Virement {
  return new Virement(1, 10, 20, montantCentimes, EtatVirement.EN_ATTENTE, new Date());
}

describe('Virement', () => {
  it('accepte 1 € et 500 €, refuse 0,99 € et 500,01 € (règle 12)', () => {
    expect(() => Virement.verifierMontant(100)).not.toThrow();
    expect(() => Virement.verifierMontant(50_000)).not.toThrow();
    expect(() => Virement.verifierMontant(99)).toThrow();
    expect(() => Virement.verifierMontant(50_001)).toThrow();
  });

  it('refuse un virement à soi-même (règle 11)', () => {
    expect(() => Virement.verifierParticipants(10, 10)).toThrow();
  });

  it('ne peut plus changer une fois accepté (règle 14)', () => {
    const virement = nouveauVirement();
    virement.marquerAccepte();
    expect(() => virement.marquerAnnule()).toThrow('déjà accepté');
  });

  it('ne peut plus changer une fois annulé (règle 14)', () => {
    const virement = nouveauVirement();
    virement.marquerAnnule();
    expect(() => virement.marquerAccepte()).toThrow('déjà annulé');
  });
});

describe('Admin', () => {
  const admin = new Admin(99, 'admin', 'Admin');

  it('accepter : débite, crédite et passe le virement à « accepté » si le solde suffit', () => {
    const awa = new Client(10, 'awa', 'Awa', 10_000, true);
    const bilal = new Client(20, 'bilal', 'Bilal', 0, true);
    const virement = nouveauVirement(5_000);

    admin.accepter(virement, awa, bilal);

    expect(awa.getSoldeCentimes()).toBe(5_000);
    expect(bilal.getSoldeCentimes()).toBe(5_000);
    expect(virement.getEtat()).toBe(EtatVirement.ACCEPTE);
  });

  it('accepter : annule le virement si le solde est insuffisant (règle 17)', () => {
    const awa = new Client(10, 'awa', 'Awa', 1_000, true);
    const bilal = new Client(20, 'bilal', 'Bilal', 0, true);
    const virement = nouveauVirement(5_000);

    admin.accepter(virement, awa, bilal);

    expect(awa.getSoldeCentimes()).toBe(1_000);
    expect(bilal.getSoldeCentimes()).toBe(0);
    expect(virement.getEtat()).toBe(EtatVirement.ANNULE);
  });

  it('annuler : passe le virement à « annulé » sans toucher aux soldes (règle 18)', () => {
    const virement = nouveauVirement();
    admin.annuler(virement);
    expect(virement.getEtat()).toBe(EtatVirement.ANNULE);
  });
});

describe('versCentimes', () => {
  it('convertit les euros en centimes sans erreur d’arrondi', () => {
    expect(versCentimes(0.1 + 0.2)).toBe(30);
    expect(versCentimes(19.99)).toBe(1_999);
  });

  it('refuse le texte, les négatifs et plus de 2 décimales', () => {
    expect(() => versCentimes('50')).toThrow();
    expect(() => versCentimes(-5)).toThrow();
    expect(() => versCentimes(1.234)).toThrow();
  });
});
