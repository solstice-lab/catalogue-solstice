/*
 * Les brouillons de tickets du catalogue, tirés des adaptations d'une appli
 * assemblée (ce que rend outils/adaptations.mjs, ou son --json) : un par note
 * d'ADAPTATIONS.md dont la nature est « défaut du catalogue ».
 *
 * Le retour au catalogue dépendait de quelqu'un qui pense à lancer l'outil des
 * adaptations, à trier et à rédiger : sur l'appli d'essai tours-de-coloc, trois
 * défauts du catalogue ne sont remontés qu'une fois vus à l'écran. Le
 * brouillon se dépose dans le dépôt DE L'APPLI, jamais dans le catalogue : le
 * catalogue est public, et un diff d'appli peut nommer un client ou une règle
 * métier. L'envoi reste un geste humain, par un lien qui ouvre un ticket
 * prérempli du catalogue.
 *
 * Fonction pure : ni fichier, ni réseau. Qui l'appelle lit les issues
 * existantes et crée celles qu'elle rend.
 *
 * - Un brouillon par note, pas par fichier : une note couvre souvent plusieurs
 *   fichiers (sur tours-de-coloc, une seule pour onze), et c'est elle qui
 *   décrit le défaut.
 * - Le champ « Nature » est le seul critère, lu par la garde
 *   (entreesDesAdaptations) : une note sans nature ou « propre à l'appli » ne
 *   donne rien. Deviner sur du texte libre enverrait vers un ticket public une
 *   évolution propre au client.
 * - Idempotent : le marqueur, en commentaire HTML dans le corps, est
 *   l'empreinte de la note et des fichiers qu'elle couvre (voir marqueurDe).
 *   Un brouillon fermé sans être envoyé garde son marqueur : il ne revient pas.
 *   Une retouche reprise depuis en donne un nouveau, à juger de nouveau.
 *
 * Lancé en ligne de commande par l'action du catalogue
 * (.github/actions/retour-catalogue), que la CI de l'appli appelle à chaque
 * arrivée sur main : il lit les adaptations, puis dépose les brouillons
 * nouveaux dans les issues de l'appli (deposer). Le fichier de CI de l'appli
 * est écrit par l'assembleur (fichierDeCI).
 *
 *   node outils/retour-catalogue.mjs <dossier-de-l-appli> --depot <propriétaire/nom>
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export class ErreurRetour extends Error {
  constructor(message) {
    super(message);
    this.name = "ErreurRetour";
  }
}

export const ETIQUETTE = "pour-le-catalogue";
// Le modèle de ticket du catalogue que le lien remplit (.github/ISSUE_TEMPLATE/).
export const MODELE = "retour-d-appli.md";
// GitHub refuse une adresse d'environ 8 Ko et plus ; les navigateurs suivent.
export const LONGUEUR_MAX_DU_LIEN = 8000;
// Le corps d'une issue GitHub : 65 536 caractères au plus.
export const LONGUEUR_MAX_DU_CORPS = 65_000;

const NATURE = "défaut du catalogue";
const DEPOT = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/;
const LONGUEUR_MAX_DU_TITRE = 200;

// Les titres du ticket prérempli : ceux du modèle, dans le même ordre (un test les compare).
const SECTIONS = {
  note: "## Ce que l'appli a dû retoucher",
  fichiers: "## Fichiers du catalogue concernés",
  diff: "## Diff",
  commit: "## Commit du catalogue",
  lecon: "## Leçon à inscrire au registre",
  avant: "## Avant d'envoyer",
};

/*
 * Le registre des cicatrices est copié dans chaque appli : une leçon qu'elle y
 * ajoute est une retouche d'un fichier du catalogue, qui remonte par ce
 * circuit. C'est une leçon proposée au registre du catalogue, pas un défaut de
 * son code : le brouillon et le ticket le disent.
 */
const REGISTRE = "docs/cicatrices.md";
const estUneLecon = ({ chemin, etat }) => chemin === REGISTRE && etat === "retouché";

const tronquer = (texte, longueur) => (texte.length <= longueur ? texte : `${texte.slice(0, longueur - 1)}…`);

