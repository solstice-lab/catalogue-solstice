# Le catalogue dans GitHub Codespaces

Note propre au catalogue : une appli assemblée ne la reçoit pas. Elle accompagne
`.devcontainer/` et consigne ce qu'a établi l'essai réel de bout en bout, du 2026-11-13 au
2026-11-16 : un Codespace sur le catalogue, l'assemblage d'une appli avec base par la skill
`creer-appli`, son dépôt distant, la connexion à l'appli lancée.

Codespaces est une option en plus de l'installation sur le poste, qui reste la voie
principale ([demarrer.md](demarrer.md)). Il sert à qui n'a ni git, ni Node, ni Docker :
l'environnement s'ouvre dans le navigateur, un compte GitHub et un compte Claude suffisent.

## Ce que fait `.devcontainer/`

- **Image** : Node 24 sur Debian (celle de `.nvmrc` et de la CI), avec git.
- **`creation.sh`**, une fois à la création : met npm à jour (11.16 ou plus, exigé par
  `engine-strict` du `.npmrc`), refait le contrôle de version de la CI, puis `npm ci`.
  L'éditeur n'ouvre qu'une fois `npm ci` fini et Postgres démarré.
- **`demarrage.sh`**, à chaque démarrage et à chaque réveil : si le projet a un
  `docker-compose.yml`, attend le démon Docker, lance `docker compose up -d --wait`
  (conteneur `catalogue-postgres`, `127.0.0.1:5433`), puis `scripts/bases-locales.ts`, qui
  crée les bases `_dev` et `_test` manquantes et donne la commande `--env-local` qui
  prépare `.env.local`, à taper soi-même.
- **Docker dans le conteneur** (feature `docker-in-docker`), pas celui de l'hôte : le port
  `127.0.0.1:5433` est alors celui du conteneur, là où les tests et `.env.local` le
  cherchent, et `docker exec catalogue-postgres …` marche comme sur un poste.
- **gh** (dépôt distant et issues d'une appli assemblée) et **Claude Code** (commande
  `claude` et extension VS Code, feature publiée par Anthropic).
- **Ports** : 3000 redirigé (l'appli de `npm run dev`, ouverte dans le navigateur, sur une
  adresse en `….app.github.dev` que seul le compte GitHub du Codespace peut voir) ; 5433
  jamais redirigé (Postgres sans mot de passe, pour le seul conteneur).
- **Gardes** : `.claude/settings.json` les lance avec `node`, présent dans l'image.
- **git** : Codespaces le configure d'office au nom du compte GitHub ; l'assembleur en a
  besoin pour son premier commit.

Image et features sont épinglées par digest, comme l'image Postgres (les actions de la CI
le sont par SHA) ; l'étiquette suivie est en commentaire dans `devcontainer.json`. L'image
porte la majeure de Node : elle change avec `.nvmrc`, comme le disent `ci.yml` et
`dependabot.yml`.

Si la création échoue : palette (**Ctrl+Maj+P**), **Codespaces: View Creation Log**, et lire
la fin du journal (pour npm, il liste les versions trouvées).

## Le parcours, constaté à l'essai

Les commandes se tapent **dans le terminal du Codespace** (menu **Terminal**, **New
Terminal**), un terminal Linux (bash), où le catalogue est déjà cloné et installé.

1. **Créer le Codespace** depuis la page GitHub du catalogue : bouton **Code**, onglet
   **Codespaces**. **New with options** permet de choisir la région (Europe West existe)
   et la machine (2 cœurs suffisent).
2. **Deux autorisations au premier usage**, à annoncer d'avance : le compte Claude, au
   premier lancement de Claude Code (un lien s'ouvre dans le navigateur, puis un code à
   recoller) ; puis la connexion de `gh` au compte GitHub, au moment de créer le dépôt de
   l'appli (point 4). Claude Code s'ouvre soit par `claude` dans le terminal, soit par son
   extension, **en bas à droite de l'éditeur**, dans la barre d'état, et non dans la barre
   de gauche.
