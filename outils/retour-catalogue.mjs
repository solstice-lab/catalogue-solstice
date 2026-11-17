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
 */
import { createHash } from "node:crypto";

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
      ? `Proposée par l'appli : les lignes qu'elle a ajoutées à \`${REGISTRE}\` (voir le diff). ` +
        "À relire comme une leçon, pas comme un défaut de code."
      : `À écrire : la règle qu'on en tire pour \`${REGISTRE}\`, ou « aucune ».`,
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
