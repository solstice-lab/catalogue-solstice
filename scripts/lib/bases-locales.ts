/*
 * Les règles de scripts/bases-locales.ts, à part pour que les tests les
 * appellent sans Docker (tests/bases-locales.test.ts). vitest.config.ts s'en
 * sert aussi : le nom de base qu'il exige est celui que le script crée.
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type BasesLocales = { dev: string; test: string };

// Postgres tronque un identifiant au-delà de 63 octets, sans erreur : la base
// créée ne porterait pas le nom de l'URL affichée.
const LONGUEUR_MAX = 63;

// Le nom de l'appli est celui de package.json, que l'assembleur pose d'après
// la blueprint de l'appli (ou --nom) : « mon-appli » donne mon_appli_dev, la base que vise
// .env.example. Une portée npm (@client/…) ne fait pas partie du nom.
export function nomsDesBases(nomPaquet: string): BasesLocales {
  const appli = nomPaquet
    .replace(/^@[^/]+\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  if (!/^[a-z]/.test(appli)) {
    throw new Error(`Nom d'appli « ${nomPaquet} » : il doit commencer par une lettre (champ name de package.json).`);
  }
  const bases = { dev: `${appli}_dev`, test: `${appli}_test` };
  if (bases.test.length > LONGUEUR_MAX) {
    throw new Error(
      `Nom d'appli « ${nomPaquet} » trop long : « ${bases.test} » dépasse les ${LONGUEUR_MAX} caractères que Postgres garde. ` +
        "Raccourcir le champ name de package.json."
    );
  }
  return bases;
}

// Les tests vident les tables : sur un projet précédent, un `npm test` lancé
// sur la base de dev, locale elle aussi, a effacé le compte admin.
// Passent <appli>_test, que crée le script, et <appli>_test_<n>, la base
// dédiée d'une session de travail parallèle.
export function estBaseDeTest(nom: string): boolean {
  return /^.+_test(_\d+)?$/.test(nom);
}

// La base d'un worker de vitest, dérivée de la base de test passée par
// DATABASE_URL : les fichiers de test tournent en parallèle, chacun vide la
// base qu'il vise, donc chaque worker a la sienne (tests/bases-des-workers.ts).
// Le suffixe _w<n> ne finit jamais par _test ni _test_<n> : aucune session ne
// choisira ce nom pour sa base dédiée. « <appli>_test_<n> » aurait donné à
// un worker la base de la session du ticket n, vidée sous ses pieds.
export function baseDuWorker(base: string, numero: number): string {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new Error(`Numéro de worker « ${numero} » : un entier à partir de 1 était attendu (VITEST_POOL_ID).`);
  }
  const nom = `${base}_w${numero}`;
  if (nom.length > LONGUEUR_MAX) {
    throw new Error(
      `Base de test « ${base} » trop longue : « ${nom} » dépasse les ${LONGUEUR_MAX} caractères que Postgres garde. ` +
        "Raccourcir le nom de la base de test."
    );
  }
  return nom;
}

// La ligne à coller dans .env.local : la base _dev, jamais celle des tests.
// Sans mot de passe : le Postgres du compose est en trust, publié sur
// 127.0.0.1 seulement.
export function ligneEnvLocal(bases: BasesLocales, port: number): string {
  return `DATABASE_URL=${urlLocale(bases.dev, port)}`;
}

export function urlLocale(base: string, port: number): string {
  return `postgresql://postgres@localhost:${port}/${base}`;
}

// Les commandes des tests, dans le shell du poste seulement : à l'essai dans
// GitHub Codespaces (Linux), le script affichait d'abord celles de PowerShell,
// qu'un terminal bash ne comprend pas. `plateforme` : process.platform.
export function commandesDesTests(urlTest: string, plateforme: string): string[] {
  if (plateforme === "win32") {
    return ["Tests (PowerShell) :", "", `$env:DATABASE_URL = '${urlTest}'`, "$env:PGSSLMODE = 'disable'", "npm test"];
  }
  return ["Tests :", "", `DATABASE_URL=${urlTest} PGSSLMODE=disable npm test`];
}

// Une adresse plausible, sans plus : la brique comptes la compare ensuite,
// en minuscules, à celle qui se connecte. Une faute de frappe (« admin@ »)
// laisserait la personne à la porte de son appli sans qu'elle comprenne.
const ADRESSE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// La brique comptes se reconnaît à la ligne AUTH_SECRET de .env.example, que
// l'assembleur retire avec elle : le modèle dit ce que l'appli a gardé.
export function modeleAvecComptes(modele: string): boolean {
  return /^AUTH_SECRET=/m.test(modele);
}

export type OptionsEnvLocal = {
  dossier: string;
  bases: BasesLocales;
  port: number;
  adresseAdmin: string | null;
  plateforme: string;
};

/*
 * --env-local de scripts/bases-locales.ts : crée .env.local depuis
 * .env.example, avec les seules valeurs du travail local. Essai du 2026-11-13
 * au 2026-11-16 : le préparer à la main (copier le modèle, coller DATABASE_URL,
 * générer AUTH_SECRET, ajouter COMPTES_PREMIER_ADMIN, que les consignes
 * oubliaient) a été le geste le plus technique pour une personne non
 * développeuse.
 *
 * C'est la personne qui le tape : les gardes de Claude refusent d'écrire un
 * .env*, et refusent --env-local pour la même raison (.claude/hooks/gardes.mjs).
 *
 * N'écrase jamais un .env.local existant : il peut porter des valeurs que rien
 * ne sait refaire (une clé de test, un secret Google). Lève une Error, sans rien écrire, si une condition manque ; renvoie
 * sinon le compte rendu, sans le secret.
 */
