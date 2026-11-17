import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Test-verrou des renvois de docs/cicatrices.md. Cas d'origine : l'audit du
 * 2026-11-09 a trouvé une vingtaine de renvois par numéro de ligne tombés sur
 * une ligne vide ou une accolade ; le 2026-11-17, sept PR sur neuf ont dû
 * recaler ces numéros à la main (chaque ajout dans un fichier cité décale tous
 * les renvois situés plus bas), et un renvoi décalé de huit lignes tombait sur
 * une ligne non vide : le verrou restait vert, la leçon pointait sur le mauvais
 * cas. Un renvoi nomme donc ce qu'il vise, et ce verrou vérifie que cela existe
 * encore. Une cible renommée ou retirée fait échouer le test, en nommant la
 * leçon : elle n'est plus tenue, c'est le but.
 *
 * Deux écritures, dans la colonne « Tenue par » seulement, après le fichier :
 * - fichier de test de `tests/` (`*.test.ts`) : « un fragment de l'intitulé »,
 *   que contient UN SEUL `it(`, `test(` ou `describe(` du fichier. Un fragment
 *   et non l'intitulé entier : beaucoup d'intitulés portent le cas d'origine en
 *   parenthèse. Il doit pourtant rester unique : s'il l'est moins, le test le dit ;
 * - tout autre fichier (skill, agent, `CLAUDE.md`, README, code, configuration,
 *   `.claude/hooks/gardes.test.mjs`, qui n'a pas d'intitulés) : « une expression
 *   exacte » du fichier, sur une seule ligne, qui n'y figure qu'une fois. Un
 *   symbole s'écrit avec sa déclaration (`function fermeeAuxMoteurs`), qui est
 *   unique, plutôt que seul.
 *
 * Plusieurs cibles d'un même fichier : `fichier` « a » ; « b ». Une skill ou
 * un agent nommé avant l'expression (`solstice-ui` (« a »)) vaut son SKILL.md ;
 * `socle.md` ou un autre fichier de la skill, nommé sans chemin, vaut celui de
 * la skill. Les anciens renvois `fichier:ligne` sont refusés. Un fichier cité
 * sans expression ne vérifie rien de plus que son existence : le test la
 * contrôle quand même (les chemins entre accents graves de la colonne ; ni les
 * motifs comme `middleware.*`, ni les dossiers, ni un chemin écrit dans une
 * expression « … », qui n'est pas lu comme un renvoi).
 *
 * Un fragment se lit sans ouvrir le fichier : il commence au verbe ou au nom qui
 * porte la règle et finit sur un mot plein, jamais sur « de », « le » ou « par ».
 * Il ne contient pas d'astérisques de mise en forme (`**`), qui s'afficheraient
 * tels quels dans le tableau rendu.
 *
 * Ce que le test ne dit pas : que la cible est LA bonne pour la règle. Cela
 * reste une relecture (agent relecteur-docs), mais une cible nommée se relit
 * d'un coup d'œil, sans compter des lignes.
 *
 * Ce test n'est pas copié dans une appli assemblée (outils/modules.mjs le
 * retire) : ses renvois visent des tests et des briques qu'elle n'a pas toujours.
 */

const RACINE = process.cwd();
const SKILLS = path.join(".claude", "skills");

// `expression` nulle : un fichier cité sans cible (on n'en vérifie que l'existence).
type Renvoi = { numero: string; fichier: string | null; expression: string | null };

const EXTENSIONS = "tsx?|md|mjs|json|css|sql|ya?ml|js";

// La colonne « Tenue par » des lignes du tableau : seule zone où l'on cite une cible.
function cellulesDeRenvoi(texte: string): { numero: string; cellule: string }[] {
  const cellules: { numero: string; cellule: string }[] = [];
  for (const ligne of texte.split("\n")) {
    const m = ligne.match(/^\| ([A-Z]+\d+) \|/);
    if (m) cellules.push({ numero: m[1], cellule: ligne.split(" | ").slice(3).join(" | ") });
  }
  return cellules;
}

