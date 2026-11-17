# Stack `amame-ops` — sauvegardes, restauration et opérations ponctuelles

Cette stack tourne à côté de la stack applicative `amame`. Elle fait trois choses :

- **sauvegarder** la base et les fichiers uploadés, ensemble, deux fois par jour, dans la zone Bunny `amame-backups` ;
- **prouver** que ces sauvegardes se restaurent ;
- **lancer les scrapers** à la demande, et plus à chaque déploiement.

Les clés de la zone de sauvegarde n'existent que dans cette stack : compromettre l'application ne donne pas accès aux sauvegardes.

Le pourquoi de ces choix est dans le [rapport d'implémentation](../docs/03-implementation-migration-neon-bunny.md) (DT6, DT9, étape 0).

## Ce que contient la zone de sauvegarde

```text
amame-backups/
├── db/amame-<AAAAMMJJ>T<HHMMSS>Z.dump.gpg    un dump de la base par exécution, conservé 30 jours
└── files/uploads/<dossier>/<nom>.gpg         un objet par fichier uploadé, jamais supprimé
```

- Tout est chiffré avant l'envoi (GnuPG, AES-256) avec `BACKUP_PASSPHRASE`.
- Les fichiers portent un nom unique et ne changent jamais : la copie se limite aux fichiers absents de la sauvegarde. Comme elle ne supprime rien, **tout dump conservé retrouve ses fichiers**.
- Les fichiers sont copiés avant et après le dump : un fichier ajouté ou remplacé pendant l'opération reste couvert.

## Mise en place

### 1. Créer la zone Bunny

Dans le panneau Bunny : **Storage → Add Storage Zone**.

| Réglage | Valeur |
| --- | --- |
| Nom | `amame-backups` |
| Tier | Standard |
| Région principale | Francfort (DE) |
| Réplication | aucune |

Ne pas lui associer de Pull Zone. Relever son mot de passe (**FTP & API Access → Password**) : c'est `BUNNY_BACKUP_ZONE_KEY`.

### 2. Construire et publier les images

Depuis la racine du dépôt, sur un poste de développement connecté à Docker Hub (`docker login`) :

```bash
docker build -t yayacode224/amame:ops-v1.1 --build-arg PG_MAJOR=15 ops/backup
docker build -t yayacode224/amame:scraper-v1.1 scraper
docker push yayacode224/amame:ops-v1.1
docker push yayacode224/amame:scraper-v1.1
```

Ces commandes n'ont besoin d'aucun `.env`. `docker compose -f ops/docker-compose.yml --env-file .env build` produit les mêmes images, mais exige une valeur, même factice, pour chaque variable obligatoire.

### 3. Créer la stack dans Portainer

**Stacks → Add stack**, nom `amame-ops`, **Web editor** : coller le contenu de [deploy/portainer/amame-ops.yml](../deploy/portainer/amame-ops.yml). C'est `ops/docker-compose.yml` sans les sections `build`, que Portainer ne peut pas exécuter : les sources ne sont pas sur le serveur. Les variables à saisir sont ci-dessous. [deploy/portainer/amame-ops.env.example](../deploy/portainer/amame-ops.env.example) en donne la liste, prête à remplir hors du dossier du projet, puis à coller dans Portainer en *Advanced mode*.

| Variable | Valeur | Secret |
| --- | --- | --- |
| `BACKUP_DATABASE_URL` | `postgresql://postgres:<mot de passe>@amame-database:5432/amame_db` tant que la base est sur le VPS. Le nom du conteneur, unique sur l'hôte, plutôt que `database` : le réseau de production est partagé avec d'autres conteneurs | oui |
| `BACKUP_PASSPHRASE` | phrase longue, générée (`openssl rand -base64 48`) | oui |
| `BUNNY_BACKUP_ZONE` | nom de la zone de sauvegarde : `amamestoragezone` en production (la zone a été créée sous ce nom, écart E40 du suivi) | non |
| `BUNNY_BACKUP_ZONE_KEY` | mot de passe de la zone | oui |
| `UPLOADS_HOST_PATH` | chemin **réel** du dossier des uploads sur l'hôte | non |
| `AMAME_NETWORK` | réseau Docker de la stack applicative : `common_net` en production, valeur par défaut du fichier de production (`amame_common_net` par défaut dans `ops/docker-compose.yml`) | non |
| `SCRAPER_DATABASE_URL` | même forme que `BACKUP_DATABASE_URL` | oui |
| `BACKUP_DB_SCHEDULE` | `02:30 14:30` par défaut (heures UTC, soit l'heure de Bamako) | non |
| `BACKUP_DB_RETENTION_DAYS` | `30` par défaut | non |
| `OPS_PG_MAJOR` | `15` par défaut : la version majeure de la base sauvegardée (utilisée à la construction de l'image) | non |

Trois points demandent de l'attention.

- **`BACKUP_PASSPHRASE` doit aussi être conservée hors du serveur**, par exemple dans le gestionnaire de mots de passe de l'association. Sans elle, aucune sauvegarde n'est lisible. Elle ne doit jamais changer sans raison : les sauvegardes déjà envoyées resteraient chiffrées avec l'ancienne.
- **`UPLOADS_HOST_PATH`** se relève dans Portainer : conteneur `amame-backend` → *Volumes* → source du montage `/app/uploads`. La valeur de production est consignée dans le suivi (« Faits relevés »). La stack `amamestack` utilise la même variable : la valeur doit être identique dans les deux stacks. Un chemin erroné ne provoque aucune erreur : Docker crée un dossier vide. Le journal affiche alors `ATTENTION : aucun fichier dans /data/uploads`, et le test de restauration échoue.
- **`AMAME_NETWORK`** se relève dans Portainer (**Networks**) : c'est le réseau auquel est branché `amame-database`. En production, `common_net`. Ce réseau ne sort pas vers Internet. La stack crée donc aussi son propre réseau, `amame-ops_sortie`, par lequel elle joint Bunny (et les sites des scrapers). Sans lui : `Could not resolve host: storage.bunnycdn.com`.

### 4. Première sauvegarde et test de restauration

Dans Portainer : conteneur `amame-ops-backup` → **Console** → `/bin/bash`.

```bash
backup.sh          # sauvegarde immédiate
restore-test.sh    # restaure le dernier dump dans une base temporaire et vérifie les fichiers
```

Le test doit se terminer par :

```text
test de restauration RÉUSSI : chaque ligne référencée retrouve son fichier
```

Le test démarre une instance PostgreSQL temporaire dans le conteneur, y restaure le dump, puis télécharge et déchiffre chaque fichier référencé par une entité. Il ne touche ni à la production ni à la zone de sauvegarde, et supprime tout ce qu'il a créé.

## Utilisation courante

### Suivre les sauvegardes

Journal du conteneur `amame-ops-backup` dans Portainer. Une exécution normale :

```text
sauvegarde couplée 20261003T023000Z : début
fichiers : 412 sur le disque, 3 nouveau(x) copié(s)
base : db/amame-20261003T023000Z.dump.gpg envoyé (1843200 octets avant chiffrement)
fichiers : 412 sur le disque, 0 nouveau(x) copié(s)
sauvegarde couplée 20261003T023000Z : terminée
```

Une ligne `ERREUR` signale un échec. Il n'y a pas encore d'alerte par e-mail : elle arrive à l'étape 6. D'ici là, consulter ce journal une fois par semaine.

### Restaurer la base

```bash
restore-db.sh                                  # liste les dumps disponibles
restore-db.sh amame-20261003T023000Z.dump.gpg "postgresql://postgres:<mot de passe>@amame-database:5432/amame_db"
```

La commande **remplace le contenu de la base cible**. Avant de restaurer la production :

1. arrêter le conteneur `amame-backend` : plus aucune écriture ;
2. lancer la restauration ;
3. redémarrer le backend.

La restauration se fait dans une seule transaction : si elle échoue, la base reste telle qu'elle était.

### Restaurer des fichiers

```bash
restore-files.sh /tmp/restore                              # tous les fichiers
restore-files.sh /tmp/restore uploads/utilisateur          # un dossier
restore-files.sh /tmp/restore uploads/actualite/<nom>      # un fichier
```

Les fichiers arrivent déchiffrés sous `/tmp/restore/uploads/…`. Un fichier déjà présent dans la destination n'est jamais remplacé. Le dossier des uploads est monté en lecture seule dans ce conteneur : pour remettre les fichiers à leur place, les copier depuis l'hôte.

```bash
docker cp amame-ops-backup:/tmp/restore/uploads/. <chemin réel des uploads>/
```

Après une restauration de la base, lancer `inventory.sh` (ci-dessous) : un fichier purgé depuis la date du dump apparaît en « référence cassée », et se restaure avec `restore-files.sh`.

### Inventaire, empreintes et lignes orphelines (étape 2)

Trois scripts ponctuels, à lancer depuis la console du conteneur `amame-ops-backup`. Ils lisent la base par `BACKUP_DATABASE_URL` et le dossier des uploads monté en lecture seule. Le détail est dans le [rapport](../docs/03-implementation-migration-neon-bunny.md), étape 2.

```bash
inventory.sh                      # lecture seule : classe chaque fichier, à lancer AVANT de déployer backend-v1.3
backfill-sha256.sh                # simulation : empreintes SHA-256 des fichiers existants
backfill-sha256.sh --apply        # les écrit (après le déploiement de backend-v1.3)
delete-orphan-rows.sh             # simulation : lignes file_entity qu'aucune entité ne référence
delete-orphan-rows.sh --apply     # les supprime, après validation de la liste
```

**`inventory.sh`** compare les lignes `file_entity`, le dossier des uploads et les entités qui référencent les fichiers. Il ne modifie rien : sa session SQL est en lecture seule. Il se termine par `inventaire conforme` ou par `inventaire NON CONFORME` avec la liste des anomalies bloquantes :

| Catégorie | Bloquante | Traitement |
| --- | --- | --- |
| Référence cassée : ligne utilisée, fichier absent | oui | restaurer le fichier (`restore-files.sh`) ; à défaut, retirer le fichier de l'entité, après validation |
| Clé en double | oui | la migration V2 échouerait : analyser au cas par cas |
| Ligne partagée par plusieurs entités | oui | remplacer le fichier de l'une supprimerait celui de l'autre : analyser au cas par cas |
| Ligne orpheline | non | `delete-orphan-rows.sh` |
| Fichier orphelin (sans ligne) | non | rien : il reste dans la sauvegarde et ne sera pas copié vers Bunny |
| Écart de taille, clé hors format, nom incohérent, MIME ou taille manquants | non | à examiner avant l'étape 3 |

Les listes complètes sont écrites dans `/tmp/inventaire-<date>/`, dont le chemin s'affiche.

**`backfill-sha256.sh`** remplit l'empreinte des lignes qui n'en ont pas, en lisant chaque fichier. Il faut que la migration V2 soit appliquée : `backend-v1.3` doit avoir démarré au moins une fois. Une ligne n'est complétée que si son fichier est présent et de la taille attendue. Le MIME et la taille manquants sont complétés au passage. Sans `--apply`, rien n'est écrit. L'objectif est **100 % des lignes avec une empreinte** : le script affiche le compte restant.

**`delete-orphan-rows.sh`** supprime les lignes qu'aucune entité ne référence, datant de plus de 2 jours. La migration V3 doit être appliquée : le script refuse sinon. Chaque suppression est inscrite dans la file de purge : le fichier n'est effacé qu'après la rétention (10 jours) et seulement si la purge est activée. Pendant ce délai, la suppression s'annule. Sans `--apply`, la liste s'affiche sans rien supprimer.

Ces deux derniers scripts écrivent dans la base : le compte de `BACKUP_DATABASE_URL` doit en avoir le droit, ce qui est le cas tant que la base est sur le VPS (`postgres`).

### Lancer un scraper

Le conteneur `amame-scraper` reste en veille. Dans sa console Portainer (`/bin/bash`) :

```bash
python scraping_site_web_mina7.py
python scraper_opportunity.py
```

## Changements à venir

| Quand | Changement |
| --- | --- |
| Étape 2 (image `ops-v1.1`) | `inventory.sh`, `backfill-sha256.sh` et `delete-orphan-rows.sh` ; aucune variable nouvelle |
| Étape 3 (fichiers dans Bunny) | la copie des fichiers lit les zones Bunny avec leurs mots de passe en lecture seule, et non plus le disque ; `inventory.sh` compare la base aux zones et non plus au disque |
| Étape 4 (base dans Neon) | `BACKUP_DATABASE_URL` désigne Neon avec le rôle `amame_backup` ; `OPS_PG_MAJOR=17` et image reconstruite ; `AMAME_NETWORK` devient inutile |
| Étape 6 | alerte par e-mail en cas d'échec ; archive mensuelle hors de Bunny ; retrait des objets privés 30 jours après leur purge |