3. **Assembler depuis le catalogue** avec la skill `creer-appli`, comme sur un poste. Si
   elle demande le système, répondre : « Linux, terminal bash de GitHub Codespaces » ; elle
   donne alors les commandes bash et des chemins en `/workspaces/…`. L'appli est assemblée
   à côté du catalogue, dans `/workspaces/<nom-de-l-appli>`.
4. **Dépôt distant** : le jeton GitHub du Codespace ne vaut que pour le dépôt d'où le
   Codespace est créé. Si `gh repo create` échoue (« Resource not accessible by
   integration », 403), quitter Claude puis, dans le terminal :

   ```bash
   unset GITHUB_TOKEN
   ```

   ```bash
   gh auth login --web --git-protocol https
   ```

   ```bash
   gh auth setup-git
   ```

   puis relancer `claude` **depuis ce même terminal** et reprendre l'étape.

5. **Passer du catalogue à l'appli**, dans le même Codespace : **File > Open Folder…**
   (Fichier > Ouvrir le dossier), choisir `/workspaces/<nom-de-l-appli>`. La fenêtre se
   recharge sur les fichiers de l'appli. Claude, ouvert ensuite, y démarre une nouvelle
   conversation, propre à l'appli, où celle du catalogue n'apparaît pas.
6. **Préparer la base** (appli avec base), dans un nouveau terminal de l'appli : Postgres
   tourne déjà (c'est celui du catalogue, partagé) ; une seule commande crée les bases et
   `.env.local`, avec l'adresse du premier admin si l'appli a la brique `comptes` :

   ```bash
   npx tsx scripts/bases-locales.ts --env-local --admin=<adresse>
   ```

7. **Lancer l'appli** (`npm run dev`) : une notification propose d'ouvrir le port 3000 dans
   le navigateur (sinon : onglet **Ports**, ligne 3000, icône du globe). Avec la brique
   `mails` en mode `console`, le code de connexion s'affiche dans le terminal du serveur.
   La connexion réussit.

### Un Codespace par dépôt

La page GitHub du dépôt de l'appli ne montre pas le Codespace du catalogue : elle propose
d'en créer un. Ce Codespace propre à l'appli (bouton **Code** de son dépôt, onglet
**Codespaces**) sert à reprendre le travail plus tard ou ailleurs. Il reçoit le même
environnement, Postgres compris, puisque l'appli a reçu `.devcontainer/` (section
suivante) ; mais sa base est vide : la préparer de nouveau avec la même commande,
`npx tsx scripts/bases-locales.ts --env-local --admin=<adresse>`.

## L'appli assemblée reçoit `.devcontainer/`

`.devcontainer/` n'est pas dans `EXCLUS_DU_CATALOGUE` (`outils/modules.mjs`) : l'assembleur
le copie dans toute appli, comme le reste du socle. Raisons :

- l'appli vit ensuite dans son propre dépôt ; la PME qui y revient sans rien sur son poste
  ouvre un Codespace **sur ce dépôt**, pas sur le catalogue. Sans `.devcontainer/`, elle
  tomberait sur l'image générique de Codespaces : npm probablement plus ancien que 11.16
  (`npm ci` refusé par `engine-strict`), pas de Claude Code, pas de Postgres prêt ;
- `demarrage.sh` ne démarre rien sans `docker-compose.yml`, que l'assembleur retire avec la
  base : une appli sans base n'a rien à retoucher ;
- le dossier est suivi comme le reste du socle : `catalogue.empreintes.json` le liste, une
  retouche se note dans `ADAPTATIONS.md`, l'outil de mise à jour reporte un digest
  renouvelé.

Le prix : une appli qui n'utilise jamais Codespaces porte trois fichiers de plus, et la
feature Docker alourdit la création d'un Codespace même sans base.

Les vérifications le couvrent sans retouche : le test « chaque fichier du catalogue hors
vie du catalogue est copié à l'identique » (`tests/assembleur.test.ts`) lit `git ls-files`,
et le job `socle-seul` (`.github/workflows/assemblage.yml`) passe `npm run format:check`
sur `devcontainer.json`. Pour le garder au catalogue seul, il suffirait d'ajouter
`".devcontainer/"` à `EXCLUS_DU_CATALOGUE`, que ce même test lit.

