# Registre des cicatrices

Une **cicatrice** est une leçon payée : un incident, un correctif, une anomalie
d'essai ou de recette, un constat d'audit dont on a tiré une règle. Elle vient de
trois sources : un projet antérieur de l'équipe (le catalogue est né de ces
leçons), la vie du catalogue lui-même, une appli assemblée. Ce registre en garde
la règle et le cas, sans nom de client, d'appli, de prestataire ni de personne, ni
numéro de ticket ou de PR. Les sources antérieures (l'inventaire des applis déjà
livrées, les journaux du prototype) restent hors de ce dépôt.

Chaque ligne donne :

- **la règle**, ce qu'on fait désormais ;
- **le cas**, ce qui s'est passé (ou, quand les archives ne détaillent pas
  l'incident, d'où vient la règle) ;
- **ce qui la tient** dans le catalogue : un test (le fichier et un fragment de
  l'intitulé de son cas), une skill, une phrase du `CLAUDE.md`, une garde de
  Claude, ou un fichier de configuration commenté (le fichier et une expression
  qui s'y trouve). « **En partie** » dit ce qui manque.
  « **Non tenue** » : rien ne la tient encore, c'est une invitation à ouvrir un
  ticket. Une parenthèse dit pourquoi, et il y en a deux sortes : « attend une
  brique » (la fonction que la règle garde n'existe pas au catalogue : elle se
  verrouille avec la brique, le jour où elle existe) et « relève du module métier
  de l'appli » (le catalogue n'a rien à verrouiller : la blueprint de l'appli qui
  fait ce dont la règle parle la porte au cadrage, avec le test de son module,
  ou la règle écrite quand c'est un point de méthode du projet). Une appli qui
  fait déjà ce dont parle une règle de la première sorte la porte aussi au
  cadrage, sans attendre la brique. Quelques cas particuliers disent leur motif
  en toutes lettres.

Un renvoi nomme ce qu'il vise, jamais sa ligne : un numéro de ligne glisse à chaque
ajout dans le fichier visé, et un renvoi décalé retombait sur une autre ligne,
non vide, sans que rien ne l'alerte. Vers un fichier de test, il s'écrit
`tests/x.test.ts` « un fragment de l'intitulé du cas » ; vers tout autre fichier
(skill, agent, `CLAUDE.md`, README, code, configuration), `fichier` « une expression
exacte du fichier » : un titre de section, une phrase de la règle, ou un symbole
avec sa déclaration (`function nom`). Plusieurs cibles d'un même fichier :
`fichier` « a » ; « b ». Un fragment se lit sans ouvrir le fichier : il commence au
verbe ou au nom qui porte la règle, finit sur un mot plein (jamais sur « de », « le »
ou « par ») et ne garde pas les astérisques de mise en forme d'une phrase en gras.
`tests/cicatrices.test.ts` vérifie aussi l'existence de chaque fichier cité, avec ou
sans expression, et exige que le fragment figure
une seule fois (un seul intitulé de cas, une seule occurrence dans le fichier) :
un cas renommé, une règle retirée ou reformulée, un fragment devenu ambigu font
échouer le test en nommant la leçon, qui n'est alors plus tenue. Il ne dit pas
que la cible est la bonne pour la règle : à relire à l'ajout. Une règle
« tenue » par une brique, un module ou la brique données ne vaut que dans
une appli qui les a gardés.

Avant de cadrer une brique ou un module, relire les domaines qu'il touche.

**Ajouter une ligne.** Toute PR qui corrige un défaut rencontré à l'usage ajoute ou
met à jour une ligne ici (skill `solstice-livrer`). Au catalogue, la ligne prend le
préfixe de sa section (celui des lignes qui s'y trouvent déjà, D, T, I, ME…) et le
numéro qui suit le plus haut de ce préfixe ; un numéro retiré ne se réutilise pas.
Dans une appli assemblée, elle s'écrit dans la section du domaine avec un numéro
`X` à part, hors de la série du préfixe de section (X1, X2…) : un `D14` pris chez
elle entrerait en collision avec le `D14` que le catalogue écrira un jour. La
retouche du fichier venu du catalogue se note dans `ADAPTATIONS.md`, et la leçon
remonte par ce circuit : le catalogue la reprend sous son propre numéro, l'appli
garde sa ligne `X` telle quelle. Une ligne neuve donne la
règle, le cas, et ce qui la tient (« **Non tenue** » tant que rien ne la tient).
Au catalogue, ces renvois nommés sont verrouillés par un test ; une appli
assemblée ne l'a pas. Certaines lignes renvoient à l'outillage du catalogue (assemblage, mise à jour,
skill de création d'appli), absent d'une appli : le renvoi n'y mène nulle part.

**Compteur** : 190 cicatrices, dont 134 tenues, 6 « En partie » et 50 « Non tenue ».
Ce sont les seuls chiffres à citer : ils comptent les lignes du tableau du catalogue,
tenues par le catalogue (une appli qui n'a pas gardé une brique n'en tient pas
autant). Le catalogue les vérifie par un test, qu'une appli assemblée ne reçoit pas.
La mise à jour de la phrase vaut au catalogue, à chaque ligne ajoutée, retirée ou
changée de statut ; une appli assemblée n'y touche pas, et ses lignes `X…` n'y sont
pas comptées.

## 1. Données et migrations

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| D1 | Un `CREATE TABLE` fusionné ne se retouche plus. Une colonne ajoutée après coup naît dans une étape de migration, et son index dans la même étape. | Un index posé dans le schéma initial visait une colonne née en migration. Sur une base ancienne, le schéma passe avant les migrations : l'initialisation a échoué et toute l'application est tombée. | `CLAUDE.md` « Un `CREATE TABLE` fusionné » ; `solstice-donnees` (« Un `CREATE TABLE` fusionné », « L'index d'une colonne ajoutée ») ; agent `relecteur-migrations` (« Un index sur une colonne ajoutée ») ; `tests/migrations.test.ts` « livrent les colonnes nées en migration », au catalogue (son cas vise la table du patron, qu'une appli neuve n'a pas) |
| D2 | Une étape de migration est idempotente, ajoutée en fin de liste, rejouée à chaque démarrage, sans table de suivi. | Sur un projet antérieur, une fonction de migration unique avait enflé jusqu'à près de 700 lignes. L'idempotence, elle, a traversé tous les incidents, quand une table de suivi aurait été un état de plus qui peut mentir. | `src/lib/db/migrations.ts` « Sémantique héritée d'un projet » ; `tests/migrations.test.ts` « se rejouent deux fois sans erreur » ; `relecteur-migrations` |
| D3 | Un échec d'initialisation de la base ne se garde jamais en mémoire : la requête suivante retente. | Une promesse d'initialisation rejetée restait mémorisée : après un incident passager de la base, toutes les requêtes échouaient jusqu'au redémarrage. | `src/lib/db/client.ts` « IMPORTANT : on ne met JAMAIS en cache » ; `tests/client-pool.test.ts` « ne met pas en cache l'échec de l'initialisation » (une migration qui lève une fois, la requête suivante retente et réussit), « ne met pas en cache l'échec d'une » (variable absente) ; `solstice-donnees` (« requête qui lève si elle manque. ») |
| D4 | Le SQL se relit tel qu'il part, pas tel qu'il s'écrit dans le code. | Une expression régulière écrite dans une chaîne a perdu son antislash : la base a reçu `'s+'` au lieu de `'\s+'`, et un index d'unicité était faux en production. | `solstice-donnees` (« Échappements : un `'\s+'` écrit ») ; `relecteur-migrations` (« Échappements : une expression ») |
| D5 | Aucune donnée de référence (comptes, rôles, catégories) n'est semée par une étape rejouée. | Une catégorie supprimée par un administrateur réapparaissait à chaque redémarrage, recréée par le semis. | `solstice-donnees` (« Pas de donnée de référence ») ; `relecteur-migrations` (« Pas de donnée de référence ») |
| D6 | Un semis « si la table est vide » ne rattrape pas une table ajoutée ensuite. | La table de chiffre d'affaires d'un mode démonstration, ajoutée après le premier semis, est restée vide en production. | `solstice-donnees` (« ne rattrape pas une table ajoutée ensuite ») |
| D7 | Une suppression en cascade se juge sur tout ce qu'elle emporte : lister chaque table qui référence la ligne. | La fusion de deux fiches de contact a détruit leurs documents joints, liés par une clé étrangère en cascade. | `solstice-donnees` (« Une suppression en cascade se vérifie ») ; `relecteur-migrations` (« Une suppression de colonne ou de table ») ; suppressions refusées par la base, par exemple `tests/migrations.test.ts` « livrent les lots d'import avec la suppression » |
| D8 | Un index unique ne se pose pas sur une table qui contient déjà des doublons : l'étape les cherche, n'écrit rien et les signale. | Relevé dans une appli livrée, avant tout incident : posé sur une table de production qui en contenait, l'index aurait fait échouer chaque démarrage. | `solstice-donnees` (« Un index UNIQUE ne se pose ») ; `relecteur-migrations` (« posé sur une table qui peut déjà contenir des doublons ») |
| D9 | Deux valeurs vides ne se heurtent pas dans un index unique : `NULLS NOT DISTINCT`, ou deux index partiels avant PostgreSQL 15. | Dans un arbre de catégories, deux racines de même nom (parent vide) ne se heurtaient pas dans l'index d'unicité : il a fallu deux index partiels. | `solstice-donnees` (« Une clé unique sur une colonne », schéma : une clé unique sur une colonne qui peut rester vide) |
| D10 | Tout statut que le code peut écrire est admis par la contrainte de la base, et la base n'en admet pas d'autre. | Le code écrivait un verdict que la contrainte `CHECK` de sa table refusait : relevé à la lecture du code, toute écriture de ce verdict devait échouer. | `solstice-donnees` (« Les statuts que le code écrit ») ; `relecteur-migrations` (« que le code écrit : la contrainte `CHECK` de la base l'admet-elle ») ; pour la brique validation, `tests/validation.test.ts` « tout statut que le code peut écrire » (seul test : la règle générale se tient par la relecture) |
| D11 | Une valeur dérivée se recalcule côté serveur après l'écriture, jamais lue depuis le formulaire. | Un montant affiché en lecture seule était quand même renvoyé par le formulaire : sa valeur périmée écrasait la somme des montants mensuels. | `solstice-donnees` (« Un champ dérivé ne se lit jamais depuis ») |
| D12 | Un rattrapage de données n'invente rien. | Des fiches anciennes sans créateur connu sont restées sans créateur, plutôt que d'en recevoir un choisi au hasard. | `solstice-donnees` (« une migration de données rattrape l'existant ») |
| D13 | Les tests tournent sur le même moteur de base, à la même version, que la production. | Le tri des valeurs vides différait entre deux moteurs de base ; il a fallu un ordre explicite (`NULLS LAST`). | `solstice-nouvelle-appli` (`socle.md` « Postgres jetable de la même version ») ; `tests/deploiement.test.ts` « aligne la version de Postgres sur celle » |
| D14 | Une connexion à la base sans SSL est refusée en production vers un hôte distant, dès la première requête, avec un message qui dit quoi faire. | Relevé à l'audit du 2026-11-09, avant tout incident : un fichier de réglages local recopié chez l'hébergeur aurait fait circuler le mot de passe et les données en clair, sans une ligne au journal. | `tests/client-ssl.test.ts` « refuse en production vers un hôte », « refuse aussi une liste d'hôtes », « refuse aussi sslmode=disable écrit » ; `src/lib/db/client.ts` « Le refus lève ici, à la première » |
| D15 | Les bornes d'une saisie se contrôlent avant la requête : la base ne lève jamais à la place d'un message (montant, date, longueur de texte, identifiant d'URL). | Constaté à l'audit du 2026-11-09 : un montant géant, une date impossible (« 2026-06-31 ») ou un identifiant d'URL hors plage donnaient la page d'erreur au lieu d'un message. | `tests/dossiers-bornes.test.ts` « refuse un montant au-delà de l'INTEGER », « refuse un montant énorme sans lever » (montant), « refuse une date absente du calendrier » (date), « accepte des champs à leur longueur » (longueur), « la fiche d'un id numérique trop » (identifiant d'URL) ; `solstice-donnees` (« Les bornes font partie du patron ») |

## 2. Tests et bases locales

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| T1 | Les tests refusent toute base hors de la machine locale. | Le fichier d'environnement local portait l'adresse de la base de production, et seule une consigne empêchait les tests d'y écrire. | `vitest.config.ts` « GARDE ANTI-PROD (décision du cadrage » ; `CLAUDE.md` « Les tests exigent une base » |
| T2 | Les tests refusent une base dont le nom ne finit pas par `_test` ou `_test_<n>`. | Un `npm test` lancé sur la base de développement, locale elle aussi, a effacé le compte administrateur. | `vitest.config.ts` « Localhost ne suffit pas : la base » ; `tests/bases-locales.test.ts` « refuse une base de dev, une base » ; `CLAUDE.md` « Il refuse aussi une base dont le nom » |
| T3 | Deux fichiers de tests qui tournent en même temps ne visent jamais la même base : chaque worker a la sienne. | Deux fichiers en parallèle jouaient deux migrations en même temps sur la même base : suite instable, toujours verte en série. La série, elle, durait 6 min 30 sur un poste à 4 cœurs. | `vitest.config.ts` « Fichiers en parallèle, une base » ; `tests/bases-des-workers.ts` ; `tests/bases-locales.test.ts` « donne à chaque worker de vitest » |
| T4 | La base visée par une commande de données se choisit à l'invocation, et le script la nomme en première ligne. Aucun script npm ne fige le fichier d'environnement. | Le fichier d'environnement local d'un projet antérieur portait l'adresse de la production : une commande qui le lit d'office vise la production sans le dire. | `CLAUDE.md` « la prod. La base se choisit explicitement » ; `solstice-donnees` (« La base se choisit par `--env-file=…` ») ; `tests/cli-base-visee.test.ts` « verrou : chaque script de données » |
| T5 | Un test-verrou prouve sa propre sensibilité sur un cas fautif. | Un test des gardes d'accès qui ne trouvait aucun fichier à lire passait au vert. | `solstice-livrer` (« Une règle d'architecture qui ne tient ») ; `tests/gardes-acces.test.ts` « voit les fichiers qu'il doit voir », « attrape une page sans garde, un garde » ; `tests/comptes-proxy.test.ts` « trouve les routes de l'appli (sans » |
| T6 | Ce que la base ou le navigateur fait (requête SQL, conservation dans le stockage, attributs d'un cookie) se teste, pas seulement le calcul pur qui l'entoure. | Constaté à l'audit du 2026-11-09 : la requête d'une brique, le module qui garde la vue d'un tableau et les attributs du cookie de session n'avaient aucun test ; seul leur calcul pur en avait un. | `tests/calendrier-requete.test.ts` « brique calendrier : lecture des événements d'un mois » ; `tests/vue-tableau.test.ts` « vue d'un Tableau : tri, filtres et déplis gardés à la navigation » ; `tests/comptes-session.test.ts` « pose le cookie de production en __Host- » |

## 3. Import de fichiers

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| I1 | Une date ambiguë se lit selon le format réglé pour la source, jamais devinée. | Un import réel a lu jour et mois à l'envers. | `tests/import-lot-dates.test.ts` « une date ambiguë se lit selon le format » |
| I2 | Une colonne qui contient déjà le total est lue telle quelle, jamais recalculée. | Une colonne d'engagement d'un réseau social contenait déjà le total ; le recalculer divergeait de la source. | `tests/import-lot-validation.test.ts` « une colonne qui contient déjà le total » |
| I3 | Une ligne mal typée ou sans clé est écartée avec son numéro, jamais perdue en silence. | Deux formats d'import d'une même appli traitaient chacun à sa façon une ligne mal typée ; la règle commune retenue : jamais perdue en silence. | `tests/import-lot-validation.test.ts` « une ligne mal typée est écartée » |
| I4 | Un fichier se reconnaît à son contenu, pas à son extension. | Les exports d'un réseau social arrivaient en `.xls` ou en `.xlsx`, sans que l'extension dise lequel lire : il a fallu reconnaître le format au contenu. | `tests/import-lot.test.ts` « un fichier se reconnaît à son contenu, pas à son nom » |
| I5 | Un lot de plusieurs centaines de lignes se confirme sans erreur. | Au-delà d'environ 90 lignes, la confirmation tombait sur une erreur brute : le formulaire dépassait la limite de champs du framework. | `tests/import-lot.test.ts` « un lot de plusieurs centaines de lignes se confirme » |
| I6 | Un échec au milieu d'une confirmation ne laisse aucun état partiel. | Avec l'erreur de I5, une confirmation interrompue pouvait laisser le lot à moitié écrit : elle est devenue une seule transaction. | `tests/import-lot.test.ts` « un échec au milieu de la confirmation » |
| I7 | Tout le fichier est validé avant la première écriture. | Règle des imports de grand livre et d'absences d'un projet antérieur : un fichier lu à moitié n'écrit rien. | `tests/import-lot.test.ts` « créer un lot n'écrit rien dans l'entité » |
| I8 | Confirmer deux fois le même lot ne crée rien et ne plante pas. | Une page périmée soumise deux fois fabriquait un élément vierge et une erreur d'intégrité. | `tests/import-lot.test.ts` « confirmer deux fois le même lot » |
| I9 | Supprimer un lot ne touche aucune ligne d'un autre lot. | Supprimer un lot marqué « doublon » effaçait les données d'un autre lot ; la couverture repassait à « manquant » et le rapport mensuel devenait faux. | `tests/import-lot.test.ts` « supprimer un lot ne touche aucune » |
| I10 | Un réimport met à jour en place et garde la trace du lot précédent. | Pour qu'un lot puisse s'afficher « doublon », un réimport devait garder la trace du lot précédent au lieu de la remplacer. | `tests/import-lot.test.ts` « un réimport met à jour en place » |
| I11 | Un champ de décision vide bloque la confirmation, jamais rempli par défaut. | Une case « payant / non payant » laissée vide ne devait jamais devenir « non payant ». | `tests/import-lot.test.ts` « un champ de décision vide bloque » |
| I12 | Un identifiant à zéros de tête reste du texte. | Un export réenregistré par un tableur perdait les zéros de tête des matricules. | `solstice-donnees` (« Un identifiant à zéros de tête ») ; `tests/import-lot-lecture.test.ts` « un identifiant à zéros de tête » ; `tests/import-lot-validation.test.ts` « un identifiant à zéros de tête » |
| I13 | Une date devenue nombre de série par un tableur se relit comme une date. | Le même tableur convertissait les dates écrites en texte en nombres. | `solstice-donnees` (« Une date peut arriver en nombre ») ; `tests/import-lot-dates.test.ts` « une date devenue nombre de série » |
| I14 | Une cellule de date vide devient une date absente ; la ligne n'est pas rejetée. | Une chaîne vide dans une colonne de date faisait rejeter toute la ligne. | `solstice-donnees` (« Une chaîne vide dans une colonne ») ; `tests/import-lot-dates.test.ts` « une cellule de date vide est absente, pas illisible » |
| I15 | Les clés de rapprochement se normalisent (casse, espaces). | « AB13 » et « AB 13 » donnaient deux lignes au lieu d'une à chaque resynchronisation. | `solstice-donnees` (« Normaliser casse et espaces ») |
| I16 | Deux clés que la normalisation rapproche sont fusionnées avant l'écriture. | Deux adresses qui ne différaient que par une barre oblique finale sont entrées en collision de clé primaire : un lot de six mois a été perdu. | `tests/import-lot-validation.test.ts` « deux clés que la normalisation » ; `tests/import-lot.test.ts` « deux clés que la normalisation » |
| I17 | Une ligne qui renvoie à une autre du même lot s'écrit après elle. | Un renvoi inséré avant son original violait une clé étrangère sur la même table : la table est restée vide depuis le début. | `tests/import-lot-validation.test.ts` « une ligne qui renvoie à une autre » ; `tests/import-lot.test.ts` « une ligne qui renvoie à une autre » |
| I18 | Sans clé de dédoublonnage, deux lignes identiques sont deux lignes. | Dans un export de paie, deux lignes identiques étaient deux demi-journées ; les fondre en perdait une. | `tests/import-lot-validation.test.ts` « sans clé de dédoublonnage, deux » |
| I19 | Un import qui remplace une période lit tout ou rien, et n'efface qu'une fois tout prêt. | L'import mensuel des absences effaçait puis réécrivait le mois : il doit avoir lu tout le fichier avant d'effacer. | `tests/import-lot.test.ts` « mode remplacement : la période » |
| I20 | Un lot sans ligne retenue ne se confirme pas, il s'ignore ; « en attente » prime sur « décidé ». | Un lot entièrement ignoré s'affichait « confirmé ». | `tests/import-lot.test.ts` « un lot sans aucune ligne retenue » ; `tests/validation-cycle.test.ts` « prime : un groupe où il reste une proposition à décider », « un groupe entièrement refusé finit » |
| I21 | Un montant illisible est refusé : la ligne est écartée avec son motif, jamais absorbée. | Un coût dont le montant ne se lisait pas était absorbé en silence : un coût faux. | `src/briques/import-lot/validation.ts` « milliers. Tout le reste est refusé » ; `tests/import-lot-validation.test.ts` « un nombre ambigu entre virgule » (nombre ambigu refusé) |
| I22 | Deux lignes de même clé dans un import se somment ou se rejettent, jamais l'une n'écrase l'autre. | Une collision de codes a écrasé en silence plusieurs centaines de milliers d'euros de chiffre d'affaires. | `tests/import-lot-validation.test.ts` « deux clés que la normalisation » (deux clés rapprochées sont fusionnées : le plein se garde, le conflit part au rapport, rien ne s'écrase en silence) ; `solstice-donnees` (« Collision de clés d'upsert ») |
| I23 | Un import se réconcilie sur les totaux métier, pas sur le nombre de lignes. | Environ 150 lignes d'écart sur 4 500, pour un total de jours intact : un dédoublonnage normal. | `solstice-donnees` (« Réconcilier les TOTAUX métier, pas le nombre ») |
| I24 | Les pièces jointes du système source se téléchargent avant de planifier l'import. | Les adresses des pièces jointes d'un outil source expiraient avant l'import. | `solstice-donnees` (« Les URLs de pièces jointes ») |
| I25 | Un import en production attend le déploiement de la migration qui crée ses colonnes. | Vécu en production : un import visait des colonnes que la migration n'avait pas encore créées. | `solstice-donnees` (« L'import prod se fait APRÈS ») |
| I26 | Un script de données tourne à blanc par défaut ; l'écriture se demande à la main, par un humain, après relecture du rapport. Une valeur pleine ne se dégrade jamais. | Les rattrapages de commissions, les colonnes ajoutées après coup et la casse des noms de comptes se sont corrigés par script en production. | `scripts/lib/cli.ts` « DRY-RUN PAR DÉFAUT : un script » ; `CLAUDE.md` « Scripts de données » ; garde `--confirmer` (`.claude/hooks/gardes.mjs` « if (!LECTEURS.has(o) && a.some((x) => x === "--confirmer" ») ; `tests/import-fusion.test.ts` « ne dégrade JAMAIS une valeur pleine » |
| I27 | Un classeur téléversé se borne aussi une fois décompressé, en comptant le flux réel, toutes entrées et toutes feuilles comprises. | Relevé à l'audit du 2026-11-09, avant tout incident : seul le fichier envoyé, donc compressé, était borné ; un classeur de quelques mégaoctets peut contenir des gigaoctets de XML répétitif, que la bibliothèque de lecture charge en mémoire dans un process partagé par toute l'appli. | `tests/import-lot-lecture.test.ts` « un classeur qui dépasse la borne », « la borne tient quand le fichier » ; `src/briques/import-lot/lecture.ts` « (audit du 2026-11-09). OCTETS_DECOMPRESSES_MAX » |
| I28 | Un script de données se lance depuis le dossier de l'appli : `--env-file` lit le fichier du dossier courant. | Essai du 2026-10-21 : un script lancé avec `--confirmer` depuis un autre dossier a lu un autre fichier de réglages, n'a signalé aucune erreur, et la base de l'appli est restée vide. | `solstice-donnees` (« `--env-file` lit le fichier du dossier ») ; `creer-appli` (« À l'essai du 2026-10-21, un script ») |

## 4. Sources externes et synchronisations

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| S1 | La référence d'un événement partagé entre plusieurs fiches inclut la fiche. | Une réunion à plusieurs contacts n'apparaissait que sur une fiche : l'unicité (source, référence) ignorait la fiche et avalait le doublon en silence. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S2 | Une lecture de source est bornée à la source, puis refiltrée à l'écriture. | Une invitation récurrente sans date de fin a produit plus de 1 200 lignes. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S3 | Un webhook répond d'abord, traite ensuite, avec une file persistante en filet. | La messagerie exigeait une réponse en 3 secondes ; le modèle d'IA en prenait 5 à 20. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S4 | La source qui fait foi est l'export complet, pas sa projection dans un message. | Des personnes absentes à leur rendez-vous, relayées par un message de chat, ont été importées comme prospects vivants. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S5 | Un événement se date du jour où il a eu lieu. | Un appel daté du rendez-vous futur qu'il fixait sortait le contact des relances. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S6 | On ne dédoublonne qu'en sachant ce que la répétition représente : la clé dépend de l'usage. | Une même source se dédoublonnait par adresse seule pour les fiches, par adresse et date pour l'entonnoir. | `src/briques/import-lot/branchement.ts` « Champs qui identifient une ligne. » : la clé est un réglage du branchement d'import, et sans clé rien n'est fusionné (I18) ; `src/briques/import-lot/README.md` « Deux lignes identiques : une appli livrée les refuse » |
| S7 | Un vrai zéro se distingue d'une mesure absente, et la fraîcheur d'une synchronisation ne compte que les passes réussies. | Règles des synchronisations quotidiennes d'un projet antérieur (audience d'un site, campagnes d'e-mailing) ; les archives ne détaillent pas l'incident. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S8 | Les ouvertures par les passerelles de sécurité des messageries ne sont pas des lectures. | Les robots qui ouvrent chaque lien d'un e-mail étaient comptés comme lecteurs ; la règle a dû être reconstituée, faute de règle publique. | **Non tenue** (attend une brique : synchronisation de sources externes) |
| S9 | Un script hébergé dans un autre environnement recopie ses règles à la main et signale une adresse périmée. | Une adresse périmée dans un script hébergé chez un tiers a arrêté toutes ses tâches, sans message. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |

## 5. Rapprochement d'identité

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| R1 | Une identité d'un seul mot n'apparie rien ; une coquille et un préfixe sont deux règles distinctes, et plusieurs candidats donnent un choix humain, jamais une création. | Une fiche réduite à un prénom avait agrégé neuf adresses de neuf sociétés. | **Non tenue** (attend une brique : rapprochement d'identité) |
| R2 | Une fiche « fourre-tout » est exclue de l'enrichissement automatique. | L'enrichissement a rempli la fiche fourre-tout avec les données d'autres sociétés. | **Non tenue** (attend une brique : rapprochement d'identité) |

## 6. Circuit de validation

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| V1 | Un refus garde la clé : une nouvelle lecture de la source ne ressuscite pas la proposition. | Un rejet libérait la clé de dédoublonnage, et le passage suivant recréait la carte refusée. | `tests/validation.test.ts` « un refus ne libère pas la clé : » |
| V2 | Lever un refus est un geste humain, qui rafraîchit le contenu. | Même cas : un refus ne doit revenir ni tout seul, ni avec un contenu périmé. | `tests/validation.test.ts` « lever un refus est un geste humain » |
| V3 | Accepter une proposition ancienne revérifie l'appariement. | Une suggestion « nouveau contact » restée longtemps en attente a recréé un doublon. | `tests/validation.test.ts` « accepter une proposition ancienne » |
| V4 | Décider deux fois la même proposition ne fait rien de plus. | Une page périmée soumise deux fois (même cas que I8). | `tests/validation.test.ts` « décider deux fois la même proposition » |
| V5 | Deux décisions simultanées n'appliquent qu'une fois. | Une demande d'autorisation de nouvelle version ne devait produire qu'un dépôt. | `tests/validation.test.ts` « une demande ne produit qu'un dépôt » |
| V6 | Une décision exige un décideur identifié, jamais un lien à jeton ; qu'il vienne d'une session est l'engagement du garde de l'appli. | Le même circuit n'acceptait de décision qu'avec une session, jamais depuis un lien à jeton. | `tests/validation.test.ts` « une décision exige un décideur » |
| V7 | Une décision vide bloque, jamais prise par défaut. | Même cas que I11. | `tests/validation.test.ts` « une décision vide bloque, jamais prise » |
| V8 | Un statut inconnu s'affiche comme tel, avec sa valeur, jamais comme un état sain. | Sur l'écran de règlement des factures d'un projet antérieur, un statut que l'écran ne savait pas lire ne devait jamais passer pour « tout va bien ». | `solstice-ui` (« Un statut inconnu ne s'affiche ») ; `tests/validation-cycle.test.ts` « un statut inconnu s'affiche comme tel, avec sa valeur » |
| V9 | Un état « en cours » expire, après un délai plus long que celui du traitement. | Une demande restée « en cours » a verrouillé son auteur pour toujours ; la péremption a été fixée à 30 minutes pour un traitement abandonné à 25. | **Non tenue** (attend une brique : demande à confirmation et agent) |
| V10 | La vérification d'arrêt se place dans l'étape irréversible ; une réponse illisible ne vaut pas annulation. | Pour un agent qui publiait du code, l'arrêt demandé se vérifiait avant l'étape de publication, pas dans celle-ci. | **Non tenue** (attend une brique : demande à confirmation et agent) |
| V11 | Un agent n'annonce jamais lui-même son succès : la conclusion s'écrit après les vérifications. | Règle d'un agent autonome de développement : sa conclusion s'écrit après les vérifications, pas par lui. | **Non tenue** (attend une brique : demande à confirmation et agent) |
| V12 | Une matrice de droits se teste par comportement, pas par lecture du code source. | Une matrice rôle × motif de blocage n'était testée qu'en lisant le source, et ses textes étaient dupliqués entre client et serveur. | `tests/roles.test.ts` « donne une action à un rôle si et seulement si » (la matrice des droits du catalogue, testée par comportement) ; `solstice-livrer` (« Tester par l'interface publique, pas par l'intérieur. ») |

## 7. Documents sortants et facturation

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| F1 | Un brouillon est une photo : sa péremption se détecte et se met à jour par un geste explicite, jamais par un recalcul silencieux. | Des temps saisis après la préparation d'une facture n'entraient pas dans son brouillon. | **Non tenue** (attend une brique : documents sortants et facturation) |
| F2 | Un état « envoyé sans facture » bloque une nouvelle préparation. | Sans ce blocage, une même période était facturée deux fois. | **Non tenue** (attend une brique : documents sortants et facturation) |
| F3 | Un seul brouillon ouvert par (client, période). | Un client avec une affaire mensuelle et une trimestrielle avait deux brouillons sur le même mois. | **Non tenue** (attend une brique : documents sortants et facturation) |
| F4 | Le système externe d'abord, la base ensuite. | Règle de l'envoi des factures vers un logiciel de facturation ; les archives ne détaillent pas l'incident. | **Non tenue** (attend une brique : documents sortants et facturation) |
| F5 | Une pièce se rapproche d'une ligne par son libellé ; la date ne départage que l'année. | Rapprochée par sa date d'émission, une facture de juin a basculé en juillet. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| F6 | Une référence valable sur une période porte cette période ; une fin ouverte est interdite. | La référence de bon de commande portée par l'affaire, périmée au trimestre suivant, est partie sur la facture. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| F7 | Un délai de paiement se calcule par sa règle complète ; un délai absent vaut zéro, et une date de règlement absente le reste. | « 30 jours fin de mois le 15 » vaut 49 jours, pas 30. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |

## 8. Calcul métier

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| C1 | Deux séries (prévu et acquis) ne s'additionnent jamais en silence, et un statut qu'aucune série ne classe fait échouer un test. | Un calendrier de chiffre d'affaires filtrait deux fois sur les statuts acquis et masquait des répartitions. | **En partie** : `tests/validation-cycle.test.ts` « chaque statut connu a un libellé » (chaque statut connu a un libellé et un ton) |
| C2 | Une grandeur ne se prend qu'à une source. | Le chiffre d'affaires du compte de résultat devait être le chiffre calendarisé, pas le comptable, sous peine d'être compté deux fois. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C3 | Un élément non classé se signale, il ne disparaît pas. | Un compte comptable sans classification disparaissait du compte de résultat. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C4 | Un ratio ne se calcule qu'entre deux séries toutes deux terminées. | Sur le mois en cours, le chiffre d'affaires était complet et les jours travaillés partiels : la productivité sortait faussement haute. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C5 | Un calcul jour par jour relit les périodes elles-mêmes, pas une date dérivée. | Les dates d'arrivée et de départ dérivées écrasaient les trous : une personne partie puis revenue a perçu une indemnité journalière pour chaque jour ouvré entre ses deux contrats. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C6 | Un montant se répartit sur la période qu'il couvre. | Un abonnement annuel divisé par la durée d'un contrat court gonflait les remboursements. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C7 | Un justificatif appartient à la saisie, pas à sa première ligne. | Une pièce posée sur la première ligne d'une saisie de plusieurs mois laissait les autres mois « sans pièce ». | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C8 | Un plafond de présences simultanées se vérifie jour par jour, pas aux bornes des périodes. | Règle d'un suivi d'équipe qui plafonnait le nombre de personnes d'un statut présentes en même temps. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| C9 | Une jointure qui peut ramener plusieurs lignes par clé se dédoublonne avant de sommer. | Relevé dans le code d'un projet antérieur, sans incident : deux affaires portant le même code projet auraient doublé les temps d'une facture. | `solstice-donnees` (« Une jointure qui peut ramener ») |
| C10 | Un taux ne se stocke pas : il se recalcule à l'affichage depuis ses deux termes. | Règle des tableaux d'audience d'un projet antérieur ; les archives ne détaillent pas l'incident. | `solstice-donnees` (« Un taux ne se stocke pas ») |

## 9. Accès et comptes

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| A1 | Chaque page, action serveur et route commence par sa garde : masquer un bouton ou une entrée de navigation ne protège rien. | Un bouton retiré de l'écran pour respecter une règle laissait son action serveur appelable sans l'écran. | `CLAUDE.md` « `exiger(action)` de `briques/comptes/roles.ts` » ; `src/briques/comptes/roles.ts` « Règle reprise d'un projet précédent » ; `tests/gardes-acces.test.ts` « ouvre chaque page, chaque action » |
| A2 | Tout est protégé par défaut ; les routes ouvertes sont une liste déclarée et vérifiée. | Deux applis livrées ont convergé vers cette forme : protection par défaut, et un test qui parcourt toutes les routes. | `tests/comptes-proxy.test.ts` « n'ouvre sans session que les routes » |
| A3 | Un seul fichier de proxy, jamais un `middleware.ts` à côté. | Les deux ensemble font planter Next.js sans message. | `tests/comptes-proxy.test.ts` « garde un seul fichier de proxy » (`src/proxy.ts` existe, aucun `middleware.*` à côté) ; commentaire de `src/briques/comptes/protection.ts` « de l'appli. Jamais un middleware.ts » |
| A4 | Un secret de signature vide ou court est refusé, et la signature se vérifie avant tout usage du jeton. | Règle reprise d'une appli livrée : un HMAC à clé vide se forge. | `tests/comptes-session.test.ts` « refuse un secret vide ou de moins » |
| A5 | Le chemin de retour après connexion est filtré, caractères de contrôle compris. | Un caractère de contrôle glissé dans le chemin de retour le faisait sortir de l'appli, vers un site tiers. | `tests/comptes-session.test.ts` « garde un chemin de l'appli, avec sa requête, sans son ancre » |
| A6 | La réponse à une demande de code n'attend pas l'envoi. | Le temps de réponse trahissait les adresses qui avaient un compte. | `tests/comptes-code-email.test.ts` « répond avant l'envoi, qui part » |
| A7 | Les limites de tentatives se comptent par adresse et par adresse IP. | Un tiers pouvait tenir une personne dehors une heure en épuisant le quota de son adresse. | `tests/comptes-code-email.test.ts` « ne laisse pas un tiers tenir une personne » |
| A8 | Les limites se comptent en base, sous verrou, jamais en mémoire. | Une limite d'essais tenue en mémoire ne valait qu'avec un seul processus. | `src/briques/comptes/code-email.ts` « les limites se comptent en base, par adresse » ; `tests/comptes-code-email.test.ts` « ne laisse passer qu'une demande parmi plusieurs simultanées : » |
| A9 | L'adresse IP du visiteur se lit dans le seul en-tête que pose l'hébergeur, jamais dans `X-Forwarded-For`. | La limite par adresse IP dépendait du proxy placé devant l'hébergeur ; elle est à revérifier à chaque changement d'hébergeur. | `tests/adresse-ip.test.ts` « ne se laisse pas changer par un en-tête », « ne donne aucune adresse en production quand » ; `solstice-nouvelle-appli` (`socle.md` « L'adresse IP du visiteur se lit »), avec la brique comptes ou contact |
| A10 | Le dernier administrateur actif ne se désactive ni ne se rétrograde, par l'écran ni par une action postée à la main. | Règle reprise d'une appli livrée, qui protège ensemble les deux portes (désactiver, rétrograder), lecture et comptage dans la même transaction. | `tests/comptes-administration.test.ts` « le dernier admin actif, protégé à deux portes » ; `tests/gestion-comptes.test.ts` « refusent de désactiver ou de rétrograder le dernier admin » |
| A11 | Le rôle n'est jamais dans le jeton de session : il se relit en base à chaque requête. | Règle reprise d'une appli livrée : un rôle porté par le jeton survivrait au retrait du droit jusqu'à la fin de la session. | `tests/comptes-session.test.ts` « relit le rôle en base à chaque requête » ; `tests/comptes-administration.test.ts` « agit à la requête suivante : le rôle se relit en base » |
| A12 | On désactive un compte, on ne le supprime pas. | Règle reprise d'une appli livrée : un compte désactivé perd l'accès, ses traces restent. | `tests/comptes-administration.test.ts` « désactiver, réactiver : on désactive un compte, on ne le supprime pas » ; `solstice-donnees` (« On désactive un compte ») |
| A13 | L'état d'une connexion par un fournisseur d'identité est lié au navigateur qui l'a lancée. | Sans ce lien, un tiers peut forcer la connexion de quelqu'un à son propre compte. | `tests/comptes-google.test.ts` « refuse un state qui n'est pas celui du départ », « refuse un retour sans cookie de parcours » ; `tests/comptes-microsoft.test.ts` « refuse un state qui n'est pas celui du départ », « refuse un retour sans cookie de parcours » |
| A14 | Un jeton de passage d'une appli à l'autre est à usage unique, et son mécanisme existe en un seul exemplaire. | Le même jeton signé entre applis existait en trois copies dans un même dépôt. | **Non tenue** (le catalogue n'a pas de jeton entre applis) |
| A15 | Un formulaire en deux temps n'a qu'un état, celui de la dernière réponse. | Deux états séparés laissaient l'erreur d'un ancien code de connexion à côté du nouveau. | `solstice-ui` (« Un formulaire en deux temps ») ; `src/briques/comptes/FormulaireCode.tsx` « est toujours celui de la DERNIÈRE » en est le modèle, sans test de composant : le dépôt n'en a pas l'outillage |
| A16 | Une page à ne pas indexer se ferme par `noindex` (balise ou en-tête `X-Robots-Tag`), que les moteurs doivent pouvoir lire : un `Disallow` les empêche de la lire. | Les liens à jeton donnés aux clients d'une appli livrée sont sortis des moteurs de recherche par `X-Robots-Tag`, sans `Disallow` ; le catalogue fermait lui aussi par un `Disallow` global, qui empêchait de lire le `noindex`. | `tests/referencement-proxy.test.ts` « pose noindex sur toute réponse » (toute réponse que voit le proxy, pour un site fermé, porte `noindex`, pages ouvertes sans connexion comprises ; les fichiers statiques de Next n'y passent pas), « laisse robots.txt lisible : un site » (`robots.txt` n'interdit rien) ; `tests/referencement.test.ts` « la racine pose noindex, nofollow » (balise sur la racine) ; `src/proxy.ts` « function fermeeAuxMoteurs(reponse: » ; `src/lib/referencement.ts` « export function reglesRobots(config: » ; `solstice-nouvelle-appli` (`socle.md` « Référencement fermé par défaut ») |
| A17 | Un contenu déposé par un utilisateur s'affiche dans une iframe isolée (`sandbox` sans `allow-same-origin`), derrière un jeton non devinable. | Les présentations HTML déposées dans une appli livrée s'affichaient ainsi, lien public compris. | **Non tenue** (le catalogue n'affiche aucun contenu déposé) |
| A18 | Une session sans visite pendant un délai se ferme : chaque visite repousse l'échéance, dans la limite d'une durée maximale. | Relevé à l'audit du 2026-11-09, avant tout incident : un cookie volé aurait valu trente jours de droits d'administrateur, la session n'expirant jamais à l'inactivité. | `tests/comptes-session.test.ts` « ferme une session restée sans visite » ; `src/briques/comptes/session.ts` « cookie volé valait 30 jours de droits » |
| A19 | Une action sensible (changer un rôle, inviter, effacer les données d'une personne) exige une connexion récente, et dit de se reconnecter. | Relevé à l'audit du 2026-11-09, avant tout incident : un cookie volé aurait suffi à changer un rôle, à inviter sa propre adresse en administrateur ou à effacer une personne. | `tests/gestion-comptes.test.ts` « refusent un changement de rôle », « refusent une invitation sans connexion » ; `tests/rgpd-routes.test.ts` « refuse l'aperçu et l'effacement » ; `src/app/comptes/actions.ts` « elle demande une connexion récente, sans quoi un cookie volé invitait sa » |
| A20 | Le cookie de session de production est `__Host-`, HttpOnly, Secure, SameSite=Lax, sans domaine, et se retire avec les mêmes attributs ; ces attributs se testent. | Constaté à l'audit du 2026-11-09 : rien ne vérifiait ces attributs, alors qu'un navigateur refuse un cookie `__Host-` posé sans Secure. | `tests/comptes-session.test.ts` « pose le cookie de production en __Host-, HttpOnly, Secure, SameSite=Lax » ; `tests/aide-cookies.ts` « export const attributsDesCookiesDeTest » |
| A21 | Sans adresse lisible en production, les requêtes se comptent ensemble, sur une adresse partagée, aux limites par réseau ; la connexion refuse de démarrer sans la variable qui nomme l'en-tête du proxy (voir A9). | Relevé à l'audit du 2026-11-09, avant tout incident : un en-tête de proxy mal réglé aurait fait sauter la limite par adresse ; un tiers aurait pu invalider chaque code reçu par une adresse visée (trois saisies fausses par minute) et savoir qui demandait un code. | `tests/adresse-ip.test.ts` « ne donne aucune adresse en production sans en-tête » ; `tests/comptes-code-email.test.ts` « sans adresse IP lisible en production, compte la demande », « sans adresse IP lisible en production, compte les saisies » ; `tests/comptes-proxy.test.ts` « refuse de servir quoi que ce soit en production sans IP_EN_TETE_CLIENT » ; `src/lib/adresse-ip.ts` « limite, un tiers invalidait les codes » |
| A22 | Le plafond global des demandes de code se règle, ne se retire pas, protège le quota d'envoi, et se dit une fois au journal, sans donnée personnelle, quand il se remplit (voir A7 et M11). | Relevé à l'audit du 2026-11-09, avant tout incident : les limites par adresse ne bornent pas qui dispose de beaucoup d'IP, qui aurait pu faire partir autant de mails qu'il voulait au nom de l'appli (coût d'envoi, réputation de l'expéditeur) et remplir la table des demandes. | `tests/comptes-code-email.test.ts` « refuse une limite nulle, négative, non entière », « au plafond, répond comme à une adresse », « le dit au journal une fois, quand » ; `src/briques/comptes/methodes.ts` « 300 par heure : une appli interne » |
| A23 | Les pages de démonstration, sans garde par `exiger()`, répondent 404 en production. | Relevé à l'audit du 2026-11-09, avant tout incident : un cookie bien signé dont la session était révoquée ouvrait la vitrine du kit en production, avec le menu entier de l'appli. | `tests/comptes-proxy.test.ts` « ne sert pas la vitrine du kit en production » (404 en production), « sert la vitrine du kit hors production » (servie hors production) ; `src/briques/comptes/protection.ts` « l'appli (audit du 2026-11-09). » |

## 10. Données personnelles

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| P1 | Données réelles, exports, dumps et clés n'entrent jamais dans l'historique git. | Des données personnelles sont entrées dans l'historique d'un projet, coûteuses à purger. Un fichier retiré après coup reste lisible dans l'historique. | `.gitignore` « Données réelles — cicatrice d'un » ; `tests/gitignore.test.ts` « ignore les secrets, dumps, exports, clés et fichiers clients types » ; garde `git add -f` (`.claude/hooks/gardes.mjs` « if (git && gitAddForce(git)) ») |
| P2 | Une donnée sensible masquée l'est sur toutes ses facettes : libellé, famille, couleur, légende. | Un motif d'absence masqué restait trahi par la couleur de sa légende. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| P3 | Les gabarits de conformité (registre des traitements, trame de sous-traitance, hébergement dans l'Union européenne) sont prêts avant la mise en ligne. | Un hébergement a été déplacé d'une région américaine vers l'Union européenne après coup. | Gabarits de la brique rgpd (`src/briques/rgpd/gabarits/`) : registre des traitements, trame d'accord de sous-traitance, checklist d'hébergement dans l'UE ; hébergement tenu aussi par DP5 |
| P4 | La position sur l'envoi de données vers des services d'IA se documente par projet. | Point ouvert d'un projet antérieur qui envoyait des données à des modèles d'IA ; les archives ne détaillent pas d'incident. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| P5 | Une instance dont l'identité du client n'est pas connue n'accepte aucun membre réel avant que les mentions légales soient remplies : la règle s'écrit dans la fiche et dans le ticket des mentions. | Recette du 2026-11-06 : pour un client dont l'identité n'était pas encore connue, rien dans le code ne distinguait l'instance d'une mise en ligne publique, et « pas de membre réel avant les mentions » ne tenait que par écrit. | **En partie** : `solstice-nouvelle-appli` (« membre n'y entre » limite l'accès à l'équipe du projet par `COMPTES_PREMIER_ADMIN`, « écrit. La règle s'écrit donc » pose la question ouverte) ; le code ne bloque jamais sur des mentions incomplètes, et aucun test ne le dit |

## 11. Dates et fuseaux

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| H1 | La date du jour se calcule dans le fuseau du client et s'injecte ; jamais celle du serveur. | Le serveur tournait en UTC : vers minuit, sa date du jour divergeait de celle de Paris. | `tests/format.test.ts` « dans le fuseau du client autour de minuit » ; `solstice-ui` (« de fichier, à la mise en route ») |
| H2 | Deux instants se comparent avec une seule horloge, celle de la base. | Un décalage d'horloge entre un conteneur et le poste faussait « l'envoi précède la modification ». | **Non tenue** (attend une brique : évolution de la brique notifications) |

Les autres règles de date sont rangées avec leur calcul : F5, F6, F7, C4, C5.

## 12. Envoi de mails et rappels

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| M1 | Toute valeur insérée dans le HTML d'un mail est échappée. | Le nom d'un objet était inséré tel quel : un membre pouvait y glisser un lien. | `tests/mails.test.ts` « une valeur contenant <script> arrive » ; `tests/contact.test.ts` « échappe chaque valeur saisie dans le HTML » |
| M2 | L'échec d'envoi à une personne n'arrête ni les suivantes ni l'enregistrement. | Les alertes de changement de contenu d'une appli livrée partaient en direct, sans file d'attente : un échec pour une personne ne devait bloquer ni les autres ni l'enregistrement de la modification. | `tests/notifications.test.ts` « l'échec d'envoi à une personne » (l'échec d'envoi à une personne ne bloque ni les suivantes ni le reste du traitement), « une adresse absente ou vide est journalisée » (une adresse absente n'arrête pas la boucle) |
| M3 | Ne sont pas prévenus : l'auteur de la modification, les comptes inactifs, les désabonnés. | L'auteur d'une modification recevait l'alerte de sa propre modification. | **Non tenue** (attend une brique : évolution de la brique notifications) |
| M4 | « Le contenu a changé » se détecte en comparant avant et après dans la même requête. | Un simple renommage faisait avancer la date de mise à jour, sans que le contenu ait changé. | **Non tenue** (attend une brique : évolution de la brique notifications) |
| M5 | Le jeton de désabonnement est celui du destinataire, et la page répond pareil pour « déjà désabonné » et pour un jeton inconnu. | Règle du désabonnement d'une appli livrée, pour ne rien apprendre à qui essaie des jetons. | **Non tenue** (attend une brique : évolution de la brique notifications) |
| M6 | Une route d'envoi planifié exige un secret, a un mode à blanc et un mode essai vers une seule adresse, et journalise chaque envoi, introuvables et erreurs compris. | Le mode essai a été redemandé pour chaque rappel (saisie des temps, relances de fin de mois). | `tests/notifications-route.test.ts` « sans le bon secret (%s), la route » (sans le bon secret, 401 et rien n'est envoyé), « le mode à blanc, demandé dans le corps, répond » (mode à blanc), `tests/notifications.test.ts` « le mode essai n'écrit qu'à l'adresse » (le mode essai n'écrit qu'à l'adresse donnée), « le mode essai refuse une adresse » (il refuse une adresse hors de la liste permise) ; « chaque envoi, réussi ou non, laisse » (chaque envoi, réussi ou non, laisse une ligne au journal), « une adresse absente ou vide est journalisée » (une adresse absente ou vide est journalisée) |
| M7 | La tâche planifiée tourne souvent ; une fonction pure décide si c'est le jour d'envoi, et une seule boucle d'envoi sert à toutes les routes. | L'horaire d'un rappel hebdomadaire a été ajusté deux fois, et la boucle d'envoi était recopiée dans chaque route. | `tests/notifications-jour.test.ts` « le jour d'envoi est décidé par une fonction » (le jour d'envoi est décidé par une fonction pure) ; une seule boucle d'envoi, `src/briques/notifications/envoi.ts` « export async function envoyerNotifications », appelée par l'unique fabrique de route de la brique (`src/briques/notifications/route.ts` « export function routeNotifications(options: »), que l'appli monte sur chacune de ses routes ; la tâche planifiée et sa fréquence vivent dans l'appli (`src/briques/notifications/README.md` « ## La brancher ») |
| M8 | L'activation d'une tâche planifiée (secrets, autorisations, variables) se documente geste par geste. | Une tâche fusionnée n'a jamais tourné : il manquait des gestes manuels. | `src/briques/notifications/README.md` « Les gestes humains » (section La brancher, étape 5 : les gestes humains, secrets et variables chez l'hébergeur et chez GitHub) et « ## Avant le premier envoi réel » |
| M9 | Un rappel qui nomme des retardataires part en message privé. | Un rappel public aurait nommé les retardataires devant toute l'équipe. | **Non tenue** (attend une brique : évolution de la brique notifications) |
| M10 | « Oubli » et « jamais concerné » se séparent par une fenêtre d'historique. | Une personne qui n'avait jamais rien saisi noyait les vrais oublis. | **Non tenue** (attend une brique : évolution de la brique notifications) |
| M11 | Un plafond global sur un formulaire public borne l'envoi toutes adresses confondues, et se dit une fois au journal, sans donnée personnelle, quand il se remplit. | Relevé à l'audit du 2026-11-09, avant tout incident : un robot qui changerait d'adresse épuiserait le quota d'envoi (voir A22) ; un plafond rempli par quelques adresses, ou sans adresse lisible, ne le disait à personne. | `tests/contact.test.ts` « toutes adresses confondues (un robot qui change d'adresse », « le dit au journal une fois, quand » ; `src/briques/contact/filtres.ts` « sans que rien ne le dise (audit » |
| M12 | Le domaine d'envoi vérifié se demande au cadrage, avant la mise en ligne : sans lui, seule l'adresse du propriétaire du compte reçoit. | Recette du 2026-11-06 : la question n'a été posée qu'à la main, puis ramenée par la relecture de la blueprint. | `src/briques/mails/README.md` « Sinon, l'adresse du propriétaire du compte est la seule » ; `creer-appli` (« Cas d'origine : à la recette du 2026-11-06, la question ») |
| M13 | Un rappel planifié ne se prévoit pas sans l'adresse publique du site réel : la consigne « laisser vide » vise celle du service, pas celle du rappel. | Recette du 2026-11-06 : une blueprint prévoyait un rappel quotidien sans cette variable, et la relecture de blueprint l'a ramenée avant la mise en ligne. Sans elle, la CI serait restée verte, aucun rappel ne serait parti, et seule une annotation sur la page de l'exécution l'aurait dit. | **En partie** : `src/briques/notifications/README.md` « echo "::warning::Variable de dépôt », « echo "::warning::Secret NOTIFICATIONS_SECRET » (la tâche s'arrête sans échouer et pose l'annotation *rien n'est armé* sur la page de l'exécution) et « prévoyait un rappel quotidien sans cette variable » ; aucun test |

## 13. Fichiers joints

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| FI1 | Un fichier s'envoie par un Route Handler, pas par une action serveur. | Un fichier joint envoyé par une action serveur échouait sur « Unexpected end of form ». | `solstice-ui` (« Un fichier s'envoie par un Route Handler ») ; la brique import-lot reçoit le fichier par un Route Handler que l'appli pose (`src/briques/import-lot/envoi.ts`, `src/briques/import-lot/README.md` « ## La brancher ») |
| FI2 | La limite de taille annoncée est la limite réelle. | Une limite annoncée de 10 Mo, au-dessus du plafond réel de 3 Mo, produisait une erreur générique avant l'action. | **En partie** : `solstice-ui` (« La limite de taille annoncée ») ; brique import-lot, qui refuse au-delà de sa limite annoncée (`OCTETS_MAX` dans `src/briques/import-lot/lecture.ts`) ; la limite d'un proxy d'hébergeur reste à relever (`src/briques/import-lot/README.md` « ## Questions ouvertes ») |
| FI3 | Le nom d'un fichier téléchargé supporte tout caractère, apostrophe typographique comprise. | Une apostrophe typographique dans un nom de fichier faisait répondre une erreur 500 au téléchargement. | `solstice-ui` (« Le nom d'un fichier téléchargé ») ; le seul téléchargement du catalogue a un nom fixe (`src/briques/rgpd/export.ts` « attachment; filename= ») |

## 14. Interface et kit

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| U1 | Un tableau porte d'office le tri et les filtres, et les exports sur simple option. | Chaque tableau livré a fini par les recevoir : huit pull requests, six vagues de rattrapage. | `CLAUDE.md` « Un tableau se fait avec `Tableau` » ; `src/ui/Tableau.tsx` « LE tableau du kit : tri au clic » ; `tests/exports-tableau.test.ts` « export .xlsx du Tableau » |
| U2 | Un tableau hiérarchique ne se trie pas ; son filtre masque sans recalculer. | Un tri générique a été rejeté sur un compte de résultat, où il cassait la lecture comptable. | `tests/tableau-hierarchique.test.ts` « ne propose aucun tri d'en-tête » (aucun tri d'en-tête en mode hiérarchique) ; `src/ui/Tableau.tsx` « Mode hiérarchique : rend les sous-lignes » et `solstice-ui` (« Tout affichage tabulaire. Tri au clic sur l'en-tête ») |
| U3 | La vue d'un tableau (tri, filtres, déplis) survit à la navigation, le temps de l'onglet. | Sur un projet antérieur, les déplis survivaient même à la fermeture de l'onglet. | `tests/vue-tableau.test.ts` « retrouve, après une navigation », `src/ui/vueTableau.ts` « Stockage en sessionStorage — » et `CLAUDE.md` « Un tableau se fait avec `Tableau` » |
| U4 | Volets figés et détail au clic. | Un croisement personnes × périodes de temps passés a demandé l'un puis l'autre, jusqu'au détail d'une cellule. | **En partie** : clic sur une ligne (`src/ui/Tableau.tsx` « Rend la ligne cliquable (détail, drill-down) ») ; le clic par cellule attend un tableau croisé |
| U5 | Montants, dates et pourcentages passent par un seul module de format. | Deux écrans voisins affichaient « 12 500 € » et « 12,500.00 € ». | `src/lib/format.ts` « format, deux écrans voisins finissent » ; `solstice-ui` (« Tout montant, date ou pourcentage ») |
| U6 | Un pas de saisie ne refuse pas un montant légitime. | Un pas de 100 € refusait un reliquat de 3 334 €. | `solstice-ui` (« Un pas de saisie ne contraint ») ; aucun champ montant du catalogue n'a de pas, donc aucun test |
| U7 | La fiche d'un enregistrement est en lecture seule et montre exactement les champs du formulaire ; un seul formulaire sert à créer et à modifier. | Règle maison héritée d'un projet antérieur ; les archives ne détaillent pas l'incident. | `CLAUDE.md` « Un module métier se construit » ; `src/app/dossiers/[slug]/page.tsx` « La FICHE est en LECTURE SEULE » |
| U8 | Le slug d'une fiche n'est jamais purement numérique et n'entre pas en collision avec une route du module. | Règle reprise d'un projet antérieur avec son module de slugs : une fiche nommée « Nouveau » deviendrait inatteignable. | `tests/slug.test.ts` « ne produit JAMAIS un slug purement », « évite les segments statiques du module » |
| U9 | Une erreur de rendu n'est jamais une page blanche : le digest reste affiché, et l'écriture a souvent eu lieu malgré l'erreur. | Des pages blanches à digest cryptique en production, après des écritures bien passées. | `src/app/error.tsx` « Sans cette page, une erreur de rendu » et « La page n&apos;a pas pu s&apos;afficher. » (le message dit de vérifier l'enregistrement avant de recommencer) ; `solstice-ui` (« Pages d'erreur », « Une erreur de rendu n'annule pas l'écriture ») |
| U10 | Un champ qui se tape passe par le composant de la charte, qui pose la barre d'insertion : jamais un `<input>` stylé à la main. | Une appli en React livrée avec des champs nus : sans cadre et sans barre, ils étaient invisibles au repos. | `tests/champs-sans-cadre.test.ts` « src/ ne pose aucun input de saisie » ; `solstice-ui` (« Champs de formulaire avec label et aide, sans cadre ») |

## 15. IA et tâches longues

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| IA1 | Une réponse incomplète ou un signal absent est une erreur, jamais un verdict. | Une réponse tronquée par la limite de longueur se lisait « non pertinent », et le prospect était perdu ; ailleurs, des liens invisibles au lecteur rendaient une règle de contrôle conforme à tort. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA2 | Le plafond de dépense se vérifie avant chaque appel, avec un sous-plafond par tâche. | Un passage a dépensé 3,05 $ sur un plafond de 3 $. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA3 | Le modèle par défaut est le moins cher qui suffit, avec un budget par exécution. | 38 exécutions sur le modèle le plus cher ont coûté 57 $. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA4 | Changer de modèle revoit la grille de prix dans le même commit ; un modèle inconnu se compte au tarif le plus cher. | Sans cela, les coûts suivis étaient gonflés d'environ 50 %. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA5 | Une expiration de délai compte comme un échec. | Un délai dépassé n'incrémentait pas le compteur d'échecs : le même contact bloquait la file. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA6 | Chaque tentative se consigne, avec un délai avant la suivante. | Une fiche sans résultat revenait en tête jusqu'à 60 fois par nuit. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA7 | Une question posée aux données s'exécute en lecture seule imposée par la base, sous délai, et ne montre que ce que l'écran montre déjà à la même personne. | Règle d'un assistant qui répondait en interrogeant la base ; la sécurité venait du moteur, pas de la relecture du SQL. | **Non tenue** (attend une brique : IA et tâches longues) |
| IA8 | Une règle métier ajoutée au code se répercute dans les consignes du modèle. | Sinon l'assistant répondait faux là où le code répondait juste. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| IA9 | Une donnée lue par un modèle se relit par un humain, sur ses pièges connus. | Sur une facture, le client est le destinataire et non l'émetteur, et un avoir imprimé en positif se stocke en négatif. | **Non tenue** (relève du module métier de l'appli : la blueprint la porte au cadrage) |
| IA10 | Aucun état en mémoire pour ce qui doit survivre : une instance vaut un processus. | Un export long, suivi en mémoire, était perdu à chaque déploiement, et plusieurs processus auraient cassé son verrou. | `solstice-nouvelle-appli` (`socle.md` « Pas d'état en mémoire ») ; A8 |

## 16. Déploiement et hébergement

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| DP1 | La CI vérifie chaque pull request dès le premier jour. | 86 pull requests ont été fusionnées avant qu'une ligne ne soit compilée ailleurs que chez l'hébergeur. | `.github/workflows/ci.yml` « Lance les gardes de Claude, la vérification » |
| DP2 | Rien ne part en production sans la CI verte. | L'hébergeur déployait `main` sans attendre la CI. | `tests/deploiement.test.ts` « ne part qu'après le job de vérification », « coupe l'auto-déploiement : c'est » |
| DP3 | La sonde de santé répond sans session et donne le commit en ligne. | Placée derrière l'authentification, la sonde recevait une redirection et chaque déploiement échouait. | `tests/sante.test.ts` « passe le proxy sans redirection » ; `tests/deploiement.test.ts` « attend sur /sante que le commit » |
| DP4 | Jamais le palier gratuit de l'hébergeur pour la base. | La base gratuite est supprimée au bout de 30 jours. | `tests/deploiement.test.ts` « n'utilise jamais le palier gratuit » |
| DP5 | Service et base dans l'Union européenne dès le départ. | Une base a été migrée d'une région américaine vers l'Europe après coup : une migration de données en production. | `tests/deploiement.test.ts` « place le service ET la base à Francfort » |
| DP6 | Une variable ajoutée au fichier de l'hébergeur se déclare aussi dans son tableau de bord. | Les variables d'un service existant ne se resynchronisent pas depuis le fichier. | `render.yaml` « Render lit ce fichier à la CRÉATION » et `src/briques/deploiement/README.md` « tableau de bord : Render ne resynchronise » écrivent la règle ; `tests/deploiement.test.ts` « déclare chaque variable de .env.example, sauf » verrouille la déclaration de chaque variable. Aucun test ne voit le comportement de l'hébergeur (pas de resynchronisation des variables d'un service existant) : seuls ces deux textes le disent |
| DP7 | Un service se nomme avant sa création, jamais renommé ensuite. | Un service renommé dans le tableau de bord a quitté la synchronisation, sans message ; il est revenu en reprenant son nom. | `render.yaml` « Un service renommé dans le tableau » ; `solstice-nouvelle-appli` (`socle.md` « Un service renommé dans le tableau ») |
| DP8 | Les actions de CI s'épinglent par empreinte de commit, pas par étiquette. | Une montée de version flottante d'une action a changé ce que faisait la CI, sans aucun commit du dépôt. | `.github/workflows/ci.yml` « Actions épinglées par SHA complet » ; `solstice-nouvelle-appli` (`socle.md` « `permissions: contents: read`, actions ») |
| DP9 | Quand l'appli tourne en conteneur, la CI construit l'image. | Un binaire qui marchait en conteneur sur le poste a refusé de démarrer chez l'hébergeur. | `solstice-nouvelle-appli` (`socle.md` « Postgres jetable de la même version ») |
| DP10 | L'installation chez l'hébergeur se fait sans audit ni messages de financement (`--no-audit --no-fund`). | Leçon notée pour le fichier de l'hébergeur ; les archives ne détaillent pas l'incident. | `render.yaml` « le service ne garde que les dépendances » |
| DP11 | Une sauvegarde nocturne hors de l'hébergeur, avec un test de restauration, et la date d'expiration des clés notée. | Un projet antérieur sauvegardait chaque nuit vers un stockage objet et restaurait à l'essai vers une base jetable ; le catalogue n'a pas d'équivalent. | **Non tenue** (attend une brique : sauvegarde hors de l'hébergeur) |
| DP12 | Un npm trop ancien lance sans un mot les scripts d'installation que `allowScripts` refuse : `engine-strict` au poste comme en CI. | Relevé à l'audit du 2026-11-09, avant tout incident : `allowScripts` n'est lu que par npm 11.16 ou plus ; avec un npm plus ancien, `engines` n'est qu'un avertissement et les scripts d'installation d'esbuild et d'unrs-resolver auraient tourné sans un mot. | `tests/ci.test.ts` « ne laisse npm installer qu'avec » ; `tests/assemblage-ci.test.ts` « un npm de moins de 11.16 échoue avant tout npm ci » |
| DP13 | La mise en ligne passe par un environnement `production` à relecteur obligatoire : sans lui, rien ne s'interpose entre un push de `main` et la production (en plus de DP2). | Relevé à l'audit du 2026-11-09, avant tout incident : sans environnement GitHub, aucun relecteur obligatoire ne pouvait s'interposer, et chaque push de `main` mettait en ligne sans qu'un humain ait rien validé. | `tests/deploiement.test.ts` « déclare l'environnement production, la barrière » |
| DP14 | Derrière le proxy d'un poste distant (Codespaces), l'origine change : connexion, envoi de fichier et export l'acceptent, hors production seulement. | Essai du 2026-11-13 dans un Codespace : le proxy remplace l'origine ; la connexion et l'export d'un administrateur ont été refusés, l'envoi d'un fichier l'aurait été. | `tests/codespaces.test.ts` « n'admet rien en production, même avec les variables », « admet l'origine localhost:3000 », « admet l'origine du proxy pour les Server Actions » |

## 17. Méthode et gardes de Claude

| N° | Règle | Cas | Tenue par |
| --- | --- | --- | --- |
| ME1 | On s'assigne un ticket avant de le prendre. | Un ticket pris deux fois a donné deux implémentations, et la mauvaise a été fusionnée. | `solstice-livrer` (« S'assigner l'issue ») |
| ME2 | Une session de travail, un worktree. | D'autres sessions changeaient la branche du clone partagé juste avant un commit. | `solstice-livrer` (« Une session Claude = un worktree ») |
| ME3 | La fusion revient à un humain : fusionner, c'est mettre en ligne. | Avec l'auto-déploiement, chaque fusion partait en production. | garde `gh pr merge` (`.claude/hooks/gardes.mjs` « if (fusion(a, o, entiere)) return ») ; `solstice-livrer` (« CI verte : dire que la PR est prête. ») |
| ME4 | Une URL de base distante ne se colle jamais dans un terminal ni un fichier. | Collée dans un terminal, l'adresse de la base de production est restée dans l'historique, et il a fallu changer les identifiants. | garde (`.claude/hooks/gardes.mjs` « Une URL de base qui porte un mot ») ; `.claude/hooks/gardes.test.mjs` |
| ME5 | Avant une PR, relire ce que le diff rend faux dans la documentation. | La dérive de documentation a été le deuxième poste de correctifs d'un projet antérieur : renvois morts, commentaires d'un état passé, une même règle écrite à quatre endroits et contredite par l'un d'eux. | agent `relecteur-docs` (`.claude/agents/relecteur-docs.md` « La dérive de doc a été le deuxième ») ; `CLAUDE.md` §7 |
| ME6 | Un test énonce la règle qu'il verrouille et cite le cas d'origine. | Sur deux projets antérieurs, ces intitulés ont servi de mémoire des incidents. | `solstice-livrer` (« Son intitulé énonce la règle ») ; `solstice-donnees` (« Les intitulés de tests énoncent ») |
| ME7 | Escalader est un résultat normal. | Une minute d'escalade coûte moins qu'un incident en production. | `CLAUDE.md` « Une demande d'affichage reste » |
| ME8 | Avant de modifier un élément partagé, chercher tous ses consommateurs. | Une date dérivée lue par 41 consommateurs ne pouvait pas changer de sens en douce. | `relecteur-docs` (`.claude/agents/relecteur-docs.md` « Un élément ») |
| ME9 | Chaque projet note ses dangers immédiats : quelle adresse déploie, où est la production. | Point de méthode d'un projet antérieur ; les archives ne détaillent pas l'incident. | **Non tenue** (relève de la méthode du projet : la blueprint de l'appli la porte au cadrage) |
| ME10 | Une modification des fichiers sensibles (authentification, proxy, schéma, infrastructure) se signale. | Même origine ; la liste des fichiers reste à fixer par projet. | **Non tenue** (relève de la méthode du projet : la blueprint de l'appli la porte au cadrage) |
| ME11 | Avant de coder un écran, demander la cible : téléphone, ordinateur ou les deux. | Les allers-retours d'interface venaient de cibles devinées. | `solstice-ui` (« Avant de coder, demander la cible ») |
| ME12 | Une règle de contrôle à seuil se mesure sur un corpus avant d'être écrite. | Des règles d'un contrôle de documents ont produit des faux positifs en série : 32 cas légitimes pour l'une, 13 pour une autre. | **Non tenue** (relève de la méthode du projet : la blueprint de l'appli la porte au cadrage) |
| ME13 | Le spécifique d'un client vit dans la configuration, jamais dans le moteur. | Un outil livré gardait en dur les conventions et le domaine de son client : impossible à réutiliser ailleurs. | **En partie** : une brique ne connaît aucun module (tests d'isolement, par exemple `tests/echeances-isolement.test.ts` « n'importe que le socle (kit, format) ») et l'hébergeur ne se nomme que dans son adaptateur (`tests/deploiement.test.ts` « ne nomme l'hébergeur que dans l'étape ») ; rien ne vérifie l'absence de convention propre à un client |
| ME14 | Un fichier du poste copié dans le premier commit d'une appli se vérifie avant lecture : nom en `.md`, ni clé privée ni URL de base distante avec mot de passe. | Relevé à l'audit du 2026-11-09, avant tout incident : une faute de chemin à l'option de blueprint ou de fiche aurait copié n'importe quel fichier lisible, une clé privée comprise, dans le premier commit. | `tests/assembleur.test.ts` « refuse, avant toute écriture, un fichier qui n'est pas un texte à copier dans le dépôt (--blueprint) », « refuse, avant toute écriture, un fichier qui n'est pas un texte à copier dans le dépôt (--fiche) » |
| ME15 | Un commit du catalogue qu'on rejoue pour mettre une appli à jour doit être sur `origin/main` : on y exécute du code. | Relevé à l'audit du 2026-11-09, avant tout incident : un manifeste retouché, ou la pull request d'un fork récupérée dans le catalogue, aurait fait exécuter du code que personne n'avait relu. | `tests/mettre-a-jour.test.ts` « le commit du manifeste est exécuté » |
| ME16 | Une garde de Claude se lit sur toute la commande : un geste confié à un interpréteur, à un lanceur, à un heredoc ou à un autre outil que Bash ne la contourne pas, et une entrée qu'elle ne sait pas lire bloque. | Reproduit à l'audit du 2026-11-09, avant tout incident : la garde ne lisait que le premier mot de chaque commande simple, et le même geste confié à un interpréteur passait. | `.claude/hooks/gardes.test.mjs` « --- Contournements reproduits », « La commande se lit quel que soit l'outil » ; `.claude/hooks/gardes.mjs` « function bloquer(motif) » |
| ME17 | Le rappel d'une retouche d'un fichier du manifeste d'une appli se cherche depuis le fichier écrit, pas depuis le dossier de la session. | Recette du 2026-11-06 : une session ouverte dans le catalogue a retouché deux fichiers du manifeste d'une appli sans aucun rappel, la racine vue étant celle du catalogue. | `.claude/hooks/gardes.test.mjs` « Le manifeste se cherche depuis le fichier écrit » ; `creer-appli` (« depuis le fichier écrit jusqu'au manifeste ») |
| ME18 | Une blueprint nomme un outil ou un document du catalogue en clair, jamais par son chemin. | Essai du 2026-11-13 : une question ouverte « à reporter par » un fichier d'outils est devenue un lien mort de l'appli. | `tests/assembleur.test.ts` « en nommant le renvoi et sa ligne, sans créer le dossier de sortie » ; `creer-appli` (« jamais par son chemin. Cas d'origine ») |
| ME19 | Toute commande donnée à l'humain s'écrit dans son shell (PowerShell sous Windows) et se fait suivre de sa vérification ; un écart s'arrête là, rapporté tel quel. | Essai du 2026-10-21 : trois des quatre commandes données à l'humain ont échoué au premier essai, écrites en bash pour une personne sous PowerShell, aucune n'étant suivie d'une vérification. | `creer-appli` (« À l'essai du 2026-10-21, trois ») |
| ME20 | La création du dépôt distant d'une appli nomme sa source (`--source`) : sans elle, le dépôt naît vide et non relié au dossier. | Essai du 2026-10-21 : le dépôt est né vide et non relié au dossier, ce qu'on n'a vu qu'au ticket suivant. | `creer-appli` (« Sans `--source`, le dépôt naît ») |
| ME21 | Le cadrage d'une appli pour une petite entreprise qui essaie tient en peu de questions, avec des réponses par défaut à confirmer d'un mot. | Essai du 2026-11-13 : pour une liste interne consultable après connexion, le cadrage complet a été jugé trop long pour une petite entreprise qui essaie ; trois questions et des valeurs par défaut ont suffi. | `creer-appli` (« le cadrage complet a été jugé trop long pour une PME », `.claude/skills/creer-appli/cadrage-court.md` « réponse proposée, à confirmer ») |

## Hors registre

Pièges propres à une pile ou à un outil que le catalogue n'a pas. Ils restent
dans l'inventaire, hors du dépôt, et reviennent ici si le catalogue adopte cette
pile : la page d'erreur d'un framework Python levée sans utilisateur ; l'ordre
entre contrôle d'accès et CORS dans un service HTTP ; l'asymétrie d'une mesure
de similarité de textes ; la capture de la page affichée plutôt qu'un nouveau
téléchargement refusé par le site ; les liens relatifs et absolus d'une page
comparée ; un ancien format de document qui perd ses modifications suivies ; les
règles d'un arbre de catégories (rangement en feuille seulement, compteurs qui
incluent la descendance, archivage qui cache ce qui bloque une suppression).

## D'où viennent les lignes

- Sections « Pièges retenus » et « Pièges verrouillés » des READMEs de
  briques : import-lot (I1 à I14, I16 à I21), validation (V1 à V8, D10, I20,
  A1, et ses variantes notées : V9 à V12, F1 à F4), mails et contact (M1,
  A9), déploiement (DP2 à DP6), et la première fiche de la brique
  notifications, écrite avant la brique mails (H1, H2, M1 à M7, M9, M10) ;
  sa fiche actuelle, reprise sur la brique mails, en garde les pièges. Les pièges de
  ces sections sans cas d'origine (règles déduites) ne sont pas des
  cicatrices et restent dans leurs READMEs ; la brique rgpd n'a que des
  pièges déduits. Les briques comptes, gestion-comptes, journal, échéances et
  calendrier n'ont pas de section de pièges : les leçons de comptes (A3 à
  A12, A15) viennent des commentaires de son code.
- Leçons relevées comme absentes du catalogue lors de la sortie de
  l'inventaire : D8, D9, D11, FI3, IA1, A13, A16, A17, P2, U6, C1, S1 à S3,
  S7, IA2, IA4 à IA7, R1, C5, C8, I21. Points ouverts relevés lors de la
  sortie des journaux : ME8 à ME10, P3, P4, DP11.
- Inventaire des applis livrées, journaux du prototype, commentaires
  « projet précédent » du code, skills, gardes et agents : le reste.
- Depuis la publication du catalogue : chaque PR qui corrige un défaut rencontré
  à l'usage (incident, anomalie d'une appli, d'un essai ou d'une recette,
  constat d'audit) ajoute sa ligne, et une appli assemblée fait remonter les
  siennes par `ADAPTATIONS.md`.
