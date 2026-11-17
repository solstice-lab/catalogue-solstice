# Cadrage court

Trois questions, des valeurs par défaut pour tout le reste, un seul message de validation. Il
remplace les blocs de `solstice-nouvelle-appli` §1 et les questions de l'étape 1 de
[`SKILL.md`](SKILL.md). Le reste demeure : charger `solstice-nouvelle-appli` pour la forme (§2)
et les rubriques de la fiche (§3) ; faire les lectures de l'étape 2 (`choix.md`, la section
« Interface publique » de chaque brique retenue, `outils/modules.mjs`) avant le message de
validation ; après lui, les étapes 3 à 7, relecture `relecteur-blueprint` comprise. Ce qui
n'est pas demandé n'est pas tranché en silence : chaque valeur par défaut se montre, et celles
qui engagent la mise en ligne restent ouvertes, avec leur échéance, jusqu'aux tickets qui les
règlent.

## Les trois questions

Dans un seul message. Ce que la demande dit déjà ne se redemande pas : le reformuler comme
réponse proposée, à confirmer d'un mot. La demande de l'essai du 2026-11-13, « une liste des
fournisseurs de mon entreprise, consultable par mes collègues après connexion », répondait
aux trois.

1. **Ce que vous suivez**, et ce que chaque fiche garde (quelques champs). Elle choisit les
   briques en plus d'après [`choix.md`](choix.md), seulement celles qu'elle appelle en toutes
   lettres : une date à surveiller `echeances`, un fichier à reprendre `import-lot`, une
   décision à tracer `validation`, des groupes qui ne voient que leurs fiches `espaces`, un
   formulaire de contact sur une vitrine `mails,contact`. Un besoin seulement évoqué (des
   rappels, un historique) va en « Pas en v1 » : une brique s'ajoute ensuite sans grand
   frais (étape 2, « La base et `comptes` se décident à l'assemblage »). « Rien à garder, des
   pages à montrer » mène à la vitrine.
2. **Qui s'en sert, et qui ajoute ou retire les personnes.** La configuration, changée par un
   développeur (un domaine de messagerie commun, une liste fixe) : `outil-interne`. Un admin à
   l'écran (des personnes invitées une à une, une association dont les adhésions changent) :
   `portail` (étape 1 de `SKILL.md`, « Le profil de départ »).
3. **Faut-il se connecter pour voir ?** Oui : la brique `comptes`. Non, sans rien à garder :
   la vitrine.

## Sortir du cadrage court

- Des données de santé, d'opinion ou d'une autre catégorie particulière du RGPD, ou des
  documents de clients : poser en entier le bloc « Les données » de `solstice-nouvelle-appli`
  §1.
- Un partage avec une personne extérieure sans compte, ou une appli ouverte à toute adresse
  (inscription libre) : poser en entier le bloc « Les accès ».
- Des données à garder sans connexion (hors formulaire de contact) : aucun profil ne le
  donne. Revenir avec la personne au profil de départ (étape 1 de `SKILL.md`).

La personne peut aussi demander le cadrage complet à tout moment : ses réponses déjà données
restent.

## Les valeurs par défaut

Chacune se note dans la fiche, rubrique de `solstice-nouvelle-appli` §3, avec « (par
défaut) ». Une échéance dans la dernière colonne fait de la ligne une question ouverte de la
fiche (qui tranche : le client, sauf l'hébergement, que tranche la personne qui mène le projet ;
avant cette échéance), reprise en section 8 de la blueprint et portée par le ticket de la
section 9 que la ligne nomme, ou à défaut par celui qui remplit le fichier en cause.

| Sujet | Par défaut | À revoir avant |
| --- | --- | --- |
| Nom de l'appli, nom affiché | Tirés de la réponse 1 (`annuaire-fournisseurs`, « Annuaire des fournisseurs ») | |
| Profil, briques | Déduits des trois réponses ; `deploiement` en plus (ligne Hébergement) | |
| Leçons du registre | Celles des sections que touchent les briques choisies, inscrites en tête de la section 9 de la blueprint (`blueprint-modele.md`) ; celles du métier que les trois réponses ne disent pas : « à confirmer au ticket du module » | |
| Entités | Clé métier : le champ qui nomme une fiche (un nom, une référence), unique. Suppression : définitive, par qui modifie, comme le patron `dossiers` | |
| Entrée (avec `comptes`) | `entree: ferme`, rôles `membre` (consulte, rôle par défaut) et `admin` (modifie), `methodes: [code-email]`, `personnes_par_reseau` omis (défaut du profil) | la mise en ligne : domaine ou adresses admis, premier admin |
| Écrans, thème | Ordinateur d'abord, utilisable sur téléphone ; thème de repli (charte Solstice Lab), une charte du client se pose par le ticket « thématiser » | |
| Qui livre | La personne qui mène le cadrage (propriétaire proposé du dépôt, étape 5.2) ; la signature Solstice Lab reste, et hors livraison Solstice Lab la retirer est un ticket de la section 9 | |
| Langue, devise, fuseau | Français, euro, Europe/Paris | |
| Auteur d'une proposition (avec `validation`) | Peut la décider, avec mention visible dans la file | |
| Import (avec `import-lot`) | Relu avant d'être enregistré, fichier d'origine gardé | |
| Hébergement | Render, avec la brique `deploiement` (le défaut de l'étape 1) ; comptes Render et Resend au nom du client | la mise en ligne |
| Domaine d'envoi Resend (avec `mails`) | Aucun vérifié : `COMPTES_PREMIER_ADMIN` est l'adresse du propriétaire du compte Resend, seul à recevoir son code de connexion | le premier collègue invité (ticket de mise en ligne) |
| Mentions légales | Éditeur professionnel quand la demande vient d'une entreprise, d'une association ou d'un indépendant pour son activité ; sinon le statut est « à demander », sans défaut. Éditeur, directeur de la publication, forme juridique, immatriculation « à demander » ; hébergeur Render Services, Inc., adresse et téléphone à relever sur la facture ou le DPA du compte | la mise en ligne publique, ou le premier utilisateur réel d'une instance de recette |
| Confidentialité | Rien de proposé, hors les durées que les briques déclarent, affichées « à valider » (étape 1 de `SKILL.md`) : courriel des droits, délégué, autorité de contrôle, bases légales, durées, destinataires, et les données de la réponse 1 comme traitement du projet, tous « à faire valider » | le premier utilisateur réel ; vitrine : la mise en ligne publique |
| Entretien après livraison | Personne de nommé : Dependabot retiré (pas de `--dependabot`) | |
| Référencement | `site: ferme`, vitrine comprise : son passage en `site: public` (`sitePublic` de `src/lib/referencement.ts`) est un ticket de la section 9, bloqué par celui des mentions légales. Description : une phrase tirée de la réponse 1. Pages publiques : aucune, ou pour une vitrine celles de la réponse 1 | |
| Bandeau « instance de recette » | Proposé dans le message de validation, un ticket de plus s'il est accepté | |
| Outil actuel, volumes, vrai exemple de la donnée | Pas demandés | le ticket du module : il ne se conçoit pas sans |
| Pas en v1 | Tout ce que la réponse 1 ne nomme pas | |

**La durée de conservation** des données personnelles ordinaires (le nom, l'e-mail, le
téléphone d'un contact) se décide d'entrée au cadrage complet (`solstice-nouvelle-appli` §1).
Ici, elle est reportée au ticket de la confidentialité, comme le reste de la ligne : le client
la valide, aucune durée n'est proposée. D'ici là l'appli est une **instance de recette**,
fermée aux moteurs et sans vrai membre (`solstice-nouvelle-appli` §1). Le cadrage court y
ajoute une règle : aucune donnée réelle d'une personne n'y est saisie avant ce ticket, faute
de durée validée. Les données réelles du client restent hors du dépôt.

## Le message de validation

Un seul message, qui vaut la validation de la fiche (étape 1) et celle du choix des briques
(étape 2) :

1. **La fiche projet**, rubriques de `solstice-nouvelle-appli` §3, avec en tête : « Cadrage
   court du <date> : ce qui est marqué (par défaut) n'a pas été demandé. » Chaque ligne à
   échéance porte « à revoir avant <échéance> ».
2. **Le profil et les briques**, en clair : ce que la personne obtient, ce qu'elle n'obtient
   pas, ce qui restera à construire par tickets (étape 2 de `SKILL.md`). Avec la vitrine, le
   coût d'ajouter plus tard la base et les comptes (étape 1, « Le profil de départ »).
3. **Une question** : valider tel quel, ou nommer les lignes à changer. Le message se
   re-présente avec les lignes changées, jusqu'au oui.

Validé, le cadrage reprend à l'étape 3 de `SKILL.md`. La blueprint reprend les valeurs par
défaut telles quelles, et son `statut:` finit par « , cadrage court » : le relecteur de
blueprint ne lit qu'elle. Ce que l'appli remplace et ses volumes y sont, en section 1, une
question ouverte de la section 8, avant le ticket du module.
