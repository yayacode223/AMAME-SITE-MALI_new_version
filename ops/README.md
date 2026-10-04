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

Depuis la racine du dépôt, sur un poste de développement :

```bash
docker compose -f ops/docker-compose.yml --env-file .env build
docker compose -f ops/docker-compose.yml --env-file .env push
```

`--env-file .env` est nécessaire parce que le compose est dans un sous-dossier. Les variables obligatoires doivent avoir une valeur dans ce fichier, même factice, pour que la commande s'exécute.

### 3. Créer la stack dans Portainer

**Stacks → Add stack**, nom `amame-ops`, à partir du dépôt Git avec le chemin `ops/docker-compose.yml` (ou en collant le contenu du fichier). Variables à saisir :

| Variable | Valeur | Secret |
| --- | --- | --- |
| `BACKUP_DATABASE_URL` | `postgresql://postgres:<mot de passe>@database:5432/amame_db` tant que la base est sur le VPS | oui |
| `BACKUP_PASSPHRASE` | phrase longue, générée (`openssl rand -base64 48`) | oui |
| `BUNNY_BACKUP_ZONE` | `amame-backups` | non |
| `BUNNY_BACKUP_ZONE_KEY` | mot de passe de la zone | oui |
| `UPLOADS_HOST_PATH` | chemin **réel** du dossier des uploads sur l'hôte | non |
| `AMAME_NETWORK` | réseau Docker de la stack `amame` (`amame_common_net` par défaut) | non |
| `SCRAPER_DATABASE_URL` | même forme que `BACKUP_DATABASE_URL` | oui |
| `BACKUP_DB_SCHEDULE` | `02:30 14:30` par défaut (heures UTC, soit l'heure de Bamako) | non |
| `BACKUP_DB_RETENTION_DAYS` | `30` par défaut | non |
| `OPS_PG_MAJOR` | `15` par défaut : la version majeure de la base sauvegardée (utilisée à la construction de l'image) | non |

Trois points demandent de l'attention.

- **`BACKUP_PASSPHRASE` doit aussi être conservée hors du serveur**, par exemple dans le gestionnaire de mots de passe de l'association. Sans elle, aucune sauvegarde n'est lisible. Elle ne doit jamais changer sans raison : les sauvegardes déjà envoyées resteraient chiffrées avec l'ancienne.
- **`UPLOADS_HOST_PATH`** se relève dans Portainer : conteneur `amame-backend` → *Volumes* → source du montage `/app/uploads`. Un chemin erroné ne provoque aucune erreur : Docker crée un dossier vide. Le journal affiche alors `ATTENTION : aucun fichier dans /data/uploads`, et le test de restauration échoue.
- **`AMAME_NETWORK`** se relève avec `docker network ls`. Il porte le nom de la stack applicative suivi de `_common_net`.

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
restore-db.sh amame-20261003T023000Z.dump.gpg "postgresql://postgres:<mot de passe>@database:5432/amame_db"
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

### Lancer un scraper

Le conteneur `amame-scraper` reste en veille. Dans sa console Portainer (`/bin/bash`) :

```bash
python scraping_site_web_mina7.py
python scraper_opportunity.py
```

## Changements à venir

| Quand | Changement |
| --- | --- |
| Étape 3 (fichiers dans Bunny) | la copie des fichiers lit les zones Bunny avec leurs mots de passe en lecture seule, et non plus le disque |
| Étape 4 (base dans Neon) | `BACKUP_DATABASE_URL` désigne Neon avec le rôle `amame_backup` ; `OPS_PG_MAJOR=17` et image reconstruite ; `AMAME_NETWORK` devient inutile |
| Étape 6 | alerte par e-mail en cas d'échec ; archive mensuelle hors de Bunny ; retrait des objets privés 30 jours après leur purge |
