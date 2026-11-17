import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACTION,
  brouillons,
  deposer,
  depotDuCatalogue,
  ErreurAPI,
  ErreurRetour,
  ETIQUETTE,
  fichierDeCI,
  LONGUEUR_MAX_DU_CORPS,
  LONGUEUR_MAX_DU_LIEN,
  MODELE,
} from "../outils/retour-catalogue.mjs";

/*
 * outils/retour-catalogue.mjs : les brouillons de tickets du catalogue, tirés
 * des adaptations d'une appli assemblée. Jusqu'ici, le retour dépendait de
 * quelqu'un qui pense à lancer l'outil des adaptations, à trier et à rédiger :
 * sur l'appli d'essai tours-de-coloc, trois défauts du catalogue ne sont
 * remontés qu'une fois vus à l'écran. Le brouillon est déposé dans le dépôt de
 * l'appli, jamais envoyé seul au catalogue, qui est public.
 */

// Un dépôt fictif : la fonction reçoit celui du catalogue de qui l'appelle, et
// le vrai nom ne s'écrit qu'à un seul endroit du dépôt.
const DEPOT = "exemple/catalogue";
const COMMIT = "0123456789abcdef0123456789abcdef01234567";

const NOTE_DEFAUT = {
  titre: "2026-11-05 · l'accueil livré vide",
  nature: "défaut du catalogue",
  texte: [
    "## 2026-11-05 · l'accueil livré vide",
    "- Fichiers : `src/app/page.tsx`, `docs/`",
    "- Ce qui change : l'accueil affiche les tours de la semaine ; les notes du catalogue sont retirées.",
    "- Pourquoi : l'accueil disait « Page d'accueil à écrire ».",
    "- Nature : défaut du catalogue",
  ].join("\n"),
};
const NOTE_PROPRE = {
  titre: "2026-11-06 · le menu",
  nature: "propre à l'appli",
  texte: "## 2026-11-06 · le menu\n- Fichiers : `src/lib/navigation.ts`\n- Nature : propre à l'appli",
};

const DIFF_ACCUEIL = [
  "--- catalogue/src/app/page.tsx",
  "+++ appli/src/app/page.tsx",
  "@@ -1,3 +1,3 @@",
  "-  <p>Page d'accueil à écrire</p>",
  "+  <TableauDesTours />",
  "",
].join("\n");

type Adaptation = {
  chemin: string;
  unite: string;
  etat: "retouché" | "supprimé";
  empreinte: string | null;
  origine: unknown;
  diff: string | null;
  note: typeof NOTE_DEFAUT | null;
};

// La forme que rend outils/adaptations.mjs (et son --json).
function resultatDe(liste: Adaptation[]) {
  return {
    appli: "/depot/appli",
    format: 2,
    commit: COMMIT.slice(0, 7),
    fichiers: 400,
    rejouer: false,
    avertissements: [],
    adaptations: liste,
  };
}

const accueil = (diff = DIFF_ACCUEIL, empreinte = "a".repeat(64)): Adaptation => ({
  chemin: "src/app/page.tsx",
  unite: "socle",
  etat: "retouché",
  empreinte,
  origine: { source: "appli", exacte: true },
  diff,
  note: NOTE_DEFAUT,
});
const docs: Adaptation = {
  chemin: "docs/cicatrices.md",
  unite: "socle",
  etat: "supprimé",
  empreinte: null,
  origine: null,
  diff: null,
  note: NOTE_DEFAUT,
};
const navigation: Adaptation = {
  chemin: "src/lib/navigation.ts",
  unite: "socle",
  etat: "retouché",
  empreinte: "c".repeat(64),
  origine: { source: "appli", exacte: true },
  diff: "--- catalogue/src/lib/navigation.ts\n+++ appli/src/lib/navigation.ts\n+// menu\n",
  note: NOTE_PROPRE,
};
const sansNote: Adaptation = { ...navigation, chemin: "src/lib/format.ts", note: null };

// Le corps prérempli du ticket du catalogue, tiré du lien.
function parametresDuLien(url: string) {
  const lien = new URL(url);
  return {
    origine: `${lien.origin}${lien.pathname}`,
    modele: lien.searchParams.get("template"),
    titre: lien.searchParams.get("title") ?? "",
    corps: lien.searchParams.get("body") ?? "",
  };
}