// Un renvoi à l'ancienne, `fichier.ext:12` ou `:12` : plus admis.
function renvoisParLigne(texte: string): string[] {
  const ancien = new RegExp(`(\\.(?:${EXTENSIONS})|\`):\\d+\\b`);
  return cellulesDeRenvoi(texte)
    .filter(({ cellule }) => ancien.test(cellule))
    .map(
      ({ numero }) =>
        `${numero} : renvoi par numéro de ligne ; nommer la cible, « fragment » (en-tête de tests/cicatrices.test.ts)`
    );
}

// Parcourt la cellule de gauche à droite : un nom de skill ou d'agent, un
// fichier, ou une expression « … » qui prend son fichier dans ce qui précède.
function lireRenvois(texte: string, existe: (fichier: string) => boolean = () => false): Renvoi[] {
  const renvois: Renvoi[] = [];
  const motif = new RegExp(
    `(solstice-[a-z-]+|creer-appli)|(relecteur-[a-z]+)|\`?((?:[\\w./[\\]()-]+\\.(?:${EXTENSIONS})|\\.gitignore))\`?|«\\s+(.+?)\\s+»`,
    "g"
  );
  for (const { numero, cellule } of cellulesDeRenvoi(texte)) {
    let skill: string | null = null;
    let courant: string | null = null;
    for (const m of cellule.matchAll(motif)) {
      if (m[1]) {
        skill = m[1];
        courant = null;
      } else if (m[2]) {
        skill = null;
        courant = path.join(".claude", "agents", `${m[2]}.md`);
      } else if (m[3]) {
        const dansLaSkill = skill && !m[3].includes("/") ? path.join(SKILLS, skill, m[3]) : null;
        courant = dansLaSkill && (m[3] === "SKILL.md" || existe(dansLaSkill)) ? dansLaSkill : m[3];
        // Un fichier cité sans cible ne vérifie rien d'autre que son existence : le
        // dire, plutôt que de laisser un chemin périmé passer pour tenu.
        renvois.push({ numero, fichier: courant, expression: null });
      } else {
        renvois.push({
          numero,
          fichier: courant ?? (skill ? path.join(SKILLS, skill, "SKILL.md") : null),
          expression: m[4],
        });
      }
    }
  }
  return renvois;
}

// Lit une chaîne ouverte en `debut` : son contenu (guillemets échappés rendus)
// et la position qui suit sa fermeture.
function lireChaine(source: string, debut: number): { contenu: string; fin: number } {
  const guillemet = source[debut];
  let contenu = "";
  let i = debut + 1;
  while (i < source.length && source[i] !== guillemet) {
    if (source[i] === "\\" && i + 1 < source.length) {
      contenu += source[i + 1];
      i += 2;
    } else {
      contenu += source[i++];
    }
  }
  return { contenu, fin: i + 1 };
}

// Saute un groupe de parenthèses ou de crochets, chaînes comprises : pour
// passer le tableau de `it.each([...])(` et trouver l'intitulé qui le suit.
function sauterGroupe(source: string, debut: number): number {
  let profondeur = 0;
  let i = debut;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'" || c === "`") {
      i = lireChaine(source, i).fin;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") profondeur++;
    if (c === ")" || c === "]" || c === "}") profondeur--;
    i++;
    if (profondeur === 0) return i;
  }
  return i;
}

// Les intitulés des `describe(`, `it(`, `test(` d'un fichier de test, y compris
// `it.each([...])("intitulé", …)`, `it.runIf(cond)("intitulé", …)` et un
// intitulé écrit sur la ligne qui suit l'ouverture.
function intitules(source: string): string[] {
  const titres: string[] = [];
  for (const m of source.matchAll(/(?<![\w.])(?:it|test|describe)(?:\.\w+)*\s*\(/g)) {
    let ouvrante = m.index + m[0].length - 1;
    for (let groupes = 0; groupes < 2; groupes++) {
      let i = ouvrante + 1;
      while (/\s/.test(source[i] ?? "")) i++;
      if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
        titres.push(lireChaine(source, i).contenu);
        break;
      }
      // Pas d'intitulé ici : les arguments d'un `.each(...)`, puis `(`.
      ouvrante = sauterGroupe(source, ouvrante);
      if (source[ouvrante] !== "(") break;
    }
  }
  return titres;
}

