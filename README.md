# Catalogue Solstice Lab

[![Vérification du code](https://github.com/solstice-lab/catalogue-solstice/actions/workflows/ci.yml/badge.svg)](https://github.com/solstice-lab/catalogue-solstice/actions/workflows/ci.yml)
[![Assemblage](https://github.com/solstice-lab/catalogue-solstice/actions/workflows/assemblage.yml/badge.svg)](https://github.com/solstice-lab/catalogue-solstice/actions/workflows/assemblage.yml)

Du code ouvert, éprouvé et testé pour qu'une petite ou moyenne entreprise
construise elle-même, avec Claude, l'application web dont elle a besoin :
remplacer un tableur devenu critique, une base Airtable bricolée ou des
allers-retours de mails.

On y trouve :

- un **socle** commun (le code que toute appli reprend) et la méthode de travail
  qui va avec, lue par Claude ;
- des **briques** réutilisables (connexion, échéances, e-mails, import
  Excel…) ;
- un **assembleur**, un programme qui copie ce que vous avez choisi dans un
  dossier neuf, qui devient un _dépôt_ (l'espace où vit le code de votre appli,
  sur GitHub) ; Claude y écrit ensuite ce qui est propre à votre métier.

Les applications visées servent de 5 à 50 personnes, ne sont soumises à aucune
contrainte réglementaire particulière et supportent une heure de panne sans
conséquence grave.

## Les promesses du catalogue

### On a fait les erreurs pour que vous ne les fassiez pas

Ce catalogue vient de projets réels et de son propre usage, et de ce qui y a mal tourné.
[`docs/cicatrices.md`](docs/cicatrices.md) en est le registre : près de 200
leçons, chacune avec la règle qu'on en a tirée, le cas qui l'a motivée et ce qui
la fait respecter aujourd'hui, test, skill, règle ou garde de Claude. Trois
exemples :

- Un index de base de données posé sur une colonne qui n'existait pas encore
  sur une base ancienne a fait échouer le démarrage, et toute l'application est
  tombée. Désormais, une table déjà en production ne se retouche plus : toute
  évolution passe par une étape de migration ajoutée à la fin, et un agent de
  relecture le vérifie avant chaque pull request qui touche au schéma.
- Un lancement de tests sur la base de développement a effacé le compte
  administrateur. Désormais, les tests refusent toute base qui n'est pas une
  base locale jetable, nommée comme telle.
- Un import de fichier a écrasé en silence plusieurs centaines de milliers
  d'euros de chiffre d'affaires : deux lignes de même code, l'une avait remplacé
  l'autre. Désormais, deux lignes de même clé se somment ou se rejettent avec
  leur motif, et un test le verrouille.

Le registre est honnête sur ses limites : plus de deux leçons sur trois sont
aujourd'hui tenues par un test, une skill, une règle ou une garde. La plupart des
autres viennent de fonctions que le catalogue n'a pas encore (synchronisation
avec des sources externes, facturation, IA…) : elles attendent la brique qui en
aura besoin, et servent au cadrage le jour où elle existera. Il reste une
douzaine de vrais trous, signalés dans le registre.

### Du code qui a déjà servi

Une brique naît dans une appli (réelle ou d'essai) et n'entre au catalogue que
quand une deuxième en a besoin. Les tests se lancent à chaque changement, et
l'assemblage de combinaisons de briques est lui aussi vérifié par la CI.

### L'expérience de l'agence, mise dans le code

Solstice Lab écrit et entretient le catalogue à partir de ses propres
livraisons. Ce qu'elle y a appris ne reste pas dans des têtes : les règles que
Claude suit sur le dépôt, c'est-à-dire [`CLAUDE.md`](CLAUDE.md), les skills de
`.claude/skills/` et les gardes de `.claude/hooks/`, viennent de ces projets et
s'appliquent d'office quand vous ouvrez le dépôt dans Claude Code.

### Le code est à vous

L'appli que vous assemblez vit dans votre dépôt, sur votre compte GitHub, sans
plateforme à louer. Le catalogue est sous licence MIT : vous pouvez l'utiliser,
le copier et le modifier. Ce que cela veut dire pour votre appli est dans « À
qui est le code ».

Le projet est cependant **expérimental** : voir « Statut du projet ».

## Le guide

Pour passer de la lecture à une appli qui tourne : ce qu'il vous faut, puis le
démarrage rapide, sur votre poste ou sans rien installer.

### Ce qu'il vous faut

Le catalogue lui-même ne se paie pas ; ce sur quoi il s'appuie, pas toujours.
Aucun prix n'est donné ici : ils changent, à lire chez chaque fournisseur.

Deux portes d'entrée : **sur votre poste**, la voie principale, ou **sans rien
installer**, dans le navigateur, avec GitHub Codespaces (voir « Démarrage
rapide »). Seul l'ordinateur équipé ci-dessous change entre les deux.

- **Sur votre poste, un ordinateur** avec git (et une identité configurée),
  Node 24 ou plus et npm 11.16 ou plus ; pour une appli qui garde des données,
  Docker, qui fait tourner la base sur votre poste. Sans rien installer, un
  navigateur suffit.
- **Un compte GitHub**, pour héberger le dépôt de l'appli. Sur un dépôt privé,
  exiger qu'une personne relise avant la mise en ligne demande un plan GitHub
  payant (d'après sa documentation).
- **Un compte Claude**, pour Claude Code : le catalogue est fait pour être
  utilisé avec lui (ses règles sont dans `CLAUDE.md` et `.claude/`). L'offre et
  ses conditions sont celles d'Anthropic.
- **Un hébergeur**, pour mettre l'appli en ligne. La brique `deploiement`
  prévoit Render : le service web et la base sont facturés chaque mois, et la
  base gratuite de Render, supprimée au bout de 30 jours, est refusée par la
  brique.
- **Un service d'envoi d'e-mails**, si l'appli a des comptes ou envoie des
  messages : la brique `mails` utilise Resend, avec un compte et une adresse
  d'expéditeur vérifiée.

### Démarrage rapide

Ce qui suit se fait sur votre poste. Pour essayer sans rien installer, voir
« Sans rien installer : GitHub Codespaces », plus bas.

Les prérequis sont ceux de « Ce qu'il vous faut » ; l'assembleur commite
l'appli, d'où l'identité git. Dans la suite, « assembler » veut dire copier le
socle et les briques choisies dans un dossier neuf. Les commandes sont les mêmes
sous PowerShell et sous bash, sauf la copie de `.env.example`.

Cloner le catalogue et assembler une appli à côté, ici avec la connexion
(`comptes`, qui exige `mails`) et les échéances :

```
git clone https://github.com/solstice-lab/catalogue-solstice.git
cd catalogue-solstice
npm ci
node outils/assembler.mjs ../mon-appli --briques comptes,mails,echeances
```

Puis, dans l'appli assemblée, installer, créer ses bases locales et son
`.env.local`, et la lancer (les mêmes commandes sous PowerShell et sous bash) :

```
cd ../mon-appli
npm ci
docker compose up -d --wait
npx tsx scripts/bases-locales.ts --env-local --admin=votre.adresse@exemple.fr
npm run dev
```

`--env-local` crée `.env.local` depuis `.env.example`, avec les seules valeurs
du travail local : la base de développement et, avec `comptes`, un `AUTH_SECRET`
tiré au hasard et l'adresse du premier admin, celle qui se connectera (sans
`comptes`, `--admin` ne sert pas). Il n'écrase jamais un `.env.local`
existant. L'accueil est sur http://localhost:3000. Sans brique,
`node outils/assembler.mjs ../mon-site` donne un site sans base : ni Docker ni
`.env.local`, `npm ci` puis `npm run dev` suffisent.

Une appli ne se copie pas depuis GitHub : elle s'assemble depuis ce
dépôt, avec la skill `creer-appli`, lancée dans une session Claude Code ouverte
à la racine du catalogue. Elle mène le cadrage, écrit la blueprint de l'appli
(le document qui décrit ses entités et ses briques), lance l'assembleur, crée le
dépôt distant après accord, puis les tickets de la première étape. Le
déroulement complet est dans [`docs/catalogue/demarrer.md`](docs/catalogue/demarrer.md).

#### Sans rien installer : GitHub Codespaces

Une option en plus de l'installation sur votre poste : le catalogue s'ouvre dans
le navigateur, dans un environnement prêt à l'emploi décrit par
[`.devcontainer/`](.devcontainer/) (Node, Docker et la base Postgres, Claude
Code et son extension, `gh`, l'outil de GitHub en ligne de commande, git déjà
configuré). Il faut un compte GitHub et un compte Claude ; ni git, ni Node, ni
Docker sur la machine.

[![Ouvrir dans GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/solstice-lab/catalogue-solstice)

Le parcours, en bref ; le parcours détaillé, le Codespace propre à chaque dépôt
et les limites sont dans [`docs/catalogue/codespaces.md`](docs/catalogue/codespaces.md) :

- **Deux autorisations au départ**, normales, à accepter : connecter votre
  compte Claude au premier lancement de Claude Code (par son extension ou dans
  le terminal), puis, au moment de créer le dépôt de l'appli, autoriser `gh` à
  agir sur votre compte GitHub.
- **Assembler depuis le catalogue**, avec la skill `creer-appli`, comme sur un
  poste. À la fin (appli assemblée, dépôt créé, tickets ouverts), Claude dit
  d'ouvrir une nouvelle session dans le dossier de l'appli.
- **Passer du catalogue à l'appli**, dans le même Codespace : **File > Open
  Folder…** (Fichier > Ouvrir le dossier), choisir `/workspaces/<nom-de-l-appli>`,
  à côté du catalogue (Claude donne le chemin). La fenêtre se recharge sur les
  fichiers de l'appli. Ouvrir un terminal (**Terminal > New Terminal**) ; pour
  une appli avec base, y préparer les bases et `.env.local` avec la commande
  `bases-locales.ts` du démarrage rapide. Lancer l'appli dans ce terminal
  (`npm run dev`) et s'y connecter. Claude, ouvert ensuite, démarre une nouvelle
  conversation, propre à l'appli, où celle du catalogue n'apparaît pas.
- **Un Codespace par dépôt.** La page GitHub du dépôt de l'appli ne montre pas
  le Codespace du catalogue : elle propose d'en créer un. Ce Codespace propre à
  l'appli (bouton **Code**, onglet **Codespaces**) sert à reprendre le travail
  plus tard ou ailleurs ; il reçoit le même environnement, mais sa base est
  vide, à préparer de nouveau avec la même commande.
- **Les commandes** se tapent dans le terminal du Codespace, un terminal Linux
  (bash), où le catalogue est déjà cloné et installé. Si la skill demande votre
  système, répondre : « Linux, terminal bash de GitHub Codespaces ». L'appli lancée par
  `npm run dev` s'ouvre dans le navigateur, sur une adresse en
  `….app.github.dev` que seul votre compte GitHub peut voir.

Les limites :

- un compte GitHub est obligatoire, et l'environnement dépend de GitHub ;
- le Codespace est facturé au compte qui le crée, au-delà du quota gratuit
  mensuel ;
- pas de vraies données personnelles dedans : il est hébergé par GitHub, et les
  données réelles ne vivent qu'en production, chez l'hébergeur choisi ;
- il s'arrête après 30 minutes sans activité (réglage par défaut) : les
  fichiers restent, les programmes lancés s'arrêtent ;
- un Codespace inactif est supprimé au bout de 30 jours (réglage par défaut),
  avec ce qui n'a pas été envoyé sur GitHub : demandez à Claude d'y envoyer
  (pousser) le travail à chaque fin de séance.

Côté coût, un essai complet (assembler une appli, la lancer, s'y connecter)
tient dans le quota gratuit mensuel d'un compte GitHub personnel ; le compte
Claude se paie à part, comme sur un poste.

### Aller plus loin

| Pour                                         | Lire                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Démarrer une appli en local, mener un projet du cadrage à la mise en ligne | [`docs/catalogue/demarrer.md`](docs/catalogue/demarrer.md)                                                                          |
| Travailler sans rien installer, dans GitHub Codespaces : le parcours détaillé, un Codespace par dépôt, les limites | [`docs/catalogue/codespaces.md`](docs/catalogue/codespaces.md)                                                                      |
| Tout savoir de l'assembleur : options, profils, mise à jour d'une appli, création des tickets d'une blueprint | [`docs/catalogue/assembler.md`](docs/catalogue/assembler.md)                                                       |
| Connaître ce que chaque brique exige et où elle se branche | [`docs/catalogue/briques.md`](docs/catalogue/briques.md)                                                                              |
| Se repérer dans le dépôt, connaître les vérifications à lancer avant une pull request | [`docs/catalogue/structure.md`](docs/catalogue/structure.md)                                                          |
| Les règles de travail de Claude sur le dépôt | [`CLAUDE.md`](CLAUDE.md)                                                                                                                                           |
| Travailler sur le dépôt (équipe)             | [`CONTRIBUTING.md`](CONTRIBUTING.md)                                                                                                                               |
| Les leçons payées                              | [`docs/cicatrices.md`](docs/cicatrices.md), et [`docs/CHANGELOG-socle.md`](docs/CHANGELOG-socle.md) pour les changements du socle                                  |

## Sous le capot

Ce que contient le catalogue et comment c'est construit, pour qui veut comprendre
avant de se lancer.

### Les trois niveaux d'une appli

Une appli assemblée se lit en trois niveaux. La métaphore de la maison aide à
les distinguer : on ne refait pas les fondations à chaque chantier, on pose des
éléments qui ont déjà tenu, et c'est l'aménagement qui rend la maison propre à
ses occupants.

| Niveau        | Ce que c'est                                                                                                                | Dans la maison | Dans une appli assemblée                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| Socle         | Le code commun (kit d'interface et thème, mentions légales et confidentialité, sonde `/sante`, CI) et sa méthode de travail | Les fondations | Toujours présent                                                                 |
| Briques       | Un comportement réutilisable : échéances, calendrier, validation, import par lot, e-mails, comptes…                         | Les éléments   | Choisies d'une appli à l'autre                                                   |
| Module métier | Vos entités (contrats, équipements, demandes…) et leurs écrans, écrits sur le patron `dossiers`| L'aménagement  | Propre à chaque appli, écrit après l'assemblage ; le catalogue n'en livre aucun |

Le socle ne livre pas seulement du code de départ, il livre la **méthode** :
des composants qui portent les règles de construction, des règles courtes dans
[`CLAUDE.md`](CLAUDE.md), des skills de Claude qui documentent chaque domaine
et des garde-fous en code. Socle et méthode forment le _harnais_. Chaque règle
vient d'une leçon payée sur un projet précédent ; [`docs/cicatrices.md`](docs/cicatrices.md)
en tient le registre.

### Les briques

Ce sont exactement celles que l'assembleur sait assembler. Chacune a son dossier
dans `src/briques/<nom>/`, avec un `README.md` qui dit comment l'utiliser. Le
tableau qui dit ce que chacune exige et où elle se branche est dans
[`docs/catalogue/briques.md`](docs/catalogue/briques.md).

| Brique                                                    | Ce qu'elle apporte                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`comptes`](src/briques/comptes/README.md)                | La connexion des personnes (code reçu par e-mail, Google, Microsoft), tout protégé par défaut, des droits par rôle |
| [`gestion-comptes`](src/briques/gestion-comptes/README.md) | Un écran où un administrateur invite, change le rôle, désactive ou réactive un compte                   |
| [`espaces`](src/briques/espaces/README.md)                | Des groupes de personnes (une coloc, une association) qui ne voient que leurs propres fiches             |
| [`rgpd`](src/briques/rgpd/README.md)                      | L'export et l'effacement des données d'une personne, la purge au terme de la durée de conservation      |
| [`journal`](src/briques/journal/README.md)                | Le journal d'audit : qui a créé, modifié ou supprimé quoi, et quand                                      |
| [`mails`](src/briques/mails/README.md)                    | L'envoi d'e-mails automatiques ; rien ne part sans réglage explicite                                     |
| [`notifications`](src/briques/notifications/README.md)    | Un récapitulatif envoyé par e-mail à jour fixe                                                           |
| [`contact`](src/briques/contact/README.md)                | Le formulaire de contact public, protégé contre le courrier indésirable sans captcha                     |
| [`echeances`](src/briques/echeances/README.md)            | Le suivi de dates limites (à venir, en retard) sur ce que l'appli gère, avec une vue « À venir »         |
| [`calendrier`](src/briques/calendrier/README.md)          | Les événements d'un mois : grille sur ordinateur, cartes sur téléphone                                   |
| [`validation`](src/briques/validation/README.md)          | Une file de propositions à accepter ou refuser, la décision étant tracée                                 |
| [`import-lot`](src/briques/import-lot/README.md)          | L'import d'un fichier Excel ou CSV, contrôlé avant d'être confirmé tout ou rien                          |
| [`deploiement`](src/briques/deploiement/README.md)        | La mise en ligne automatique après les vérifications de la CI (adaptateur Render)                        |

Une brique qui en exige une autre ne se garde pas sans elle : l'assembleur
refuse l'appel et nomme la brique à ajouter. Pour partir d'un jeu de briques
cohérent, trois profils existent : `vitrine` (un site sans connexion),
`outil-interne` (des comptes) et `portail` (des comptes qu'un administrateur
gère à l'écran).

### Claude Code : un hook s'applique d'office

`.claude/settings.json` est suivi dans le dépôt et branche un hook
`PreToolUse` : quiconque ouvre le dépôt dans Claude Code le reçoit. Avant
chaque commande et chaque écriture de fichier de Claude, il lance
`node .claude/hooks/gardes.mjs`, sans dépendance ni réseau, qui refuse
notamment d'écrire un `.env*` ou un `.npmrc`, de verser un mot de passe de base
distante dans une commande ou un fichier, de forcer un push, de sauter les
hooks git ou de fusionner une pull request. La liste complète est dans
[`CLAUDE.md`](CLAUDE.md), section 8.

Il arrête l'inadvertance d'une session, pas qui veut passer : la barrière réelle
est la protection de `main` et l'absence de secrets de production sur le poste.
Il ne touche pas aux commandes que vous tapez vous-même. En session
interactive, Claude Code ne lance les hooks d'un dossier qu'une fois sa demande
de confiance acceptée.

Pour s'en passer sur son poste, mettre `{ "disableAllHooks": true }` dans
`.claude/settings.local.json` (ignoré par git). Ce réglage coupe tous les
hooks, les vôtres compris : Claude Code ne permet pas d'en retirer un seul.

### À qui est le code

- **Le catalogue** est sous licence MIT ([`LICENSE`](LICENSE)) : vous pouvez
  l'utiliser, le copier et le modifier, à condition de garder l'avis de droit
  d'auteur et le texte de la
  licence.
- **L'appli que vous assemblez** est marquée `UNLICENSED` dans son
  `package.json` : elle n'est pas publiée sous licence libre, et ses droits relèvent de son propriétaire et, le cas échéant, d'un contrat, non de la licence du catalogue.
  Elle ne reçoit
  pas `LICENSE` mais un fichier `NOTICE`, écrit par l'assembleur, qui porte
  l'avis de droit d'auteur et le texte MIT du catalogue, puis l'avis des
  polices IBM Plex (licence OFL). La licence MIT exige que cet avis suive toute
  copie du code repris : gardez `NOTICE` si vous transmettez ou publiez
  l'appli. Il ne donne aucune licence à l'appli.
- **La signature** « Conçu par Solstice Lab », en pied de page, est une règle
  des livraisons de l'agence, pas une obligation de la licence : pour une appli
  que vous construisez pour vous, vous pouvez la retirer (voir
  [`CONTRIBUTING.md`](CONTRIBUTING.md), « La signature Solstice Lab »).

Ceci décrit ce que fait le code ; ce n'est pas un conseil juridique.

Le dépôt est entretenu par l'équipe Solstice Lab et n'accepte pas de pull
request extérieure (une proposition de modification de code) : un problème se
signale par un ticket, une faille par [`SECURITY.md`](SECURITY.md), et
[`CONTRIBUTING.md`](CONTRIBUTING.md) est le mode d'emploi de l'équipe. Les
échanges suivent le [code de conduite](CODE_OF_CONDUCT.md).

## Statut du projet

- **Expérimental.** Le catalogue est celui de Solstice Lab et change
  avec ses propres projets. Des combinaisons de briques s'assemblent dans les tests (fichiers,
  imports, typecheck, migrations) ; la brique `deploiement` a été éprouvée sur
  une appli d'essai.
- **Pas de version publiée** : ni tag, ni release, ni paquet npm. Seule la
  branche `main` est entretenue. `package.json` porte `"private": true` : c'est
  le dépôt qui est sous licence MIT, pas un paquet distribué.
- **Interfaces des briques non stabilisées.** Chaque changement d'interface
  publique est inscrit au `CHANGELOG.md` de la brique, sans promesse de
  compatibilité d'un commit à l'autre.

Ce parcours n'a pas encore été fait de bout en bout par une équipe sans
développeur : prévoyez de pouvoir vous faire aider. Solstice Lab, qui écrit et
entretient le catalogue, peut accompagner une entreprise qui ne veut pas le
faire seule : voir [solstice-lab.com](https://solstice-lab.com).

## Licence

Le catalogue est publié sous licence MIT ([`LICENSE`](LICENSE)). Les polices
IBM Plex de `src/ui/theme/polices/` sont sous SIL Open Font License 1.1
(`src/ui/theme/polices/LICENCE-OFL.txt`). Ce que cela veut dire pour l'appli que
vous assemblez est dans « À qui est le code ».