const titresDe = (markdown: string) =>
  markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((ligne) => ligne.startsWith("## "));

describe("outils/retour-catalogue.mjs", () => {
  it("donne un brouillon par note « défaut du catalogue », avec tous les fichiers qu'elle couvre, et aucun pour une note propre à l'appli ou une retouche sans note", () => {
    const sansNature = {
      ...navigation,
      chemin: "src/lib/date-iso.ts",
      note: { ...NOTE_DEFAUT, texte: "## autre", nature: null },
    } as unknown as Adaptation;
    const resultat = resultatDe([docs, accueil(), navigation, sansNote, sansNature]);

    const rendus = brouillons(resultat, { depot: DEPOT });

    expect(rendus).toHaveLength(1);
    const [brouillon] = rendus;
    expect(brouillon.titre).toBe("Pour le catalogue : 2026-11-05 · l'accueil livré vide");
    expect(brouillon.fichiers).toEqual(["docs/cicatrices.md", "src/app/page.tsx"]);
    expect(brouillon.corps).toContain("`src/app/page.tsx` (socle) : retouché");
    expect(brouillon.corps).toContain("`docs/cicatrices.md` (socle) : supprimé");
    expect(brouillon.corps).toContain("+  <TableauDesTours />");
    expect(brouillon.corps).toContain("Page d'accueil à écrire");
    expect(brouillon.corps).not.toContain("navigation.ts");
    expect(brouillon.corps).not.toContain("date-iso.ts");
  });

  it("dit dans le brouillon pourquoi l'envoyer et que le catalogue est public, avec le lien qui ouvre le ticket", () => {
    const [brouillon] = brouillons(resultatDe([accueil()]), { depot: DEPOT });

    expect(brouillon.corps).toMatch(/n'est plus à (re)?porter à chaque mise à jour/);
    expect(brouillon.corps).toMatch(/catalogue est public/);
    expect(brouillon.corps).toMatch(/client/);
    expect(brouillon.corps).toContain(brouillon.lien.url);
    expect(brouillon.lien.url.startsWith(`https://github.com/${DEPOT}/issues/new?`)).toBe(true);
  });

  it("ne rend pas un brouillon déjà déposé, ouvert ou fermé : le marqueur tient à la note et aux fichiers, pas à l'origine du diff", () => {
    const resultat = resultatDe([docs, accueil()]);
    const [premier] = brouillons(resultat, { depot: DEPOT });
    expect(premier.corps).toContain(`<!-- ${premier.marqueur} -->`);
    expect(premier.marqueur).toMatch(/^retour-catalogue:[0-9a-f]{16}$/);

    // Déjà déposé, puis retouché à la main : rien. L'ordre de la liste, les
    // avertissements et le commit n'y changent rien.
    const deposes = [`texte retouché à la main\n${premier.corps}`];
    expect(brouillons(resultat, { depot: DEPOT, existants: deposes })).toEqual([]);
    const autre = {
      ...resultatDe([accueil(), docs]),
      avertissements: ["L'arbre a des modifications."],
      commit: "fedcba9",
    };
    expect(brouillons(autre, { depot: DEPOT, existants: deposes })).toEqual([]);
    // Le même fichier, dont l'origine est retrouvée autrement (rejeu qui échoue,
    // diff approché plus long) : même marqueur, pas de doublon.
    const approche = {
      ...accueil(`${DIFF_ACCUEIL}-// une ligne retirée par l'assembleur\n`),
      origine: { source: "catalogue", exacte: false },
    };
    expect(brouillons(resultatDe([docs, approche]), { depot: DEPOT, existants: deposes })).toEqual([]);
    // Le marqueur cité seul, sans ses délimiteurs de commentaire, ne compte pas.
    expect(brouillons(resultat, { depot: DEPOT, existants: [premier.marqueur] })).toHaveLength(1);

    // La retouche reprise depuis (autre contenu), ou la note réécrite : une nouvelle chose à juger.
    const reprise = resultatDe([docs, accueil(DIFF_ACCUEIL, "b".repeat(64))]);
    expect(brouillons(reprise, { depot: DEPOT, existants: deposes })).toHaveLength(1);
    const reecrite = { ...NOTE_DEFAUT, texte: `${NOTE_DEFAUT.texte} Précisé.` };
    const notees = [docs, accueil()].map((adaptation) => ({ ...adaptation, note: reecrite }));
    expect(brouillons(resultatDe(notees), { depot: DEPOT, existants: deposes })).toHaveLength(1);
  });

  it("dit d'un diff approché qu'il mêle les retouches de l'assembleur, dans le brouillon comme dans le lien", () => {
    const approche = { ...accueil(), origine: { source: "catalogue", exacte: false } };
    const [brouillon] = brouillons(resultatDe([approche]), { depot: DEPOT });
    expect(brouillon.corps).toMatch(/`src\/app\/page\.tsx` : diff approché/);
    expect(parametresDuLien(brouillon.lien.url).corps).toMatch(/diff approché/);
    const [exact] = brouillons(resultatDe([accueil()]), { depot: DEPOT });
    expect(exact.corps).not.toMatch(/approché/);
  });

  it("préremplit le ticket du catalogue au format de son modèle, diff compris quand il tient", () => {
    const [brouillon] = brouillons(resultatDe([docs, accueil()]), { depot: DEPOT });
    const { origine, modele, titre, corps } = parametresDuLien(brouillon.lien.url);

    expect(origine).toBe(`https://github.com/${DEPOT}/issues/new`);
    expect(modele).toBe(MODELE);
    expect(titre).toBe("Retour d'une appli assemblée : 2026-11-05 · l'accueil livré vide");
    expect(brouillon.lien.diffInclus).toBe(true);
    expect(corps).toContain("+  <TableauDesTours />");
    expect(corps).toContain("Page d'accueil à écrire");
    expect(corps).toContain("`docs/cicatrices.md` (socle) : supprimé");
    expect(corps).toContain(COMMIT.slice(0, 7));
    // Rien de l'appli au-delà de la note, des fichiers et des diffs : ni son dossier, ni le marqueur.
    expect(corps).not.toContain("/depot/appli");
    expect(corps).not.toContain(brouillon.marqueur);

    // Les titres du corps prérempli sont ceux du modèle, dans le même ordre : le lien remplit le modèle.
    const fichierDuModele = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", MODELE);
    const titresDuModele = titresDe(fs.readFileSync(fichierDuModele, "utf-8"));
    expect(titresDuModele.length).toBeGreaterThan(2);
    expect(titresDe(corps)).toEqual(titresDuModele);
  });

  it("garde le lien sous la limite d'une URL : sans le diff, à coller depuis le brouillon, s'il ne tient pas", () => {
    const long = `${DIFF_ACCUEIL}${"+ une ligne de diff qui ne tiendra pas dans l'URL é\n".repeat(400)}`;
    const [brouillon] = brouillons(resultatDe([accueil(long)]), { depot: DEPOT });
    const { corps } = parametresDuLien(brouillon.lien.url);

    expect(brouillon.lien.url.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_LIEN);
    expect(brouillon.lien.diffInclus).toBe(false);
    expect(corps).not.toContain("+ une ligne de diff");
    expect(corps).toMatch(/[Cc]oller ici le diff/);
    expect(corps).toContain("Page d'accueil à écrire");
    expect(corps).toContain("`src/app/page.tsx` (socle) : retouché");
    // Le brouillon de l'appli, lui, a tout le diff, et dit que le lien ne le porte pas.
    expect(brouillon.corps).toContain("+ une ligne de diff");
    expect(brouillon.corps).toMatch(/lien ne porte pas le diff/);
  });

  it("tronque en le disant une note trop longue pour le lien, qui reste sous la limite", () => {
    const bavarde = { ...NOTE_DEFAUT, texte: `${NOTE_DEFAUT.texte}\n${"Une note très longue, é. ".repeat(800)}` };
    const [brouillon] = brouillons(resultatDe([{ ...accueil(), note: bavarde }]), { depot: DEPOT });
    const { corps } = parametresDuLien(brouillon.lien.url);

    expect(brouillon.lien.url.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_LIEN);
    expect(corps).toMatch(/[Nn]ote tronquée/);
    expect(corps).toContain("- Fichiers : `src/app/page.tsx`");
    expect(titresDe(corps)).toEqual(
      titresDe(parametresDuLien(brouillons(resultatDe([accueil()]), { depot: DEPOT })[0].lien.url).corps)
    );
  });

  it("garde le corps du brouillon sous la limite de GitHub, en coupant le diff en le disant", () => {
    const enorme = `${DIFF_ACCUEIL}${"+ ligne\n".repeat(20_000)}`;
    const [brouillon] = brouillons(resultatDe([accueil(enorme)]), { depot: DEPOT });

    expect(brouillon.corps.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_CORPS);
    expect(brouillon.corps).toMatch(/[Dd]iff coupé/);
    expect(brouillon.corps).toContain(`<!-- ${brouillon.marqueur} -->`);
  });

  // Un diff de Markdown peut contenir une clôture de bloc de code : le bloc du
  // brouillon ne doit pas se refermer au milieu.
  it("entoure chaque diff d'une clôture plus longue que toute suite d'accents graves qu'il contient", () => {
    const diffDeMarkdown = "--- catalogue/README.md\n+++ appli/README.md\n+```bash\n+npm test\n+```\n";
    const [brouillon] = brouillons(resultatDe([{ ...accueil(diffDeMarkdown), chemin: "README.md" }]), {
      depot: DEPOT,
    });
    expect(brouillon.corps).toContain("````diff\n--- catalogue/README.md");
    expect(parametresDuLien(brouillon.lien.url).corps).toContain("````diff\n--- catalogue/README.md");
  });

  it("coupe les diffs de plusieurs fichiers sous la limite du corps, chaque bloc refermé et la coupe dite hors des blocs", () => {
    const fichiers = Array.from({ length: 6 }, (_, rang) => ({
      ...accueil(
        `--- catalogue/f${rang}.ts\n+++ appli/f${rang}.ts\n${"+ ligne ```\n".repeat(1500)}`,
        String(rang).repeat(64)
      ),
      chemin: `src/lib/f${rang}.ts`,
    }));
    const [brouillon] = brouillons(resultatDe(fichiers), { depot: DEPOT });

    expect(brouillon.corps.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_CORPS);
    const clotures = brouillon.corps.split("\n").filter((ligne) => /^`{4,}/.test(ligne));
    // Chaque bloc ouvert est refermé : des paires ouverture puis fermeture.
    expect(clotures.length).toBeGreaterThan(2);
    expect(clotures.length % 2).toBe(0);
    for (let rang = 0; rang < clotures.length; rang += 2) {
      expect(clotures[rang]).toBe("````diff");
      expect(clotures[rang + 1]).toBe("````");
    }
    // La mention de la coupe vient après la dernière clôture, hors de tout bloc.
    expect(brouillon.corps.lastIndexOf("Diff coupé")).toBeGreaterThan(brouillon.corps.lastIndexOf("\n````"));
  });

  it("garde le lien sous la limite même pour une note qui couvre des centaines de fichiers, en renvoyant au brouillon pour les autres", () => {
    const fichiers = Array.from({ length: 300 }, (_, rang) => ({
      ...docs,
      chemin: `src/app/un-dossier-au-nom-assez-long/sous-dossier-${rang}/page-retiree.tsx`,
    }));
    const [brouillon] = brouillons(resultatDe(fichiers), { depot: DEPOT });

    expect(brouillon.lien.url.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_LIEN);
    expect(brouillon.lien.corpsInclus).toBe(true);
    expect(parametresDuLien(brouillon.lien.url).corps).toMatch(/autres, à recopier depuis le brouillon/);
    expect(brouillon.corps.length).toBeLessThanOrEqual(LONGUEUR_MAX_DU_CORPS);
    expect(brouillon.corps).toMatch(/autres, couverts par la même note/);
  });

  // Le registre des cicatrices est copié dans chaque appli : une leçon qu'elle
  // y ajoute remonte par ce circuit, et faire circuler les leçons est le but du catalogue.
  it("présente une retouche du registre des cicatrices comme une leçon proposée, pas comme un défaut de code", () => {
    const lecon = {
      ...accueil("--- catalogue/docs/cicatrices.md\n+++ appli/docs/cicatrices.md\n+| Une règle | Un cas |\n"),
      chemin: "docs/cicatrices.md",
    };
    const [brouillon] = brouillons(resultatDe([lecon]), { depot: DEPOT });
    const { corps } = parametresDuLien(brouillon.lien.url);

    expect(brouillon.corps).toMatch(/leçon proposée au registre du catalogue, pas un défaut de son code/);
    expect(brouillon.corps).toContain("`docs/cicatrices.md` (socle) : retouché (leçon proposée au registre)");
    expect(corps).toMatch(/## Leçon à inscrire au registre\n\nProposée par l'appli/);

    // Sans retouche du registre, le ticket demande la leçon à qui l'envoie.
    const [defaut] = brouillons(resultatDe([accueil()]), { depot: DEPOT });
    expect(parametresDuLien(defaut.lien.url).corps).toMatch(/## Leçon à inscrire au registre\n\nÀ écrire/);
    expect(defaut.corps).not.toMatch(/Leçon proposée/);
  });

  it("refuse un dépôt du catalogue qui n'est pas de la forme propriétaire/nom", () => {
    for (const depot of ["", "catalogue", "https://github.com/a/b", "a/b/c", "a/b?x=1"]) {
      expect(() => brouillons(resultatDe([accueil()]), { depot })).toThrow(ErreurRetour);
    }
  });
});

// ---------------------------------------------------------------- la CI de l'appli

const SHA_DE_TEST = "fedcba9876543210fedcba9876543210fedcba98";
const CHECKOUT = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1";

describe("le fichier de CI du retour au catalogue, livré à l'appli", () => {
  const fichier = fichierDeCI({ depot: DEPOT, commit: SHA_DE_TEST, checkout: CHECKOUT });

  it("appelle l'action du catalogue épinglée au commit de l'assemblage, et lui donne le même dépôt pour ses liens", () => {
    expect(fichier).toContain(`      - uses: ${DEPOT}/${ACTION}@${SHA_DE_TEST}\n`);
    expect(fichier).toContain(`          catalogue: ${DEPOT}\n`);
    expect(fichier).toContain(`      - uses: ${CHECKOUT}\n`);
    // Une étiquette ou une branche se déplace sans relecture chez l'appli : un SHA complet seul.
    for (const commit of ["main", "v1", "abc1234", `${SHA_DE_TEST}0`]) {
      expect(() => fichierDeCI({ depot: DEPOT, commit, checkout: CHECKOUT })).toThrow(ErreurRetour);
    }
  });

  it("n'a que les droits de lire le dépôt et d'écrire les issues, aucun secret, et ne tourne jamais sur une pull request ni un ticket", () => {
    expect(fichier).toMatch(/\npermissions:\n {2}contents: read\n {2}issues: write\n\n/);
    expect(fichier.match(/^ *[a-z-]+: (read|write)$/gm)).toEqual(["  contents: read", "  issues: write"]);
    expect(fichier).not.toMatch(/secrets\./);
    expect(fichier).toMatch(/\non:\n {2}push:\n {4}branches: \[main\]\n {2}workflow_dispatch:\n/);
    expect(fichier).not.toMatch(/pull_request|issues:\n|issue_comment|workflow_run/);
    // Aucune expression évaluée par GitHub : rien du dépôt ne peut s'injecter dans une commande.
    expect(fichier).not.toContain("${{");
    expect(fichier).toMatch(/persist-credentials: false/);
    expect(fichier).toMatch(/fetch-depth: 0/);
    expect(fichier).toMatch(/\nconcurrency:\n {2}group: [\w-]+\n {2}cancel-in-progress: false\n/);
  });

  // L'appli n'a pas outils/ : le verrou des renvois (tests/aide-assemblage.ts)
  // refuse qu'un fichier qu'elle reçoit le cite. Elle cite une action publique.
  it("ne cite aucun chemin d'outils/, que l'appli n'a pas", () => {
    expect(fichier).not.toMatch(/(?<![\w./-])(?:\.{1,2}\/)*outils\/[\w./-]*/i);
  });

  it("lit le dépôt du catalogue dans le champ repository de son package.json, seule source de son nom", () => {
    expect(depotDuCatalogue({ repository: { type: "git", url: "git+https://github.com/a-b/c.d.git" } })).toBe(
      "a-b/c.d"
    );
    expect(depotDuCatalogue({ repository: "https://github.com/a/b" })).toBe("a/b");
    expect(depotDuCatalogue({ repository: "git@github.com:a/b.git" })).toBe("a/b");
    for (const paquet of [{}, { repository: "https://gitlab.com/a/b" }, { repository: { url: "" } }]) {
      expect(() => depotDuCatalogue(paquet)).toThrow(ErreurRetour);
    }
    const paquet = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
    expect(depotDuCatalogue(paquet)).toMatch(/^[\w-]+\/[\w.-]+$/);
  });

  it("vise une action du catalogue qui existe, lance l'outil par l'environnement et reçoit le dépôt du catalogue", () => {
    const action = fs.readFileSync(path.join(process.cwd(), ACTION, "action.yml"), "utf-8").replace(/\r\n/g, "\n");
    expect(action).toMatch(/\n {2}using: composite\n/);
    expect(action).toMatch(/\n {2}catalogue:\n/);
    const run = action.slice(action.indexOf("run:"));
    // L'outil lancé existe à ce chemin depuis le dossier de l'action, téléchargé avec tout le dépôt.
    const [, relatif] = /"\$GITHUB_ACTION_PATH\/([^"]+)"/.exec(run) ?? [];
    expect(path.normalize(path.join(ACTION, relatif ?? ""))).toBe(path.normalize("outils/retour-catalogue.mjs"));
    expect(run).not.toContain("${{");
  });
});

describe("le dépôt des brouillons dans les issues de l'appli", () => {
  const resultat = resultatDe([docs, accueil()]);
  type Issue = { titre: string; corps: string; etiquettes: string[] };

  // L'API de GitHub, simulée : la seule frontière.
  function apiFactice(existants: string[] = [], refus?: { etape: string; statut: number }) {
    const appels: string[] = [];
    const crees: Issue[] = [];
    const echec = (etape: string) => {
      if (refus?.etape === etape) throw new ErreurAPI(`refusé (${refus.statut})`, refus.statut);
    };
    return {
      appels,
      crees,
      api: {
        async corpsDesIssues(etiquette: string) {
          appels.push(`lister ${etiquette}`);
          echec("lister");
          return existants;
        },
        async creerLEtiquette(etiquette: string) {
          appels.push(`etiquette ${etiquette}`);
          echec("etiquette");
        },
        async creerLIssue(issue: Issue) {
          appels.push(`creer ${issue.titre}`);
          echec("creer");
          crees.push(issue);
        },
      },
    };
  }

  it("crée les brouillons nouveaux sous l'étiquette pour-le-catalogue, et rien au passage suivant", async () => {
    const premier = apiFactice();
    const rendu = await deposer({ resultat, depot: DEPOT, api: premier.api });
    expect(rendu.avertissements).toEqual([]);
    expect(premier.crees.map(({ titre, etiquettes }) => [titre, etiquettes])).toEqual([
      ["Pour le catalogue : 2026-11-05 · l'accueil livré vide", [ETIQUETTE]],
    ]);
    expect(premier.appels[0]).toBe(`lister ${ETIQUETTE}`);

    const second = apiFactice(premier.crees.map(({ corps }) => corps));
    expect((await deposer({ resultat, depot: DEPOT, api: second.api })).crees).toEqual([]);
    expect(second.crees).toEqual([]);
    // Rien à créer : l'étiquette n'est pas touchée.
    expect(second.appels).toEqual([`lister ${ETIQUETTE}`]);
  });

  it("ne casse rien quand les issues sont fermées au dépôt ou refusées au jeton : il le dit et s'arrête", async () => {
    for (const refus of [
      { etape: "lister", statut: 410 },
      { etape: "lister", statut: 404 },
      { etape: "etiquette", statut: 403 },
      { etape: "creer", statut: 403 },
    ]) {
      const { api, crees } = apiFactice([], refus);
      const rendu = await deposer({ resultat, depot: DEPOT, api });
      expect(crees).toEqual([]);
      expect(rendu.avertissements.join("\n")).toMatch(/issues/);
    }
  });

  it("dit sans échouer qu'un dossier n'est pas une appli assemblée (le catalogue lui-même, une appli sans manifeste)", () => {
    const sortie = spawnSync(
      process.execPath,
      [path.join(process.cwd(), "outils", "retour-catalogue.mjs"), process.cwd(), "--depot", DEPOT],
      { encoding: "utf-8", env: { ...process.env, GITHUB_TOKEN: "", GITHUB_REPOSITORY: "" } }
    );
    expect(sortie.stderr).toBe("");
    expect(sortie.status).toBe(0);
    expect(sortie.stdout).toMatch(/^::notice::.*rien à déposer/m);
  });
});