export function preparerEnvLocal(options: OptionsEnvLocal): string[] {
  const { dossier, bases, port, adresseAdmin, plateforme } = options;
  const cheminModele = path.join(dossier, ".env.example");
  const cheminLocal = path.join(dossier, ".env.local");

  if (fs.existsSync(cheminLocal)) {
    const renommer =
      plateforme === "win32" ? "Rename-Item .env.local .env.local.ancien" : "mv .env.local .env.local.ancien";
    throw new Error(
      [
        ".env.local existe déjà : laissé tel quel, il n'est jamais écrasé.",
        `Pour repartir du modèle, le renommer (${renommer}), relancer cette commande, puis reprendre`,
        "dans .env.local les valeurs de .env.local.ancien qu'il faut garder.",
        `Sinon, y vérifier la ligne ${ligneEnvLocal(bases, port)}`,
      ].join("\n")
    );
  }
  if (!fs.existsSync(cheminModele)) {
    throw new Error(".env.example introuvable : lancer cette commande depuis la racine de l'appli.");
  }

  const modele = fs.readFileSync(cheminModele, "utf-8");
  const avecComptes = modeleAvecComptes(modele);
  if (avecComptes) {
    if (adresseAdmin === null) {
      throw new Error(
        "L'appli a la brique comptes : sans premier admin, personne n'entre en local. " +
          "Relancer avec son adresse : --admin=votre.adresse@exemple.fr"
      );
    }
    if (!ADRESSE.test(adresseAdmin)) {
      throw new Error(`« ${adresseAdmin} » n'est pas une adresse e-mail : --admin=votre.adresse@exemple.fr`);
    }
  }

  const valeurs: [string, string][] = [
    ["DATABASE_URL", urlLocale(bases.dev, port)],
    ["PGSSLMODE", "disable"],
  ];
  if (avecComptes) {
    valeurs.push(["AUTH_SECRET", randomBytes(32).toString("base64url")]);
    valeurs.push(["COMPTES_PREMIER_ADMIN", adresseAdmin as string]);
  }
  let contenu = modele;
  for (const [nom, valeur] of valeurs) {
    // `.` s'arrête avant le \r d'un modèle en CRLF : la fin de ligne reste.
    // Une fonction de remplacement : un « $ » de la valeur resterait littéral.
    contenu = contenu.replace(new RegExp(`^${nom}=.*$`, "m"), () => `${nom}=${valeur}`);
  }
  // « wx » : jamais d'écrasement, même si le fichier est apparu entre-temps.
  fs.writeFileSync(cheminLocal, contenu, { encoding: "utf-8", flag: "wx" });

  return [
    ".env.local : créé depuis .env.example (fichier ignoré par git).",
    `  DATABASE_URL vise ${bases.dev}, la base de développement locale.`,
    ...(avecComptes
      ? [
          "  AUTH_SECRET : tiré au hasard, propre à ce poste (non affiché).",
          `  COMPTES_PREMIER_ADMIN : ${adresseAdmin}, qui entre en admin à sa première connexion.`,
        ]
      : adresseAdmin !== null
        ? ["  Appli sans la brique comptes : --admin ne sert pas, ignoré."]
        : []),
    "Valeurs locales seulement : chez l'hébergeur, les variables se déclarent chez lui.",
  ];
}
