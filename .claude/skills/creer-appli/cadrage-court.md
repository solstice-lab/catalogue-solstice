# Cadrage court

Trois questions, des valeurs par défaut pour tout le reste, un seul message de validation. Il
remplace les blocs de `solstice-nouvelle-appli` §1 et les questions de l'étape 1 de
[`SKILL.md`](SKILL.md) ; tout le reste demeure : charger `solstice-nouvelle-appli` pour la
forme (§2) et les rubriques de la fiche (§3), puis suivre les étapes 2 à 7, relecture
`relecteur-blueprint` comprise. Ce qui n'est pas demandé n'est pas tranché en silence : chaque
valeur par défaut se montre, et celles qui engagent la mise en ligne restent ouvertes, avec
leur échéance, jusqu'aux tickets qui les règlent.

## Les trois questions

Dans un seul message. Ce que la demande dit déjà ne se redemande pas : le reformuler comme
réponse proposée, à confirmer d'un mot. La demande de l'essai du 2026-11-13, « une liste des
fournisseurs de mon entreprise, consultable par mes collègues après connexion », répondait
aux trois.

1. **Ce que vous suivez**, et ce que chaque fiche garde (quelques champs). Elle choisit les
   briques en plus d'après [`choix.md`](choix.md) : une date à surveiller appelle
   `echeances`, un fichier à reprendre `import-lot`, une décision à tracer `validation`, des
   groupes qui ne voient que leurs fiches `espaces`. Aucune autre brique. « Rien à garder, des
   pages à montrer » mène à la vitrine.
2. **Qui s'en sert, et qui ouvre l'accès.** Des collègues d'un même domaine de messagerie, ou
   une liste fixe : `outil-interne`. Des personnes extérieures invitées une à une, ou une
   association sans domaine commun : `portail` (étape 1 de `SKILL.md`, « Le profil de
   départ »).
3. **Faut-il se connecter pour voir ?** Oui : la brique `comptes`. Non, sans rien à garder :
   la vitrine.

## Passer au cadrage complet

Le bloc concerné de `solstice-nouvelle-appli` §1 se pose en entier, et lui seul, quand une
réponse fait voir :

- des données de santé, d'opinion ou d'une autre catégorie particulière du RGPD, ou des
  documents de clients ;
- des données à garder sans connexion (hors formulaire de contact) ;
- un partage avec une personne extérieure sans compte ;
- de la vente ou de la publicité sur le site (le statut de l'éditeur n'est plus le défaut).

La personne peut aussi demander le cadrage complet à tout moment : ses réponses déjà données
restent.

## Les valeurs par défaut

Chacune se note dans la fiche, rubrique de `solstice-nouvelle-appli` §3, avec « (par
défaut) ». Une échéance dans la dernière colonne fait de la ligne une question ouverte de la
fiche (qui tranche : le client ; avant cette échéance), reprise en section 8 de la blueprint
et portée par le ticket de la section 9 qui la règle.

| Sujet | Par défaut | À revoir avant |
| --- | --- | --- |
| Nom de l'appli, nom affiché | Tirés de la réponse 1 (`annuaire-fournisseurs`, « Annuaire des fournisseurs ») | |
| Profil, briques | Déduits des trois réponses ; `deploiement` en plus (ligne Hébergement) | |
| Entrée (avec `comptes`) | `entree: ferme`, rôles `membre` (consulte, rôle par défaut) et `admin` (modifie), `methodes: [code-email]`, `personnes_par_reseau` omis (défaut du profil) | la mise en ligne : domaine ou adresses admis, premier admin |
| Écrans, thème | Ordinateur d'abord, utilisable sur téléphone ; thème de repli (charte Solstice Lab), une charte du client se pose par le ticket « thématiser » | |
| Qui livre | La signature Solstice Lab reste (l'assembleur ne la retire pas) ; hors livraison Solstice Lab, la retirer est un ticket de la section 9, au choix de la personne | |
| Langue, devise, fuseau | Français, euro, Europe/Paris | |
| Auteur d'une proposition (avec `validation`) | Peut la décider, avec mention visible dans la file | |
| Hébergement | Render, avec la brique `deploiement` ; comptes Render et Resend au nom du client | la mise en ligne |
| Domaine d'envoi Resend (avec `mails`) | Aucun vérifié : `COMPTES_PREMIER_ADMIN` est l'adresse du propriétaire du compte Resend, seul à recevoir son code de connexion | le premier collègue invité |
| Mentions légales | Éditeur professionnel (entreprise, association, indépendant) ; éditeur, directeur de la publication, forme juridique, immatriculation « à demander » ; hébergeur Render Services, Inc., adresse et téléphone à relever sur la facture ou le DPA du compte | la mise en ligne publique, ou le premier utilisateur réel d'une instance de recette |
| Confidentialité | Rien de proposé (étape 1 de `SKILL.md`) : courriel des droits, délégué, autorité de contrôle, bases légales, durées (celles des briques « à valider »), destinataires, et les données de la réponse 1 comme traitement du projet, tous « à faire valider » | le premier utilisateur réel |
| Entretien après livraison | Personne de nommé : Dependabot retiré (pas de `--dependabot`) | |
| Référencement | Outil interne, portail : site fermé, aucune page publique. Vitrine : site public, pages de la réponse 1. Description : une phrase tirée de la réponse 1 | vitrine : la mise en ligne publique |
| Outil actuel, vrai exemple de la donnée | Pas demandés | le ticket du module : il ne se conçoit pas sans |
| Pas en v1 | Tout ce que la réponse 1 ne nomme pas | |

Tant qu'une ligne « le premier utilisateur réel » reste ouverte, l'appli en ligne est une
**instance de recette** : fermée aux moteurs, sans vrai membre (`solstice-nouvelle-appli` §1).
Les données réelles du client restent hors du dépôt, comme au cadrage complet.

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

Validé, le cadrage reprend à l'étape 3 de `SKILL.md` (la blueprint, puis sa relecture).