function estUnTest(fichier: string): boolean {
  return /^tests\/.+\.test\.tsx?$/.test(fichier.replace(/\\/g, "/"));
}

function occurrences(texte: string, fragment: string): number {
  return texte.split(fragment).length - 1;
}

// Chaque cible nommée existe, et une seule fois. Chaque erreur nomme la leçon
// et ce qui manque : une cible retirée ou renommée, c'est une leçon qui n'est
// plus tenue.
function problemes(renvois: Renvoi[], lireFichier: (fichier: string) => string | null): string[] {
  const erreurs = new Set<string>();
  for (const { numero, fichier, expression } of renvois) {
    const ou = `${numero} (docs/cicatrices.md)`;
    if (!fichier) {
      erreurs.add(`${ou} : « ${expression} » n'est précédé d'aucun fichier`);
      continue;
    }
    const contenu = lireFichier(fichier);
    if (contenu === null) {
      erreurs.add(`${ou} : ${fichier} n'existe pas ; la leçon n'est plus tenue`);
      continue;
    }
    if (expression === null) continue;
    // Un accent grave seul s'apparie, au rendu, avec le suivant de la cellule et
    // met en code ce qui n'en est pas.
    if ((expression.match(/`/g) ?? []).length % 2 === 1) {
      erreurs.add(
        `${ou} : « ${expression} » a un nombre impair d'accents graves ; couper avant ou après le groupe de code`
      );
    }
    const r = { fichier, expression };
    if (estUnTest(r.fichier)) {
      const n = intitules(contenu).filter((titre) => titre.includes(r.expression)).length;
      if (n === 0) {
        erreurs.add(
          `${ou} : aucun intitulé de ${r.fichier} ne contient « ${r.expression} » ; le cas est renommé ou retiré, la leçon n'est plus tenue`
        );
      } else if (n > 1) {
        erreurs.add(
          `${ou} : « ${r.expression} » est ambigu dans ${r.fichier} (${n} intitulés le contiennent) ; allonger le fragment`
        );
      }
    } else {
      const n = occurrences(contenu, r.expression);
      if (n === 0) {
        erreurs.add(
          `${ou} : « ${r.expression} » ne figure plus dans ${r.fichier} ; la règle est changée ou retirée, la leçon n'est plus tenue`
        );
      } else if (n > 1) {
        erreurs.add(
          `${ou} : « ${r.expression} » est ambigu dans ${r.fichier} (${n} occurrences) ; allonger l'expression`
        );
      }
    }
  }
  return [...erreurs];
}

// Compte les lignes du tableau par statut. Une ligne d'en-tête de colonne ou
// de titre n'a pas d'identifiant `D1`, `ME13`… et ne compte pas.
type Compte = { total: number; tenues: number; enPartie: number; nonTenues: number };

function compterLignes(texte: string): Compte {
  const compte: Compte = { total: 0, tenues: 0, enPartie: 0, nonTenues: 0 };
  for (const ligne of texte.split("\n")) {
    if (!/^\| [A-Z]+\d+ \|/.test(ligne)) continue;
    const tenue = ligne.split(" | ").slice(3).join(" | ");
    compte.total++;
    if (tenue.startsWith("**Non tenue**")) compte.nonTenues++;
    else if (tenue.startsWith("**En partie**")) compte.enPartie++;
    else compte.tenues++;
  }
  return compte;
}

// Une ligne qui parle de « Non tenue » ou d'« En partie » sans commencer par
// ce statut tomberait dans les tenues sans bruit : on la refuse plutôt.
function statutsAmbigus(texte: string): string[] {
  return texte
    .split("\n")
    .filter((ligne) => /^\| [A-Z]+\d+ \|/.test(ligne))
    .filter((ligne) => {
      const tenue = ligne.split(" | ").slice(3).join(" | ");
      return /Non tenue|En partie/.test(tenue) && !/^\*\*(Non tenue|En partie)\*\*/.test(tenue);
    })
    .map((ligne) => ligne.slice(0, 40));
}

// Le compteur de tête : « 164 cicatrices, dont 91 tenues, 14 « En partie » et
// 59 « Non tenue » ». Renvoie null si la phrase manque ou a changé de forme.
function lireCompteur(texte: string): Compte | null {
  const m = texte.match(/(\d+) cicatrices, dont (\d+) tenues, (\d+) « En partie » et (\d+) « Non tenue »/);
  return m ? { total: +m[1], tenues: +m[2], enPartie: +m[3], nonTenues: +m[4] } : null;
}

function lireDuDepot(fichier: string): string | null {
  const chemin = path.join(RACINE, fichier);
  return existsSync(chemin) ? readFileSync(chemin, "utf-8") : null;
}

describe("renvois de docs/cicatrices.md", () => {
  const registre = readFileSync(path.join(RACINE, "docs", "cicatrices.md"), "utf-8");
  const renvois = lireRenvois(registre, (f) => existsSync(path.join(RACINE, f)));

  it("trouve les renvois du registre (sans quoi le verrou passerait sur du vide)", () => {
    expect(renvois.length).toBeGreaterThan(100);
    expect(readdirSync(path.join(RACINE, SKILLS)).length).toBeGreaterThan(0);
  });

  /*
   * Le compteur de tête est le seul chiffre du registre : un README ou une
   * présentation le cite, jamais ne l'arrondit. Il se vérifie ici ; ce test
   * n'est pas copié dans une appli assemblée alors que le registre l'est, d'où
   * une phrase qui doit rester vraie sans lui.
   */
  it("annonce en tête le total et la répartition réels des lignes (une présentation a annoncé « 164 leçons, chacune reliée à ce qui la tient » quand 59 n'étaient pas tenues)", () => {
    const annonce = lireCompteur(registre);
    const reel = compterLignes(registre);
    const bons = `${reel.total} cicatrices, dont ${reel.tenues} tenues, ${reel.enPartie} « En partie » et ${reel.nonTenues} « Non tenue »`;
    expect(statutsAmbigus(registre), "statut à écrire en tête de cellule : **Non tenue** ou **En partie**").toEqual([]);
    expect(annonce, `compteur de tête absent ou mal formé ; écrire : ${bons}`).not.toBeNull();
    expect(annonce, `compteur de tête faux ; écrire : ${bons}`).toEqual(reel);
  });

  it("recompte juste, et refuse un compteur faux (cas fautif que le verrou doit attraper)", () => {
    const tableau = [
      "| N° | Règle | Cas | Tenue par |",
      "| --- | --- | --- | --- |",
      "| D1 | r | c | `CLAUDE.md` « une règle » |",
      "| ME13 | r | c | **En partie** : manque x |",
      "| T2 | r | c | **Non tenue** (pas de brique) |",
      "| T3 | r | c | **Non tenue** |",
    ].join("\n");
    expect(compterLignes(tableau)).toEqual({ total: 4, tenues: 1, enPartie: 1, nonTenues: 2 });
    expect(lireCompteur("4 cicatrices, dont 1 tenues, 1 « En partie » et 2 « Non tenue »")).toEqual(
      compterLignes(tableau)
    );
    expect(lireCompteur("5 cicatrices, dont 1 tenues, 1 « En partie » et 2 « Non tenue »")).not.toEqual(
      compterLignes(tableau)
    );
    expect(lireCompteur("quatre leçons")).toBeNull();
  });

  it("vise partout une cible nommée qui existe, une seule fois : intitulé de test ou expression exacte (audit du 2026-11-09 : vingt renvois sur une ligne vide ; 2026-11-17 : un renvoi décalé de huit lignes restait vert sur le mauvais cas)", () => {
    expect(problemes(renvois, lireDuDepot)).toEqual([]);
  });

  it("n'admet plus aucun renvoi par numéro de ligne dans le registre (chaque ajout dans un fichier cité les décalait tous)", () => {
    expect(renvoisParLigne(registre)).toEqual([]);
  });

  describe("sur un registre d'essai en mémoire", () => {
    const fichiers = new Map<string, string>([
      [
        "tests/exemple.test.ts",
        [
          'describe("le groupe", () => {',
          "  it(\"refuse un fichier qui n'est pas un texte (cas d'origine)\", () => {});",
          '  it("accepte un fichier texte", () => {});',
          '  it("accepte un fichier texte, avec un en-tête", () => {});',
          '  it.each([["a"], ["b"]])("traite la valeur « %s » sans la perdre", () => {});',
          "  it(",
          '    "écrit son intitulé sur la ligne suivante",',
          "    () => {},",
          "  );",
          "});",
        ].join("\n"),
      ],
      [
        path.join(SKILLS, "solstice-ui", "SKILL.md"),
        "# Kit\n\nToute interface se construit avec src/ui/.\n\n## Tableaux\n\nUn tableau se fait avec Tableau.\nUn tableau se fait avec Tableau, sans table à la main.\n",
      ],
      ["src/exemple.ts", "export function fermeeAuxMoteurs() {}\nconst x = fermeeAuxMoteurs();\n"],
    ]);
    const lire = (f: string) => fichiers.get(f) ?? null;
    const erreursDe = (tenue: string) =>
      problemes(
        lireRenvois(`| X1 | règle | cas | ${tenue} |`, (f) => fichiers.has(f)),
        lire
      );

    it("laisse passer une cible présente une seule fois, sous toutes les formes d'intitulé", () => {
      expect(
        erreursDe(
          "`tests/exemple.test.ts` « refuse un fichier qui n'est pas un texte » ; « le groupe » ; « traite la valeur » ; « sur la ligne suivante » ; « accepte un fichier texte, avec »"
        )
      ).toEqual([]);
      expect(erreursDe("`solstice-ui` (« Un tableau se fait avec Tableau, sans »)")).toEqual([]);
      expect(erreursDe("`src/exemple.ts` « function fermeeAuxMoteurs »")).toEqual([]);
    });

    it("attrape un intitulé de test absent, et dit la leçon et ce qui manque", () => {
      const erreurs = erreursDe("`tests/exemple.test.ts` « refuse un fichier vide »");
      expect(erreurs).toHaveLength(1);
      expect(erreurs[0]).toMatch(
        /X1.*aucun intitulé de tests\/exemple\.test\.ts ne contient « refuse un fichier vide »/
      );
    });

    it("attrape un intitulé en double, qu'une expression commune à deux cas rend ambigu", () => {
      const erreurs = erreursDe("`tests/exemple.test.ts` « accepte un fichier texte »");
      expect(erreurs).toHaveLength(1);
      expect(erreurs[0]).toMatch(/ambigu.*2 intitulés/);
    });

    it("ne prend pas le corps d'un test pour un intitulé : seuls les intitulés comptent", () => {
      expect(erreursDe("`tests/exemple.test.ts` « () => {} »")).toHaveLength(1);
    });

    it("attrape un fichier absent", () => {
      expect(erreursDe("`tests/absent.test.ts` « x »")[0]).toMatch(/tests\/absent\.test\.ts n'existe pas/);
    });

    it("attrape une section ou une expression absente d'un fichier Markdown, ou présente deux fois", () => {
      expect(erreursDe("`solstice-ui` (« Tableaux de bord »)")[0]).toMatch(
        /ne figure plus dans .*solstice-ui.SKILL\.md/
      );
      expect(erreursDe("`solstice-ui` (« Un tableau se fait avec Tableau »)")[0]).toMatch(/ambigu.*2 occurrences/);
    });

    it("attrape un symbole retiré du code", () => {
      expect(erreursDe("`src/exemple.ts` « function reglesRobots »")[0]).toMatch(
        /ne figure plus dans src\/exemple\.ts/
      );
    });

    it("vérifie l'existence d'un fichier cité sans cible, une fois même s'il est aussi cité avec une expression", () => {
      expect(erreursDe("`src/exemple.ts` ; `solstice-ui` (`SKILL.md`)")).toEqual([]);
      const absent = erreursDe("`tests/disparu.test.ts` ; `.claude/hooks/absent.mjs` ; `src/exemple.ts`");
      expect(absent).toHaveLength(2);
      expect(absent[0]).toMatch(/X1.*tests\/disparu\.test\.ts n'existe pas/);
      expect(erreursDe("`tests/disparu.test.ts` « a » ; `tests/disparu.test.ts`")).toHaveLength(1);
      // Un nom sans chemin vaut le fichier de la skill nommée avant lui : absent, il est refusé.
      expect(erreursDe("`solstice-ui` (`inconnu.md`)")[0]).toMatch(/inconnu\.md n'existe pas/);
    });

    it("refuse une expression au nombre impair d'accents graves, qui casserait le rendu de la cellule", () => {
      expect(erreursDe("`src/exemple.ts` « function fermeeAuxMoteurs »")).toEqual([]);
      // Des accents graves par paires ne sont pas refusés pour cela (l'expression, absente, l'est pour une autre raison).
      expect(erreursDe("`src/exemple.ts` « `function` fermeeAuxMoteurs »").join()).not.toMatch(/impair/);
      const erreurs = erreursDe("`src/exemple.ts` « function `fermeeAuxMoteurs »");
      expect(erreurs.some((e) => /nombre impair d'accents graves/.test(e))).toBe(true);
    });

    it("refuse une expression sans fichier avant elle", () => {
      expect(erreursDe("« une règle seule »")[0]).toMatch(/aucun fichier/);
    });

    it("refuse un renvoi par numéro de ligne, quelle que soit son écriture", () => {
      const ligne = (tenue: string) => `| X1 | r | c | ${tenue} |`;
      expect(renvoisParLigne(ligne("`tests/a.test.ts:12`"))).toHaveLength(1);
      expect(renvoisParLigne(ligne("`tests/a.test.ts` « a » ; `:40`"))).toHaveLength(1);
      expect(renvoisParLigne(ligne("`solstice-ui` (`SKILL.md:5`)"))).toHaveLength(1);
      expect(renvoisParLigne(ligne("`tests/a.test.ts` « a » ; base `localhost:5433`"))).toEqual([]);
    });

    it("rattache une expression au fichier nommé juste avant, une skill à son SKILL.md, un fichier sans chemin à la skill nommée avant lui", () => {
      const lus = lireRenvois(
        "| X1 | r | c | `tests/a.test.ts` « a » ; « b » ; `solstice-ui` (« c ») ; relecteur-docs (« d ») ; `solstice-nouvelle-appli` (`socle.md` « e ») |",
        (f) => f === path.join(SKILLS, "solstice-nouvelle-appli", "socle.md")
      );
      const avecCible = lus.filter((r) => r.expression !== null);
      expect(avecCible.map((r) => [r.fichier, r.expression])).toEqual([
        ["tests/a.test.ts", "a"],
        ["tests/a.test.ts", "b"],
        [path.join(SKILLS, "solstice-ui", "SKILL.md"), "c"],
        [path.join(".claude", "agents", "relecteur-docs.md"), "d"],
        [path.join(SKILLS, "solstice-nouvelle-appli", "socle.md"), "e"],
      ]);
    });
  });
});
