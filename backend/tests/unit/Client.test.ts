import { describe, expect, it } from 'vitest';
import { Client } from '../../src/domain/Client.js';

// Tests unitaires : on teste la classe seule, sans base de données ni serveur.
// Structure AAA : Arrange (préparer), Act (agir), Assert (vérifier).

describe('Client', () => {
  it('ajoute le montant au solde lors d’un dépôt', () => {
    const client = new Client(1, 'awa', 'Awa', 0, true);
    client.deposer(10_000);
    expect(client.getSoldeCentimes()).toBe(10_000);
  });

  it('retire le montant du solde', () => {
    const client = new Client(1, 'awa', 'Awa', 10_000, true);
    client.retirer(3_000);
    expect(client.getSoldeCentimes()).toBe(7_000);
  });

  it('refuse un retrait supérieur au solde (règle 4)', () => {
    const client = new Client(1, 'awa', 'Awa', 5_000, true);
    expect(() => client.retirer(10_000)).toThrow('Solde insuffisant.');
    expect(client.getSoldeCentimes()).toBe(5_000);
  });

  it('refuse un montant négatif ou nul', () => {
    const client = new Client(1, 'awa', 'Awa', 5_000, true);
    expect(() => client.deposer(-500)).toThrow();
    expect(() => client.deposer(0)).toThrow();
  });

  it('refuse la suppression tant que le solde n’est pas à zéro (règle 9)', () => {
    const client = new Client(1, 'awa', 'Awa', 100, true);
    expect(() => client.desactiver()).toThrow('Le solde doit être à zéro');
  });

  it('désactive et anonymise le compte à la suppression (règle 8)', () => {
    const client = new Client(7, 'awa', 'Awa', 0, true);
    client.desactiver();
    expect(client.estActif()).toBe(false);
    expect(client.getIdentifiant()).toBe('supprime-7');
    expect(client.getNom()).toBe('Compte supprimé');
  });
});
