import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Le pool naît à la première requête, pas au chargement du module : sinon
// toute page qui importe src/lib/db/ fait échouer `npm run build` sans base
// et un site sans base ne peut pas se construire.
//
// Chaque test recharge client.ts dans un registre de modules vierge et sans
// pool mémorisé sur globalThis, pour observer un premier chargement.

const urlDesTests = process.env.DATABASE_URL;
let poolDesAutresTests: typeof globalThis.__slPool;
let initDesAutresTests: typeof globalThis.__slInitialisationDuProcessus;

beforeEach(() => {
  poolDesAutresTests = globalThis.__slPool;
  initDesAutresTests = globalThis.__slInitialisationDuProcessus;
  globalThis.__slPool = undefined;
  globalThis.__slInitialisationDuProcessus = undefined;
  delete process.env.DATABASE_URL;
  vi.resetModules();
});

afterEach(async () => {
  // Une affectation de undefined écrirait la chaîne "undefined" dans l'environnement.
  if (urlDesTests === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = urlDesTests;
  await globalThis.__slPool?.end();
  globalThis.__slPool = poolDesAutresTests;
  globalThis.__slInitialisationDuProcessus = initDesAutresTests;
});

describe("client de base : pool créé à la première requête", () => {
  it("se charge sans DATABASE_URL, et c'est la première requête qui dit quoi renseigner (le build échouait sans base)", async () => {
    const client = await import("../src/lib/db/client");

    await expect(client.query("SELECT 1")).rejects.toThrow(/DATABASE_URL manquant/);
    await expect(client.transaction(async () => undefined)).rejects.toThrow(/DATABASE_URL manquant/);
  });

  it("ne met pas en cache l'échec d'une requête sans DATABASE_URL : la variable renseignée, la suivante réussit sans redémarrage", async () => {
    const client = await import("../src/lib/db/client");
    await expect(client.queryOne("SELECT 1")).rejects.toThrow(/DATABASE_URL manquant/);

    process.env.DATABASE_URL = urlDesTests;
    await expect(client.queryOne<{ un: number }>("SELECT 1 AS un")).resolves.toEqual({ un: 1 });
  });

  it("ne met pas en cache l'échec de l'initialisation : une migration qui lève une fois, la requête suivante retente et réussit (une promesse rejetée mémorisée gardait toute l'application à terre jusqu'au redémarrage)", async () => {
    // Seule la première migration échoue : le reste est le vrai code, sur la vraie base de test.
    let appels = 0;
    vi.doMock("../src/lib/db/migrations", async (importOriginal) => {
      const reel = await importOriginal<typeof import("../src/lib/db/migrations")>();
      return {
        ...reel,
        appliquerMigrations: async (pool: Parameters<typeof reel.appliquerMigrations>[0]) => {
          appels++;
          if (appels === 1) throw new Error("base momentanément injoignable");
          return reel.appliquerMigrations(pool);
        },
      };
    });
    process.env.DATABASE_URL = urlDesTests;
    const client = await import("../src/lib/db/client");

    await expect(client.queryOne("SELECT 1")).rejects.toThrow(/momentanément injoignable/);
    await expect(client.queryOne<{ un: number }>("SELECT 1 AS un")).resolves.toEqual({ un: 1 });
    expect(appels).toBe(2);
  });
});
