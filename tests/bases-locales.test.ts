import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  baseDuWorker,
  commandesDesTests,
  estBaseDeTest,
  ligneEnvLocal,
  nomsDesBases,
  preparerEnvLocal,
  variablesLocales,
} from "../scripts/lib/bases-locales";

/*
 * La base locale du poste. Un jour, Docker était arrêté,
 * Postgres ne répondait plus sur le 5433 et le nom du conteneur n'était écrit
 * nulle part : la base locale était une connaissance du poste, pas du dépôt.
 * docker-compose.yml et scripts/bases-locales.ts la décrivent ; ce fichier
 * verrouille ce qui doit rester vrai pour un développeur qui clone.
 */

describe("noms des bases locales", () => {
  it("dérive <appli>_dev et <appli>_test du nom de package.json, tirets en soulignés (.env.example vise mon_appli_dev)", () => {
    expect(nomsDesBases("mon-appli")).toEqual({ dev: "mon_appli_dev", test: "mon_appli_test" });
  });

  it("ignore la portée npm et la casse du nom de paquet", () => {
    expect(nomsDesBases("@client/Suivi-Contrats")).toEqual({
      dev: "suivi_contrats_dev",
      test: "suivi_contrats_test",
    });
  });

  it("refuse un nom que Postgres tronquerait en silence (63 octets) : l'URL affichée viserait une base qui n'existe pas", () => {
    expect(() => nomsDesBases("a".repeat(59))).toThrow(/63/);
  });

  it("refuse un nom qui ne commence pas par une lettre", () => {
    expect(() => nomsDesBases("2026-appli")).toThrow(/lettre/);
  });

  it("donne à vérifier dans un .env.local existant la base _dev, jamais celle des tests (les tests y écrivent et y effacent : les données de dev n'y survivraient pas)", () => {
    const ligne = ligneEnvLocal(nomsDesBases("mon-appli"), 5433);
    expect(ligne).toBe("DATABASE_URL=postgresql://postgres@localhost:5433/mon_appli_dev");
  });
});

// ------------------------------------------------------------ commandes des tests

// Essai du 2026-11-13 dans GitHub Codespaces : sous Linux, le script affichait
// d'abord les commandes PowerShell, qu'un terminal bash ne comprend pas.
describe("commandes des tests affichées", () => {
  const url = "postgresql://postgres@localhost:5433/mon_appli_test";

  it("sous Windows, ne donne que celles de PowerShell", () => {
    const lignes = commandesDesTests(url, "win32").join("\n");
    expect(lignes).toContain(`$env:DATABASE_URL = '${url}'`);
    expect(lignes).not.toContain(`DATABASE_URL=${url} `);
    // Restées posées, un `npm run dev` lancé ensuite dans la même fenêtre
    // viserait la base des tests, que chaque lancement vide.
    expect(lignes).toContain("Remove-Item Env:DATABASE_URL, Env:PGSSLMODE");
  });

  it("sous Linux (Codespaces) et macOS, ne donne que celles de bash", () => {
    for (const plateforme of ["linux", "darwin"]) {
      const lignes = commandesDesTests(url, plateforme).join("\n");
      expect(lignes, plateforme).toContain(`DATABASE_URL=${url} PGSSLMODE=disable npm test`);
      expect(lignes, plateforme).not.toMatch(/\$env:|PowerShell/);
    }
  });
});

// ------------------------------------------------------------ .env.local