## Limites relevées

Pages de GitHub lues le 2026-11-13 ; aucun prix ni quota chiffré ici, ils changent : les
lire chez GitHub avant toute promesse.

- **Facturation** : le Codespace est facturé au compte qui le crée, y compris depuis le
  dépôt public du catalogue (constaté à l'essai, « Billed to »), au-delà du quota gratuit
  mensuel. Un essai complet (assembler une appli, la lancer, s'y connecter) tient dans le
  quota gratuit mensuel d'un compte GitHub personnel. Sans moyen de paiement, l'usage est
  bloqué une fois le quota épuisé. L'abonnement ou la clé de Claude se paient à part,
  comme sur un poste.
- **Mise en veille** : 30 minutes d'inactivité par défaut, réglable dans les réglages du
  compte. Selon GitHub, l'activité du terminal, saisie ou sortie, repousse la veille ; la
  même page indique une durée maximale de fonctionnement continu. À la veille, les
  processus s'arrêtent (`npm run dev`, Claude), les fichiers restent.
- **Suppression automatique** : un Codespace arrêté et inactif est supprimé après
  30 jours par défaut, avec ce qui n'a pas été poussé sur GitHub. Pour une PME, c'est
  le risque principal : un travail non commité disparaît. La consigne « commiter et
  pousser à chaque fin de séance » devient obligatoire.
- **Région et données réelles (RGPD)** : la région se choisit automatiquement selon la
  localisation, ou à la main dans les réglages (Europe West existe). Le Codespace est
  hébergé par GitHub, société américaine, même en région Europe : transfert hors UE au
  sens du RGPD, à couvrir par le contrat GitHub de l'entreprise (vérifier que son accord
  de traitement des données couvre Codespaces). Recommandation : **aucune donnée réelle
  dans un Codespace**, comme sur un poste (le `docker-compose.yml` le dit déjà de la
  base locale) ; les données réelles vivent seulement en production, chez l'hébergeur
  choisi. Rappel : avec ou sans Codespaces, Claude Code envoie à Anthropic les fichiers
  qu'il lit.
- **Dépendance à GitHub** : compte GitHub obligatoire, panne de GitHub = plus
  d'environnement de travail, quotas et prix fixés par GitHub. Le code reste dans un
  dépôt git ordinaire et `.devcontainer/` est un format ouvert : le même environnement
  s'ouvre en local (VS Code et Docker) ou chez un autre fournisseur de dev containers.
  La sortie est possible, mais elle redemande des installations sur le poste.
- **Formulaires derrière le proxy** : à l'essai, aucun formulaire ne passait. Le proxy
  transmet l'en-tête Origin `localhost:3000` et, en `x-forwarded-host`, l'adresse
  `<codespace>-3000.app.github.dev` ; Next refusait la Server Action (`` does not match
  `origin` header `` dans le terminal du serveur). Le socle l'admet maintenant
  (`src/lib/codespaces.ts`, lu par `next.config.ts`), et les briques `rgpd` et
  `import-lot`, qui font le même contrôle à la main, aussi. Seulement dans un Codespace
  (variables `CODESPACE_NAME` et `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`) et hors
  production : partout ailleurs, la protection reste entière (`tests/codespaces.test.ts`).
- **Lien de connexion par e-mail** : en développement, le lien se construit sur l'hôte
  reçu, qui peut être `localhost:3000`, injoignable depuis le navigateur. La connexion
  par code, méthode par défaut, n'est pas concernée.

## Reste à faire

- Dire dans la skill `creer-appli` que Codespaces est un Linux en bash (variable
  `CODESPACES`), pour qu'elle ne demande pas le système et donne les commandes de sa
  section 5.4.
- Ajouter l'écosystème `devcontainers` à `.github/dependabot.yml` pour renouveler les
  digests.