// Une clôture plus longue que toute suite d'accents graves du diff : un diff de
// Markdown qui contient « ``` » ne referme pas le bloc au milieu.
const clotureDe = (diff) =>
  "`".repeat(Math.max(3, 1 + Math.max(0, ...[...diff.matchAll(/`+/g)].map(([suite]) => suite.length))));

// `morceau` : une partie du diff, entourée de la clôture du diff entier.
function blocDiff(diff, morceau = diff) {
  const cloture = clotureDe(diff);
  return `${cloture}diff\n${morceau.trimEnd()}\n${cloture}`;
}

const citer = (texte) =>
  texte
    .trimEnd()
    .split("\n")
    .map((ligne) => (ligne === "" ? ">" : `> ${ligne}`))
    .join("\n");

const ligneDeFichier = (fichier) =>
  `- \`${fichier.chemin}\` (${fichier.unite}) : ${fichier.etat}` +
  (estUneLecon(fichier) ? " (leçon proposée au registre)" : "");

// Un diff approché (outils/adaptations.mjs : origine.exacte à false) part du
// fichier du catalogue au commit noté et mêle les retouches de l'assembleur à
// celles de l'appli : sur tours-de-coloc, plus de 300 lignes pour migrations.ts,
// presque toutes de l'assembleur. Le dire, pour qu'il ne passe pas pour exact.
function diffsDe(fichiers) {
  return fichiers
    .filter(({ etat }) => etat === "retouché")
    .map(({ chemin, diff, origine }) => {
      if (diff === null) return { avant: `\`${chemin}\` : diff non donné (origine introuvable).`, diff: null };
      const avant =
        origine?.exacte === false
          ? `\`${chemin}\` : diff approché, depuis le fichier du catalogue au commit noté ; ` +
            "il mêle les retouches de l'assembleur à celles de l'appli.\n\n"
          : "";
      return { avant, diff };
    });
}

const texteDe = ({ avant, diff }) => (diff === null ? avant : `${avant}${blocDiff(diff)}`);

/*
 * L'empreinte de la note et, pour chaque fichier, de son chemin, de son état et
 * de l'empreinte de son contenu dans l'appli. Pas du diff : il dépend de
 * l'origine retrouvée (historique de l'appli, catalogue, rejeu), et un rejeu
 * qui échoue un jour sur deux aurait doublé les brouillons.
 */
function marqueurDe(note, fichiers) {
  const empreinte = createHash("sha256")
    .update(JSON.stringify([note.texte, fichiers.map(({ chemin, etat, empreinte }) => [chemin, etat, empreinte])]))
    .digest("hex");
  return `retour-catalogue:${empreinte.slice(0, 16)}`;
}

// --------------------------------------------------------- le ticket prérempli

function corpsPrerempli({ note, fichiers, commit, avecDiff, longueurNote, nombreDeFichiers }) {
  const texteNote =
    longueurNote >= note.texte.length
      ? note.texte
      : `${note.texte.slice(0, longueurNote).trimEnd()}\n\n(Note tronquée pour tenir dans le lien : la compléter depuis le brouillon de l'appli.)`;
  const listes = fichiers.slice(0, nombreDeFichiers).map(ligneDeFichier);
  if (nombreDeFichiers < fichiers.length) {
    listes.push(`- … et ${fichiers.length - nombreDeFichiers} autres, à recopier depuis le brouillon de l'appli.`);
  }
  const diffs = diffsDe(fichiers);
  const diff = !avecDiff
    ? "Coller ici le diff du brouillon de l'appli : trop long pour tenir dans le lien."
    : diffs.length === 0
      ? "Aucun : les fichiers sont supprimés par l'appli."
      : diffs.map(texteDe).join("\n\n");
  return [
    SECTIONS.note,
    "",
    citer(texteNote),
    "",
    SECTIONS.fichiers,
    "",
    ...listes,
    "",
    SECTIONS.diff,
    "",
    diff,
    "",
    SECTIONS.commit,
    "",
    `\`${commit ?? "inconnu"}\`, noté au manifeste de l'appli (catalogue.empreintes.json).`,
    "",
    SECTIONS.lecon,
    "",
    fichiers.some(estUneLecon)
      ? `Proposée par l'appli : sa ligne \`X…\` ajoutée à \`${REGISTRE}\` (voir le diff), que le catalogue ` +
        "reprend sous son propre numéro. À relire comme une leçon, pas comme un défaut de code."
      : `À écrire : la règle qu'on en tire, que la PR du catalogue qui corrige ce défaut inscrit à \`${REGISTRE}\` ; ` +
        "ou « aucune ».",
    "",
    SECTIONS.avant,
    "",
    "- [ ] Rien ici ne nomme un client, une personne ou une règle métier propre à l'appli.",
    "",
  ].join("\n");
}

function lienDe({ depot, note, fichiers, commit }) {
  const titre = `Retour d'une appli assemblée : ${tronquer(note.titre, LONGUEUR_MAX_DU_TITRE)}`;
  const url = (corps) =>
    `https://github.com/${depot}/issues/new?` +
    new URLSearchParams({ template: MODELE, title: titre, ...(corps === undefined ? {} : { body: corps }) }).toString();
  const complet = { note, fichiers, commit, longueurNote: note.texte.length, nombreDeFichiers: fichiers.length };

  const avecDiff = url(corpsPrerempli({ ...complet, avecDiff: true }));
  if (avecDiff.length <= LONGUEUR_MAX_DU_LIEN) return { url: avecDiff, diffInclus: true, corpsInclus: true };

  // Sans le diff, puis la note raccourcie, puis la liste des fichiers : chaque
  // pas retire un cinquième, jusqu'à tenir. Le brouillon de l'appli garde tout.
  let essai = { ...complet, avecDiff: false };
  for (;;) {
    const candidat = url(corpsPrerempli(essai));
    if (candidat.length <= LONGUEUR_MAX_DU_LIEN) return { url: candidat, diffInclus: false, corpsInclus: true };
    if (essai.longueurNote > 200) essai = { ...essai, longueurNote: Math.floor(essai.longueurNote * 0.8) };
    else if (essai.nombreDeFichiers > 1) {
      essai = { ...essai, nombreDeFichiers: Math.floor(essai.nombreDeFichiers * 0.8) };
    }
    // Des chemins démesurés : le modèle seul, plutôt que de priver les autres
    // notes de leur brouillon par une erreur.
    else return { url: url(undefined), diffInclus: false, corpsInclus: false };
  }
}

// --------------------------------------------------------- le brouillon de l'appli

// Bornes de l'en-tête du brouillon : il laisse toujours de la place aux diffs,
// et reste à lui seul sous la limite d'une issue.
const LONGUEUR_MAX_DE_LA_NOTE = 20_000;
const NOMBRE_MAX_DE_FICHIERS = 100;
const COUPE = "(Diff coupé : trop long pour une issue. Le reste se lit dans le dépôt de l'appli.)";

function corpsDuBrouillon({ depot, note, fichiers, marqueur, lien }) {
  const texteNote =
    note.texte.length <= LONGUEUR_MAX_DE_LA_NOTE
      ? note.texte
      : `${note.texte.slice(0, LONGUEUR_MAX_DE_LA_NOTE).trimEnd()}\n\n(Note tronquée ici : entière dans ADAPTATIONS.md.)`;
  const listes = fichiers.slice(0, NOMBRE_MAX_DE_FICHIERS).map(ligneDeFichier);
  if (fichiers.length > NOMBRE_MAX_DE_FICHIERS) {
    listes.push(`- … et ${fichiers.length - NOMBRE_MAX_DE_FICHIERS} autres, couverts par la même note.`);
  }
  const consigneDuLien = !lien.corpsInclus
    ? ["", "Le lien n'ouvre que le modèle (trop long pour une adresse) : y recopier la note, les fichiers et le diff."]
    : lien.diffInclus
      ? []
      : [
          "",
          "Le lien ne porte pas le diff (trop long pour une adresse) : le copier depuis ce brouillon dans le ticket.",
        ];
  const entete = [
    `<!-- ${marqueur} -->`,
    `La CI de l'appli a relevé une retouche notée « ${NATURE} » dans ADAPTATIONS.md. ` +
      "Rien n'a été envoyé au catalogue : ce brouillon reste dans le dépôt de l'appli.",
    "",
    "**Pourquoi l'envoyer.** Corrigée au catalogue, cette retouche n'est plus à reporter à chaque mise à jour " +
      "de l'appli, et les autres applis n'ont plus à la refaire.",
    "",
    "**Avant d'envoyer.** Le catalogue est public : retirer du ticket ce qui nomme un client, une personne " +
      "ou une règle métier propre à l'appli, dans la note comme dans le diff.",
    "",
    `**[Proposer au catalogue](${lien.url})** : ouvre un ticket prérempli sur ${depot}, à relire ; ` +
      "rien ne part avant sa validation.",
    ...consigneDuLien,
    ...(fichiers.some(estUneLecon)
      ? [
          "",
          `**Leçon proposée.** La retouche de \`${REGISTRE}\` ajoute une leçon au registre des cicatrices de ` +
            "l'appli : c'est une leçon proposée au registre du catalogue, pas un défaut de son code.",
        ]
      : []),
    "",
    "Pas à envoyer : fermer ce brouillon, il ne reviendra pas.",
    "",
    "## Note d'ADAPTATIONS.md",
    "",
    citer(texteNote),
    "",
    "## Fichiers",
    "",
    ...listes,
    "",
  ].join("\n");
  const diffs = diffsDe(fichiers);
  if (diffs.length === 0) return entete;

  // Les diffs dans l'ordre, chacun dans son bloc. Le premier qui ne tient plus
  // est coupé à une fin de ligne et refermé dans son propre bloc ; les suivants
  // sont laissés, et la coupe se dit hors de tout bloc.
  const titre = "## Diff\n\n";
  const pieces = [];
  let place = LONGUEUR_MAX_DU_CORPS - entete.length - titre.length - COUPE.length - 4;
  let coupe = false;
  for (const piece of diffs) {
    const texte = texteDe(piece);
    if (texte.length + 2 <= place) {
      pieces.push(texte);
      place -= texte.length + 2;
      continue;
    }
    coupe = true;
    if (piece.diff !== null) {
      const reste = place - piece.avant.length - blocDiff(piece.diff, "").length - 2;
      const garde = piece.diff.slice(0, Math.max(0, reste));
      const finDeLigne = garde.lastIndexOf("\n");
      if (finDeLigne > 0) pieces.push(`${piece.avant}${blocDiff(piece.diff, garde.slice(0, finDeLigne))}`);
    }
    break;
  }
  return `${entete}${titre}${pieces.join("\n\n")}\n${coupe ? `\n${COUPE}\n` : ""}`;
}

// --------------------------------------------------------- entrée

/**
 * Les brouillons à créer dans le dépôt de l'appli.
 * @param resultat ce que rend adaptations() d'outils/adaptations.mjs (ou son --json)
 * @param {{ depot: string, existants?: string[] }} options `depot` : le dépôt
 * GitHub du catalogue, « propriétaire/nom », où le lien ouvre le ticket.
 * `existants` : les corps des issues déjà étiquetées, ouvertes ou fermées.
 * @returns {{ titre: string, corps: string, marqueur: string, fichiers: string[],
 *   lien: { url: string, diffInclus: boolean, corpsInclus: boolean } }[]}
 */
export function brouillons(resultat, { depot, existants = [] }) {
  if (typeof depot !== "string" || !DEPOT.test(depot)) {
    throw new ErreurRetour(`« ${depot} » n'est pas un dépôt GitHub de la forme propriétaire/nom.`);
  }
  const parNote = new Map();
  for (const adaptation of resultat.adaptations) {
    if (adaptation.note?.nature !== NATURE) continue;
    const groupe = parNote.get(adaptation.note.texte) ?? { note: adaptation.note, fichiers: [] };
    groupe.fichiers.push(adaptation);
    parNote.set(adaptation.note.texte, groupe);
  }
  const rendus = [];
  for (const { note, fichiers: liste } of parNote.values()) {
    const fichiers = [...liste].sort((a, b) => (a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0));
    const marqueur = marqueurDe(note, fichiers);
    if (existants.some((corps) => corps.includes(`<!-- ${marqueur} -->`))) continue;
    const lien = lienDe({ depot, note, fichiers, commit: resultat.commit });
    rendus.push({
      titre: `Pour le catalogue : ${tronquer(note.titre, LONGUEUR_MAX_DU_TITRE)}`,
      corps: corpsDuBrouillon({ depot, note, fichiers, marqueur, lien }),
      marqueur,
      fichiers: fichiers.map(({ chemin }) => chemin),
      lien,
    });
  }
  return rendus;
}

// --------------------------------------------------------- le fichier de CI de l'appli

// L'action composite du catalogue, que la CI de l'appli appelle : l'appli n'a
// pas outils/, et le verrou des renvois (tests/aide-assemblage.ts) refuse
// qu'un fichier qu'elle reçoit le cite. Elle cite une action publique,
// versionnée, que GitHub télécharge avec tout le dépôt au commit dit ; c'est
// l'action, dans le catalogue, qui connaît le chemin de cet outil.
export const ACTION = ".github/actions/retour-catalogue";
export const FICHIER_DE_CI = ".github/workflows/retour-catalogue.yml";
const SHA = /^[0-9a-f]{40}$/;

/**
 * Le dépôt GitHub du catalogue, « propriétaire/nom », lu dans le champ
 * `repository` de son package.json : la seule source de son nom, que le
 * renommage du dépôt met à jour, et d'où découlent la ligne `uses:` du fichier
 * de CI de l'appli et les liens de ses brouillons. Un catalogue dérivé (fork)
 * qui y met son dépôt reçoit les tickets de ses applis.
 */
export function depotDuCatalogue(paquet) {
  const url = typeof paquet?.repository === "string" ? paquet.repository : paquet?.repository?.url;
  const trouve = /github\.com[/:]([A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(url ?? "");
  if (!trouve) {
    throw new ErreurRetour(
      "Le champ repository du package.json du catalogue ne donne pas un dépôt GitHub : " +
        "le fichier de CI du retour au catalogue ne saurait pas quelle action appeler."
    );
  }
  return trouve[1];
}

/**
 * Le fichier de CI que l'assembleur écrit dans l'appli (FICHIER_DE_CI).
 * `commit` : le SHA complet du catalogue à l'assemblage. Du code du catalogue
 * tourne ici avec un jeton qui écrit des issues : épinglé au commit de
 * l'assemblage, il ne change qu'avec une mise à jour, que l'appli relit dans
 * sa pull request, et jamais avec ce que le catalogue fusionne (prendre main
 * aurait exécuté tout commit du catalogue dans toutes les applis). C'est aussi
 * le commit auquel le manifeste compare les fichiers.
 * `checkout` : la ligne `actions/checkout@<sha> # vX` de ci.yml, reprise telle
 * quelle pour qu'une montée de version ne se fasse qu'à un endroit.
 */
export function fichierDeCI({ depot, commit, checkout }) {
  if (!DEPOT.test(depot ?? "")) throw new ErreurRetour(`« ${depot} » n'est pas un dépôt GitHub propriétaire/nom.`);
  if (!SHA.test(commit ?? "")) {
    throw new ErreurRetour(`« ${commit} » n'est pas un SHA complet : l'action du catalogue s'épingle par son commit.`);
  }
  if (!/^actions\/checkout@[0-9a-f]{40}( #.*)?$/.test(checkout ?? "")) {
    throw new ErreurRetour(`« ${checkout} » n'est pas une action checkout épinglée par SHA.`);
  }
  return [
    "name: Retour au catalogue",
    "",
    "# Écrit par l'assembleur du catalogue et renouvelé par chaque mise à jour depuis",
    "# le catalogue ; comme tout fichier venu du catalogue, une retouche se note dans",
    "# ADAPTATIONS.md.",
    "#",
    "# À chaque arrivée sur main, dépose dans les issues de ce dépôt (étiquette",
    `# ${ETIQUETTE}) un brouillon de ticket par note d'ADAPTATIONS.md de nature`,
    `# « ${NATURE} ». Rien ne part vers le catalogue, qui est public : le`,
    "# brouillon porte un lien qu'une personne ouvre, après en avoir retiré ce qui",
    "# nomme le client ou une règle métier. Fermer un brouillon l'écarte pour de bon.",
    "#",
    "# L'action vient du catalogue, épinglée au commit de l'assemblage ou de la",
    "# dernière mise à jour : le code qui tourne ici avec le droit d'écrire des issues",
    "# ne change qu'avec une mise à jour relue dans une pull request. Issues fermées",
    "# au dépôt ou refusées au jeton : le passage le dit et s'arrête, sans échec.",
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "  workflow_dispatch:",
    "",
    "# Un passage à la fois : deux passages simultanés déposeraient deux fois le même",
    "# brouillon.",
    "concurrency:",
    "  group: retour-au-catalogue",
    "  cancel-in-progress: false",
    "",
    "# Lire le dépôt, écrire les issues : rien d'autre, et aucun secret.",
    "permissions:",
    "  contents: read",
    "  issues: write",
    "",
    "jobs:",
    "  brouillons:",
    "    runs-on: ubuntu-latest",
    "    timeout-minutes: 10",
    "    steps:",
    `      - uses: ${checkout}`,
    "        with:",
    "          # L'historique entier : le diff d'une retouche part du fichier tel que",
    "          # l'assemblage l'a donné, retrouvé dans les commits de l'appli.",
    "          fetch-depth: 0",
    "          persist-credentials: false",
    `      - uses: ${depot}/${ACTION}@${commit}`,
    "        with:",
    `          catalogue: ${depot}`,
    "",
  ].join("\n");
}

// --------------------------------------------------------- le dépôt dans les issues

export class ErreurAPI extends Error {
  constructor(message, statut) {
    super(message);
    this.name = "ErreurAPI";
    this.statut = statut;
  }
}

/**
 * Dépose les brouillons nouveaux dans les issues de l'appli.
 * `api` : { corpsDesIssues(etiquette), creerLEtiquette(etiquette), creerLIssue({ titre, corps, etiquettes }) },
 * qui lèvent ErreurAPI sur un refus de GitHub. Un refus (issues fermées au
 * dépôt, jeton sans le droit) ne fait pas échouer le passage : l'appli n'a rien
 * cassé, elle n'a simplement pas d'issues où déposer.
 */
export async function deposer({ resultat, depot, api }) {
  const avertissements = [];
  const crees = [];
  const refus = (erreur, etape) => {
    if (!(erreur instanceof ErreurAPI)) throw erreur;
    avertissements.push(
      `Les issues du dépôt ont refusé ${etape} (${erreur.message}) : issues fermées au dépôt, ou jeton sans le droit ` +
        "issues: write. Rien n'est déposé ; les adaptations se lisent toujours dans ADAPTATIONS.md."
    );
  };
  let existants;
  try {
    existants = await api.corpsDesIssues(ETIQUETTE);
  } catch (erreur) {
    refus(erreur, "la lecture des brouillons existants");
    return { crees, avertissements };
  }
  const nouveaux = brouillons(resultat, { depot, existants });
  if (nouveaux.length === 0) return { crees, avertissements };
  try {
    await api.creerLEtiquette(ETIQUETTE);
    for (const { titre, corps } of nouveaux) {
      await api.creerLIssue({ titre, corps, etiquettes: [ETIQUETTE] });
      crees.push(titre);
    }
  } catch (erreur) {
    refus(erreur, "la création d'un brouillon");
  }
  return { crees, avertissements };
}

// L'API REST de GitHub, avec le jeton du passage. L'étiquette qui existe déjà (422) n'est pas un refus.
function apiDeGitHub({ jeton, depotAppli, racine = "https://api.github.com" }) {
  const appeler = async (methode, chemin, corps) => {
    const reponse = await fetch(`${racine}/repos/${depotAppli}${chemin}`, {
      method: methode,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${jeton}`,
        "x-github-api-version": "2022-11-28",
        ...(corps === undefined ? {} : { "content-type": "application/json" }),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    if (!reponse.ok) throw new ErreurAPI(`${methode} ${chemin} : ${reponse.status}`, reponse.status);
    return reponse.status === 204 ? null : reponse.json();
  };
  return {
    async corpsDesIssues(etiquette) {
      const corps = [];
      for (let page = 1; ; page++) {
        const lot = await appeler(
          "GET",
          `/issues?labels=${encodeURIComponent(etiquette)}&state=all&per_page=100&page=${page}`
        );
        corps.push(...lot.map((issue) => issue.body ?? ""));
        if (lot.length < 100) return corps;
      }
    },
    async creerLEtiquette(etiquette) {
      try {
        await appeler("POST", "/labels", {
          name: etiquette,
          color: "c5def5",
          description: "Brouillon de ticket pour le catalogue, à relire avant de l'envoyer",
        });
      } catch (erreur) {
        if (!(erreur instanceof ErreurAPI && erreur.statut === 422)) throw erreur;
      }
    },
    async creerLIssue({ titre, corps, etiquettes }) {
      await appeler("POST", "/issues", { title: titre, body: corps, labels: etiquettes });
    },
  };
}

// --------------------------------------------------------- ligne de commande

const AIDE = `Usage : node outils/retour-catalogue.mjs <dossier-de-l-appli> --depot <propriétaire/nom>

Lancé par l'action du catalogue (.github/actions/retour-catalogue) dans la CI
d'une appli assemblée : dépose dans ses issues (étiquette ${ETIQUETTE}) un
brouillon par note d'ADAPTATIONS.md de nature « ${NATURE} », s'il n'y est pas
déjà. --depot : le dépôt du catalogue où les liens des brouillons ouvrent le
ticket. Lit GITHUB_TOKEN, GITHUB_REPOSITORY et GITHUB_API_URL.
Un dossier qui n'est pas une appli assemblée : rien à déposer, sans échec.`;

async function main(argv) {
  if (argv.length === 0 || argv.includes("--aide") || argv.includes("-h")) {
    console.log(AIDE);
    return;
  }
  const rang = argv.indexOf("--depot");
  const depot = rang === -1 ? undefined : argv[rang + 1];
  const positionnels = argv.filter((argument, i) => !argument.startsWith("-") && i !== rang + 1);
  if (depot === undefined || !DEPOT.test(depot) || positionnels.length !== 1) {
    throw new ErreurRetour(`Un dossier d'appli et --depot <propriétaire/nom> attendus.\n\n${AIDE}`);
  }
  // Importé ici : l'assembleur importe ce module, et l'outil des adaptations
  // importe l'assembleur.
  const { adaptations, ErreurAdaptations } = await import("./adaptations.mjs");
  let resultat;
  try {
    // Sans catalogue où chercher l'origine : celle de l'historique de l'appli
    // suffit au brouillon (l'action n'a pas l'historique du catalogue).
    resultat = adaptations({ appli: positionnels[0] });
  } catch (erreur) {
    if (!(erreur instanceof ErreurAdaptations)) throw erreur;
    console.log(`::notice::Pas une appli assemblée lisible, rien à déposer : ${erreur.message.replace(/\n/g, " ")}`);
    return;
  }
  const { GITHUB_TOKEN: jeton, GITHUB_REPOSITORY: depotAppli, GITHUB_API_URL: racine } = process.env;
  if (!jeton || !depotAppli) {
    throw new ErreurRetour(
      "GITHUB_TOKEN et GITHUB_REPOSITORY attendus : l'outil se lance depuis l'action du catalogue."
    );
  }
  const { crees, avertissements } = await deposer({
    resultat,
    depot,
    api: apiDeGitHub({ jeton, depotAppli, racine: racine || undefined }),
  });
  for (const avertissement of [...resultat.avertissements, ...avertissements]) {
    console.log(`::warning::${avertissement.replace(/\n/g, " ")}`);
  }
  console.log(
    crees.length === 0
      ? "Aucun brouillon nouveau pour le catalogue."
      : `Brouillons déposés (${ETIQUETTE}) :\n${crees.map((titre) => `- ${titre}`).join("\n")}`
  );
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((erreur) => {
    if (erreur instanceof ErreurRetour) {
      console.error(`Retour au catalogue refusé : ${erreur.message}`);
      process.exit(1);
    }
    throw erreur;
  });
}