// Essai du 2026-11-13 au 2026-11-16 : préparer .env.local à la main (copier le
// modèle, coller DATABASE_URL, générer le secret de session, ajouter le
// premier admin que les consignes oubliaient) a été le geste le plus
// technique pour une personne non développeuse. --env-local le fait, tapé par
// elle : les gardes refusent à Claude d'écrire un .env*.
//
// Ce fichier part avec la base dans des applis qui n'ont pas les autres
// briques : ses modèles ne nomment aucune de leurs variables (l'assembleur
// les y chercherait), d'où des noms inventés, annotés comme dans
// .env.example.
describe("préparation de .env.local (--env-local)", () => {
  const dossiers: string[] = [];
  afterAll(() => {
    for (const dossier of dossiers) fs.rmSync(dossier, { recursive: true, force: true });
  });

  const BASE = [
    "# Modèle des variables.",
    "DATABASE_URL=postgresql://postgres@localhost:5433/mon_appli_dev",
    "PGSSLMODE=disable",
    "# VARIABLE_COMMENTEE=",
  ];
  const BRIQUE = [
    "# Bloc d'une brique qui attend un secret et un premier admin.",
    "# --env-local : valeur tirée au hasard",
    "SECRET_DE_BRIQUE=",
    "# --env-local : adresse donnée par --admin",
    "ADMIN_DE_BRIQUE=",
    "AUTRE_VARIABLE=",
  ];
  const AUTRE = ['EXPEDITEUR="Mon appli <ne-pas-repondre@exemple.fr>"'];
  const AVEC_ADMIN = [...BASE, ...BRIQUE, ...AUTRE, ""].join("\n");
  const SANS_ADMIN = [...BASE, ...AUTRE, ""].join("\n");

  function dossierAvec(modele: string | null, envLocal?: string): string {
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), "env-local-"));
    dossiers.push(dossier);
    if (modele !== null) fs.writeFileSync(path.join(dossier, ".env.example"), modele);
    if (envLocal !== undefined) fs.writeFileSync(path.join(dossier, ".env.local"), envLocal);
    return dossier;
  }
  const bases = nomsDesBases("suivi-contrats");
  const preparer = (dossier: string, adresseAdmin: string | null, plateforme = "linux") =>
    preparerEnvLocal({ dossier, bases, port: 5433, adresseAdmin, plateforme });
  const lire = (dossier: string) => fs.readFileSync(path.join(dossier, ".env.local"), "utf-8");
  const valeur = (texte: string, nom: string) => new RegExp(`^${nom}=(.*)$`, "m").exec(texte)?.[1];

  it("crée .env.local depuis .env.example, DATABASE_URL sur la base _dev locale, jamais celle des tests ni une base distante", () => {
    const dossier = dossierAvec(SANS_ADMIN);
    preparer(dossier, null);
    const env = lire(dossier);
    expect(valeur(env, "DATABASE_URL")).toBe("postgresql://postgres@localhost:5433/suivi_contrats_dev");
    expect(valeur(env, "PGSSLMODE")).toBe("disable");
    // Le reste du modèle est recopié tel quel, commentaires compris.
    expect(env).toContain("# VARIABLE_COMMENTEE=");
    expect(env).toContain('EXPEDITEUR="Mon appli <ne-pas-repondre@exemple.fr>"');
  });

  it("tire au hasard (32 caractères au moins) la variable annotée « valeur tirée au hasard » et pose l'adresse de --admin (le secret et le premier admin de la brique comptes)", () => {
    const premier = dossierAvec(AVEC_ADMIN);
    const second = dossierAvec(AVEC_ADMIN);
    const compteRendu = preparer(premier, "Admin@Exemple.fr").join("\n");
    preparer(second, "admin@exemple.fr");
    const secret = valeur(lire(premier), "SECRET_DE_BRIQUE") as string;
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(valeur(lire(second), "SECRET_DE_BRIQUE")).not.toBe(secret);
    expect(valeur(lire(premier), "ADMIN_DE_BRIQUE")).toBe("Admin@Exemple.fr");
    // Le secret ne s'affiche pas : la sortie du terminal peut se coller dans un ticket.
    expect(compteRendu).not.toContain(secret);
    expect(compteRendu).toContain("SECRET_DE_BRIQUE");
    // Une variable sans annotation reste vide, à remplir au besoin.
    expect(valeur(lire(premier), "AUTRE_VARIABLE")).toBe("");
  });

  it("quand une brique attend un premier admin, refuse sans son adresse et n'écrit rien (personne n'entrerait en local)", () => {
    const dossier = dossierAvec(AVEC_ADMIN);
    expect(() => preparer(dossier, null)).toThrow(/--admin=/);
    expect(fs.existsSync(path.join(dossier, ".env.local"))).toBe(false);
  });

  it("refuse une adresse de premier admin qui n'en est pas une, sans rien écrire", () => {
    for (const adresse of ["", "admin", "admin@", "@exemple.fr", "admin@exemple", "a b@exemple.fr"]) {
      const dossier = dossierAvec(AVEC_ADMIN);
      expect(() => preparer(dossier, adresse), adresse).toThrow(/adresse/i);
      expect(fs.existsSync(path.join(dossier, ".env.local")), adresse).toBe(false);
    }
  });

  it("refuse l'adresse d'exemple recopiée telle quelle depuis la consigne", () => {
    const dossier = dossierAvec(AVEC_ADMIN);
    expect(() => preparer(dossier, "votre.adresse@exemple.fr")).toThrow(/exemple/);
    expect(fs.existsSync(path.join(dossier, ".env.local"))).toBe(false);
  });

  it("sans brique qui attend un premier admin, n'exige pas d'adresse et dit que --admin ne sert pas", () => {
    const dossier = dossierAvec(SANS_ADMIN);
    const compteRendu = preparer(dossier, "admin@exemple.fr").join("\n");
    expect(lire(dossier)).not.toContain("admin@exemple.fr");
    expect(compteRendu).toMatch(/--admin ne sert pas/);
  });

  it("n'écrase jamais un .env.local existant et dit comment repartir du modèle, dans le shell du poste", () => {
    const existant = "DATABASE_URL=postgresql://postgres@localhost:5433/autre_dev\nSECRET_DE_BRIQUE=garde-le\n";
    const linux = dossierAvec(AVEC_ADMIN, existant);
    expect(() => preparer(linux, "admin@exemple.fr")).toThrow(/mv \.env\.local \.env\.local\.ancien/);
    expect(lire(linux)).toBe(existant);
    const windows = dossierAvec(AVEC_ADMIN, existant);
    expect(() => preparer(windows, "admin@exemple.fr", "win32")).toThrow(
      /Rename-Item \.env\.local \.env\.local\.ancien/
    );
    expect(lire(windows)).toBe(existant);
  });

  it("devant un .env.local existant, cite aussi les variables annotées à vérifier (le premier admin oublié à l'essai)", () => {
    const dossier = dossierAvec(AVEC_ADMIN, "DATABASE_URL=\n");
    expect(() => preparer(dossier, "admin@exemple.fr")).toThrow(/SECRET_DE_BRIQUE[\s\S]*ADMIN_DE_BRIQUE/);
  });

  it("ajoute une variable de la base que le modèle a perdue plutôt que de la dire posée sans l'écrire", () => {
    const dossier = dossierAvec(AVEC_ADMIN.replace("PGSSLMODE=disable\n", ""));
    preparer(dossier, "admin@exemple.fr");
    expect(valeur(lire(dossier), "PGSSLMODE")).toBe("disable");
  });

  it("refuse sans .env.example, lancé hors de la racine de l'appli", () => {
    const dossier = dossierAvec(null);
    expect(() => preparer(dossier, "admin@exemple.fr")).toThrow(/\.env\.example/);
    expect(fs.existsSync(path.join(dossier, ".env.local"))).toBe(false);
  });

  it("garde les fins de ligne du modèle (CRLF d'un poste Windows)", () => {
    const dossier = dossierAvec(AVEC_ADMIN.replace(/\n/g, "\r\n"));
    preparer(dossier, "admin@exemple.fr");
    const env = lire(dossier);
    expect(env).toContain("DATABASE_URL=postgresql://postgres@localhost:5433/suivi_contrats_dev\r\n");
    expect(env).toContain("ADMIN_DE_BRIQUE=admin@exemple.fr\r\n");
    expect(env.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("prépare le vrai .env.example de cette appli, chaque variable annotée remplie", () => {
    const modele = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    const dossier = dossierAvec(modele);
    preparer(dossier, "admin@exemple.fr");
    const env = lire(dossier);
    expect(valeur(env, "DATABASE_URL")).toBe("postgresql://postgres@localhost:5433/suivi_contrats_dev");
    for (const { nom, source } of variablesLocales(modele)) {
      if (source === "hasard") expect((valeur(env, nom) as string).length, nom).toBeGreaterThanOrEqual(32);
      else expect(valeur(env, nom), nom).toBe("admin@exemple.fr");
    }
  });

  it("lit les annotations de .env.example, pas les variables voisines ni une annotation éloignée de sa variable", () => {
    expect(variablesLocales(AVEC_ADMIN)).toEqual([
      { nom: "SECRET_DE_BRIQUE", source: "hasard" },
      { nom: "ADMIN_DE_BRIQUE", source: "admin" },
    ]);
    expect(variablesLocales("# --env-local : valeur tirée au hasard\n\nLOIN=\n")).toEqual([]);
    expect(variablesLocales(SANS_ADMIN)).toEqual([]);
  });
});

// ------------------------------------------------------------ base de test

// Les tests vident les tables : sur un projet précédent, un `npm test` lancé
// sur la base de dev a effacé le compte admin. L'hôte localhost ne suffit pas
// à le prévenir, la base de dev est locale elle aussi.
describe("nom d'une base de test", () => {
  it("accepte <appli>_test et <appli>_test_<n>, la base dédiée d'une session parallèle (appli_test de la CI, appli_test_121)", () => {
    expect(estBaseDeTest("appli_test")).toBe(true);
    expect(estBaseDeTest("appli_test_121")).toBe(true);
    expect(estBaseDeTest("catalogue_solstice_test")).toBe(true);
  });

  it("refuse une base de dev, une base sans suffixe et un nom où _test n'est pas à la fin (le compte admin effacé par un npm test sur la base de dev)", () => {
    for (const nom of [
      "sl_contrats_dev",
      "suivi_maintenance",
      "test_prod",
      "suivi_test_dev",
      "suivi_test_",
      "_test",
      "",
    ]) {
      expect(estBaseDeTest(nom), nom).toBe(false);
    }
  });

  it("accepte la base de test que crée scripts/bases-locales.ts et refuse sa base de dev", () => {
    const bases = nomsDesBases("@client/Suivi-Contrats");
    expect(estBaseDeTest(bases.test)).toBe(true);
    expect(estBaseDeTest(bases.dev)).toBe(false);
  });

  it("donne à chaque worker de vitest sa base, jamais celle d'une session parallèle (catalogue_test_3 est la base dédiée du ticket 3, que le worker 3 aurait vidée)", () => {
    expect(baseDuWorker("appli_test", 1)).toBe("appli_test_w1");
    expect(baseDuWorker("appli_test_121", 3)).toBe("appli_test_121_w3");
    for (const base of ["appli_test", "appli_test_121"]) {
      for (const numero of [1, 2, 3, 4, 12]) {
        expect(estBaseDeTest(baseDuWorker(base, numero)), `${base} ${numero}`).toBe(false);
      }
    }
  });

  it("refuse une base de worker que Postgres tronquerait (deux workers sur la même base) ou un numéro de worker absent", () => {
    expect(() => baseDuWorker(`${"a".repeat(57)}_test`, 1)).toThrow(/63/);
    expect(() => baseDuWorker("appli_test", Number(undefined))).toThrow(/VITEST_POOL_ID/);
    expect(() => baseDuWorker("appli_test", 0)).toThrow(/VITEST_POOL_ID/);
  });

  it("le worker en cours vise sa propre base, pas celle passée à npm test (les fichiers en parallèle se videraient la base)", () => {
    const base = decodeURIComponent(new URL(process.env.DATABASE_URL as string).pathname.slice(1));
    expect(base).toMatch(/_w\d+$/);
    expect(base).toBe(baseDuWorker(base.replace(/_w\d+$/, ""), Number(process.env.VITEST_POOL_ID)));
  });

  it("vitest.config.ts refuse de démarrer sur la base de dev locale, nomme la base lue et dit quoi taper", () => {
    const nomPaquet = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")).name;
    const bases = nomsDesBases(nomPaquet);
    // Aucune connexion n'est tentée : la configuration lève avant de chercher
    // le moindre fichier de test, que ce filtre ne trouverait de toute façon pas.
    const lancement = spawnSync(
      process.execPath,
      [path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs"), "run", "aucun-fichier-ne-porte-ce-nom"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
        env: { ...process.env, DATABASE_URL: `postgresql://postgres@localhost:5433/${bases.dev}` },
      }
    );
    const sortie = `${lancement.stdout}${lancement.stderr}`;
    expect(lancement.status).not.toBe(0);
    expect(sortie).toContain(`« ${bases.dev} »`);
    expect(sortie).toContain("npx tsx scripts/bases-locales.ts");
    expect(sortie).toContain(`localhost:5433/${bases.test}`);
  }, 30_000);
});

// ------------------------------------------------------------ docker-compose.yml

// Le compose ouvre Postgres en `trust`, sans mot de passe : acceptable parce
// que le port n'est publié que sur la boucle locale du poste. Publié sur toutes
// les interfaces (« 5433:5432 », le défaut de Docker), il ouvrirait une base
// sans mot de passe à tout le réseau du bureau ou du café. La règle :
// aucun mot de passe réel dans le compose, `trust` limité à localhost.
function defautsDuCompose(texte: string): string[] {
  const defauts: string[] = [];
  if (/POSTGRES_PASSWORD/.test(texte)) defauts.push("déclare un mot de passe");
  const lignes = texte.split(/\r?\n/);
  const debutPorts = lignes.findIndex((l) => /^\s*ports:\s*$/.test(l));
  if (debutPorts === -1) {
    defauts.push("ne publie aucun port");
    return defauts;
  }
  const indentation = lignes[debutPorts].search(/\S/);
  for (const ligne of lignes.slice(debutPorts + 1)) {
    if (ligne.trim() === "" || ligne.trim().startsWith("#")) continue;
    if (ligne.search(/\S/) <= indentation) break;
    const port = ligne
      .replace(/^\s*-\s*/, "")
      .replace(/["']/g, "")
      .trim();
    if (!port.startsWith("127.0.0.1:")) defauts.push(`publie « ${port} » hors de 127.0.0.1`);
  }
  return defauts;
}

describe("docker-compose.yml", () => {
  const compose = fs.readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf-8");

  it("ne publie Postgres que sur 127.0.0.1 et ne porte aucun mot de passe (trust limité au poste)", () => {
    expect(defautsDuCompose(compose)).toEqual([]);
  });

  it("le verrou attrape un port publié sur toutes les interfaces et un mot de passe", () => {
    const fautif = compose
      .replace("127.0.0.1:5433:5432", "5433:5432")
      .replace("POSTGRES_HOST_AUTH_METHOD: trust", "POSTGRES_PASSWORD: secret");
    // Un compose réécrit sans ces lignes rendrait ce test muet : le dire.
    expect(fautif.match(/5433:5432|POSTGRES_/g)).toEqual(["POSTGRES_", "5433:5432"]);
    expect(fautif).not.toContain("127.0.0.1:5433");
    expect(defautsDuCompose(fautif)).toEqual(["déclare un mot de passe", "publie « 5433:5432 » hors de 127.0.0.1"]);
  });

  it("garde les données dans un volume nommé, monté là où l'image 18 les écrit (un redémarrage ne les perd pas)", () => {
    expect(compose).toMatch(/image:\s*postgres:18\b/);
    expect(compose).toMatch(/-\s*donnees:\/var\/lib\/postgresql\s*$/m);
    expect(compose).toMatch(/^volumes:\s*\n\s+donnees:\s*\n\s+name:\s*solstice-postgres-donnees\s*$/m);
  });

  // Audit du 2026-11-09 : « postgres:18 » est une étiquette, que l'éditeur de
  // l'image déplace à chaque reconstruction ; le poste et la CI tiraient ce
  // qu'elle désignait ce jour-là. Épinglée par digest (celui de la liste de
  // manifestes, multi-plateforme), l'image ne change que par une PR relue.
  it("épingle l'image Postgres par digest, la même que la CI (une étiquette se déplace sans PR)", () => {
    const ci = fs.readFileSync(path.join(process.cwd(), ".github/workflows/ci.yml"), "utf-8");
    const image = imageEpinglee(compose.match(/^\s*image:\s*(\S+)/m)?.[1]);
    expect(image, "image du compose").not.toBeNull();
    expect(imageEpinglee(ci.match(/^\s*IMAGE:\s*(\S+)/m)?.[1]), "IMAGE de ci.yml").toBe(image);
    // Cas fautifs : une étiquette seule, un digest tronqué.
    expect(imageEpinglee("postgres:18")).toBeNull();
    expect(imageEpinglee(`postgres:18@sha256:${"a".repeat(63)}`)).toBeNull();
  });
});

// L'image si elle est épinglée par digest (postgres:<majeure>@sha256:<64 hex>), null sinon.
function imageEpinglee(image: string | undefined): string | null {
  return image !== undefined && /^postgres:\d+@sha256:[0-9a-f]{64}$/.test(image) ? image : null;
}
