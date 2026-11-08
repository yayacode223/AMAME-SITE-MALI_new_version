# Rapport d'implémentation — Migration de la base vers Neon et des fichiers vers Bunny (AMAME)

| | |
| --- | --- |
| **Date** | 2 octobre 2026 |
| **Version** | 4 : version 3 (décisions du 2 octobre 2026 : VPS piloté par Portainer, Neon en plan Free au démarrage, région Francfort partout, abonnement Bunny existant, Optimizer reporté, socle d'abord puis fonctionnalités avancées par vagues), complétée par la décision du 4 octobre 2026 : supervision (Prometheus, Grafana, postgres-exporter) retirée de la stack pour le moment |
| **Base** | branche `main`, commit `0e43556` |
| **Rapports sources** | Neon : [01 — État des lieux](neon/01-etat-des-lieux-base-de-donnees.md) · [02 — Plan de migration](neon/02-plan-migration-neon.md) — Bunny : [01 — État des lieux](bunny/01-etat-des-lieux-stockage.md) · [02 — Plan d'implémentation](bunny/02-plan-implementation-bunny.md) |
| **Nature** | rapport d'implémentation unifié **et fichier de suivi** : ordre des étapes, choix et justifications, puis état d'avancement réel. Ce rapport ne contient pas de code : les esquisses restent dans les deux plans 02, et le code livré est référencé depuis le suivi ci-dessous. |
| **Statut** | décisions validées le 2 octobre 2026 (§12) ; **mise en œuvre commencée le 3 octobre 2026** — voir [Suivi de l'implémentation](#suivi-de-limplémentation) |

---

## Suivi de l'implémentation

> **À lire en premier à chaque nouvelle session.** Cette section dit où en est la migration, ce qui reste à faire et ce qui a été décidé en cours de route. Le reste du rapport (§1 à §13) est la référence de conception : il ne change que si une décision change.

**Dernière mise à jour : 8 novembre 2026.**

### Comment reprendre le travail

1. Lire cette section en entier, puis la description de l'étape en cours au §5.
2. Comparer avec le dépôt : `git status` et `git log --oneline -15`. Le journal ci-dessous indique ce qui a été livré et ce qui n'est pas encore commité.
3. Reprendre à la rubrique **Prochaine action**.
4. Vérifier les **actions manuelles en attente** : une étape ne commence que lorsque la précédente remplit ses critères de sortie **en production** (§5.0).

**Règles de tenue du suivi**, à appliquer après chaque implémentation :

- mettre à jour le tableau d'avancement et le détail de l'étape en cours ;
- ajouter une entrée datée au journal : ce qui a été fait, les fichiers touchés, comment cela a été vérifié ;
- consigner tout écart par rapport au plan dans **Écarts et décisions** ;
- ne cocher un critère de sortie du §5 que lorsqu'il a été constaté en production, avec la date.

**Légende** : ⬜ à faire · 🟡 code prêt dans le dépôt, pas encore déployé ou pas encore vérifié en production · ✅ fait et vérifié · ⛔ bloqué.

### Avancement général

| Étape | Contenu | Code (dépôt) | Production | Critères de sortie |
| --- | --- | --- | --- | --- |
| **0** | Sécurisation, Portainer, premier point de restauration | 🟡 écrit et vérifié en local ; figé dans la branche `sauvegarde/etape-0`, **pas encore sur `main`** | ⬜ rien n'est déployé | 0 / 8 |
| **1** | Socle de code commun | 🟡 écrit et vérifié en local ; figé dans la branche `sauvegarde/etape-1` (`5c62c07`), **pas encore sur `main`** | ⬜ rien n'est déployé | 0 / 7 |
| **2** | Contrat de métadonnées et garde-fous en base | 🟡 écrit et vérifié en local, **non commité** ; suite de tests complète passée le 8 novembre (70 tests) ; migrations et scripts d'exploitation essayés sur une base jetable | ⬜ | 0 / 6 |
| **3** | Bascule du stockage vers Bunny | ⬜ | ⬜ | 0 / 4 |
| **4** | Bascule de la base vers Neon | ⬜ | ⬜ | 0 / 6 |
| **5** | Diffusion des images par le CDN | ⬜ (conversion et `srcset` déjà livrés) | ⬜ | 0 / 6 |
| **6** | Exploitation et nettoyage | ⬜ | ⬜ | §9 |

### Étape 0 — détail

Code figé dans la branche locale `sauvegarde/etape-0` (commit `b14e7dd`). Rien n'est déployé : tout ce qui suit attend les actions manuelles A à F.

| # | Action (§5, étape 0) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 0.1 | Portainer, stack `amame-ops`, scraper déplacé | 🟡 | stack [ops/docker-compose.yml](../ops/docker-compose.yml) et son mode d'emploi [ops/README.md](../ops/README.md) ; service `scraper` retiré de [docker-compose.yml](../docker-compose.yml) | sécuriser Portainer ; relever le chemin réel des uploads ; créer la stack |
| 0.2 | Secrets | 🟡 | `backend/.env`, `frontend/.env` et `backend/uploads/` retirés de l'index Git (39 fichiers) ; plus aucun mot de passe ni secret par défaut dans le compose, les `application-*.properties` et les 3 scrapers ; [.env.example](../.env.example) complet | changer le mot de passe d'application Gmail, `JWT_SECRET` et le mot de passe de la base ; saisir les variables de stack |
| 0.3 | Compte administrateur | 🟡 | [UserDataInitializer.java](../backend/src/main/java/com/example/siteamame/datainitializer/UserDataInitializer.java) : plus d'identifiants dans le code, création seulement si `BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD` sont fournis | vérifier que le mot de passe de l'administrateur par défaut a été changé |
| 0.4 | Fichiers privés | 🟡 | Nginx : 404 sur `/uploads/utilisateur/` **et** `/amame-uploads/utilisateur/` ; Spring Security : `denyAll` ; endpoint authentifié `/api/user/files/{id}` ; 6 écrans du frontend basculés sur `imageUrl` et `cvUrl`. **Deux failles d'accès corrigées au passage** (écarts E10 et E11) | déployer, constater les 404, **auditer les comptes à privilèges** |
| 0.5 | Sauvegarde couplée | 🟡 | image d'exploitation [ops/backup/](../ops/backup/) : `backup.sh`, `restore-test.sh`, `restore-db.sh`, `restore-files.sh`, planificateur | créer la zone `amame-backups` ; première sauvegarde ; test de restauration |
| 0.6 | Durcissement | 🟡 | `restart` sur la base ; pgAdmin, Grafana et Prometheus sur `127.0.0.1` ; port 8080 non publié ; mémoire JVM mesurée et bornée sous la limite du conteneur ; limitation de débit de l'inscription sur la vraie IP | vérifier que la limite s'applique bien par visiteur |
| 0.7 | Images statiques | 🟡 | 34 images converties en 70 fichiers WebP (2,9 Mo au lieu de 67 Mo) ; 128 fichiers jamais référencés et `favicon.svg` supprimés ; `public/` passe de 92 Mo à 6,4 Mo ; composant [StaticImage.tsx](../frontend/src/components/StaticImage.tsx) (`srcset`, dimensions, chargement différé) ; logo de 9 Ko au lieu de 292 Ko | mesurer le poids réel de l'accueil |

### Étape 1 — détail

Code écrit et vérifié en local les 4 et 5 octobre 2026, **avant** que les critères de l'étape 0 soient constatés en production, à la demande de l'équipe (écart E15). L'ordre de déploiement ne change pas : l'étape 0 d'abord.

| # | Action (§5, étape 1) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 1.1 | Configuration externalisée | 🟡 | connexion lue dans `DATABASE_*`, sans valeur en dur ; Flyway avec son propre compte ; propriétés typées `app.storage.*` ([StorageProperties.java](../backend/src/main/java/com/example/siteamame/config/StorageProperties.java)) ; pool piloté par `DB_POOL_*`, profil « veille » par défaut ; [.env.example](../.env.example) et [docker-compose.yml](../docker-compose.yml) à jour ; tags `backend-v1.2` et `frontend-v1.2` | aucune variable nouvelle n'est obligatoire tant que la base est sur le VPS (action I) |
| 1.2 | Flyway | 🟡 | [V1__baseline.sql](../backend/src/main/resources/db/migration/V1__baseline.sql) (25 tables) ; base existante marquée « en V1 » sans rien exécuter ; Hibernate en `validate` ; test de démarrage sur un vrai PostgreSQL (Testcontainers) | **comparer le schéma de production à V1 avant de déployer** (action G.1) ; constater la baseline dans le journal du backend |
| 1.3 | Abstraction du stockage | 🟡 | les 9 services injectent l'interface `FileStorageService` ; [LocalFileStorageService.java](../backend/src/main/java/com/example/siteamame/service/file/LocalFileStorageService.java) lit enfin sa propriété ; [UploadValidator.java](../backend/src/main/java/com/example/siteamame/service/file/UploadValidator.java) (octets de signature, WebP accepté) ; [MediaUrlResolver.java](../backend/src/main/java/com/example/siteamame/service/file/MediaUrlResolver.java) et champs `fileUrl` ou `coverImageUrl` dans 10 DTO ; `ConcoursMapper` et `ConcoursRepository` corrigés | recette : concours sans fichier, upload, affichage |
| 1.4 | Frontend | 🟡 | [media.ts](../frontend/src/utils/media.ts) et [MediaImage.tsx](../frontend/src/components/MediaImage.tsx) ; plus aucune constante `PROD_URL` ni chemin `/${filePath}` ; avatar de la Navbar corrigé ; `config.js` écrit au démarrage du conteneur ([40-runtime-config.sh](../frontend/docker/40-runtime-config.sh)) et exclu du précache de la PWA ; paramètres d'Optimizer prévus et désactivés ; code mort retiré ; attributs `accept` alignés sur le backend | changer `MEDIA_BASE_URL`, mettre la stack à jour, constater le changement (action J) |
| 1.5 | Accès SQL et réveils de la base | 🟡 | chargements groupés ; catégories comptées en une requête ; cache de 60 s du filtre JWT ; auto-commit désactivé et seuil de fuite à 60 s ; plus aucune sonde de santé n'interroge la base ; cache des listes publiques prêt et désactivé ; nettoyage des jetons déplacé dans la fenêtre de nuit | — |
| — | Supervision retirée (décision du 4 octobre, écart E14) | 🟡 | services `prometheus`, `grafana` et `postgres-exporter`, leurs volumes, `GRAFANA_ADMIN_PASSWORD`, le dossier `monitoring/` et l'export Prometheus du backend | supprimer les 3 conteneurs et les 2 volumes devenus orphelins (action I.4) |
| — | Mémoire du backend remesurée (écart E22) | 🟡 | lecture des fichiers par blocs, deux bornes sur la mémoire native, tas ramené de 40 % à 30 % : 396 Mio sur 512 sous charge, contre 482 pour l'étape 0 | relever `docker stats` après quelques jours (action J.4) |

### Étape 2 — détail

Code écrit le 7 novembre 2026, **avant** que les étapes 0 et 1 soient déployées, et sans lancer les tests longs, à la demande de l'équipe (écart E27). La suite complète a ensuite été lancée le 8 novembre : 70 tests, aucun échec. L'ordre de déploiement ne change pas : 0, puis 1, puis 2. Tags : `backend-v1.3` (le frontend ne change pas, il reste en `frontend-v1.2`) et `ops-v1.1`.

| # | Action (§5, étape 2) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 2.1 | Inventaire croisé | 🟡 | [inventory.sh](../ops/backup/inventory.sh), en lecture seule : références cassées, clés en double et lignes partagées (bloquantes), lignes et fichiers orphelins, fichiers en attente de purge, écarts de taille, clés hors format, métadonnées manquantes (écart E34) | le lancer **avant** de déployer `backend-v1.3`, puis après (actions K.2 et N.4) |
| 2.2 | Migration V2 | 🟡 | [V2__file_metadata_contract.sql](../backend/src/main/resources/db/migration/V2__file_metadata_contract.sql) : colonne `file_sha256`, unicité de la clé, déclencheur qui refuse toute modification de `file_path` ; format de clé, MIME et taille posés `NOT VALID` (écart E30). Empreintes de l'existant : [backfill-sha256.sh](../ops/backup/backfill-sha256.sh) | remplir les empreintes (action N.2) |
| 2.3 | Migration V3 | 🟡 | [V3__storage_purge_queue.sql](../backend/src/main/resources/db/migration/V3__storage_purge_queue.sql) : table `storage_purge_queue`, déclencheur après suppression ; `TRUNCATE file_entity` refusé (écart E32) | — |
| 2.4 | Code | 🟡 | `orphanRemoval` sur les 8 entités et `User.files` ; `UserService.update` modifie la collection sur place ; plus aucun `deleteFile` dans les services ; empreinte enregistrée à chaque upload ; compensation à l'annulation ([UploadCompensation.java](../backend/src/main/java/com/example/siteamame/service/file/UploadCompensation.java)) et annulation aussi sur une exception contrôlée (écart E31) ; tâche de purge ([StoragePurgeJob.java](../backend/src/main/java/com/example/siteamame/service/file/StoragePurgeJob.java), écarts E29 et E33), désactivée par défaut ; lignes orphelines : [delete-orphan-rows.sh](../ops/backup/delete-orphan-rows.sh) | supprimer les lignes orphelines après validation de la liste (action N.3) ; la purge reste désactivée jusqu'à l'étape 3.6 |
| — | Suppression d'un compte (C7) | 🟡 | [V4__user_deletion.sql](../backend/src/main/resources/db/migration/V4__user_deletion.sql) : jetons, permissions et liens vers les fichiers supprimés avec le compte ; adhésions, cotisations et dons conservés, détachés (décision du 7 novembre, écart E28) | recette (action N.5) |
| — | Adresse inconnue en 404 (C9) | 🟡 | gestionnaire de `NoResourceFoundException` dans `GlobalHandlerException` (écart E36) | — |
| — | Création d'une filière (C8) | 🟡 | `FiliereController.ajouterFiliere` lit la filière avec `@RequestPart`, comme la modification ; test [FiliereControllerTest.java](../backend/src/test/java/com/example/siteamame/controller/FiliereControllerTest.java) (8 novembre, écart E37) | recette (action N.6) |
| — | Compose et variables | 🟡 | `STORAGE_PURGE_ENABLED`, `STORAGE_PURGE_RETENTION`, `STORAGE_PURGE_SCHEDULE` ; ligne `SPRING_DATASOURCE_PASSWORD` retirée (E24) ; tags `backend-v1.3` et `ops-v1.1` | aucune variable à saisir : laisser la purge désactivée |

### Prochaine action

**Côté équipe**, dans cet ordre :

1. **Tout de suite** : ne lancer aucun `git pull` sur le serveur avant d'avoir mis les fichiers à l'abri (action A.1). Le commit qui retire `backend/uploads/` du suivi est déjà sur GitHub.
2. Régulariser Git (action A.2) : les étapes 0 et 1 sont déjà des commits locaux ; relire puis commiter l'étape 2.
3. ~~Lancer la suite de tests complète avant de déployer `backend-v1.3`~~ : **fait le 8 novembre 2026** en local, 70 tests, aucun échec. À relancer seulement si le code change d'ici le déploiement.
4. Dérouler les actions manuelles de l'étape 0 (A à F), puis celles de l'étape 1 (G à J), puis celles de l'étape 2 (K à N).
5. Noter ce qui a été constaté en production : faits relevés, critères remplis avec leur date.

**Côté implémentation, à la prochaine session** :

1. Reporter dans ce suivi les faits relevés et cocher les critères constatés, pour les étapes 0, 1 et 2.
2. Si la comparaison de l'action G.1 montre un écart entre la production et `V1__baseline.sql` : corriger V1 avant tout déploiement de l'étape 1.
3. Si l'inventaire croisé (action K.2) signale une anomalie bloquante : la traiter avant tout déploiement de l'étape 2.
4. Étape 3, sur demande de l'équipe : le code (3.2 : client et implémentation Bunny ; 3.3 : copie pilotée par les métadonnées ; 3.4 : réconciliation en mode rapport) peut s'écrire avant le déploiement des étapes précédentes, comme pour l'étape 2. Il ne s'éprouve vraiment qu'avec les zones Bunny `amame-public` et `amame-private` (action 3.1). Prérequis à intégrer : une migration V5 qui valide les contraintes `NOT VALID` et rend l'empreinte obligatoire, une fois les empreintes remplies à 100 % en production (écart E30).

### Actions manuelles en attente

À faire par l'équipe, **dans cet ordre**. Rien de ce qui suit n'a été fait : l'implémentation s'est arrêtée au dépôt local. Les actions A à F concernent l'étape 0, les actions G à J l'étape 1, les actions K à N l'étape 2.

**Deux façons de déployer.** Le plan demande de déployer l'étape 0, de constater ses 8 critères, puis de déployer l'étape 1 : un incident n'a alors qu'une cause possible. Déployer les deux ensemble reste possible (actions A à C et E.1, puis directement G à J avec les images `v1.2`), mais les critères des deux étapes se vérifient alors en même temps. Le choix se consigne dans les faits relevés.

#### A. Avant tout déploiement

1. **Protéger les fichiers du serveur. À faire en premier : le commit concerné est déjà publié.** Le commit `f5252df` est déjà sur GitHub (constaté le 5 octobre : `origin/main` pointe dessus). Il retire du suivi Git les 37 fichiers de `backend/uploads/` et les deux `.env`. Sur toute machine où le dépôt est cloné, le prochain `git pull` **efface ces fichiers du disque**. Ne lancer aucun `git pull` sur le serveur, et suspendre toute mise à jour automatique d'une stack Portainer déployée depuis Git, avant d'avoir fait ceci :

   ```bash
   cp -a backend/uploads /root/uploads-avant-etape0
   cp backend/.env /root/backend.env.avant-etape0
   cp frontend/.env /root/frontend.env.avant-etape0
   git pull
   cp -an /root/uploads-avant-etape0/. backend/uploads/
   ```

   Si `git pull` refuse d'écraser des modifications locales de ces fichiers, lancer d'abord `git checkout -- backend/.env frontend/.env` : les copies ci-dessus contiennent les valeurs du serveur.

   La même précaution vaut pour le dossier de travail de Portainer s'il déploie depuis Git, et pour le poste de chaque développeur.
2. **Régulariser Git.** Le commit `f5252df` ne contient que ces 39 retraits : le code de l'étape 0 n'y est pas. Pour que les étapes restent séparées, l'état exact du dépôt à la fin de chacune a été figé dans une branche locale, sans toucher à `main` :
   - `sauvegarde/etape-0` : commit `b14e7dd`, dont le parent est `f5252df` ;
   - `sauvegarde/etape-1` : commit `5c62c07`, dont le parent est `b14e7dd` (figé le 7 novembre 2026, avant l'étape 2).

   Depuis la racine du dépôt, sur `main` :

   ```bash
   git reset sauvegarde/etape-1     # main avance sur les commits des étapes 0 et 1 ; aucun fichier du disque n'est modifié
   git status                       # ne montre plus que les changements de l'étape 2
   git add -A
   git commit -m "Etape 2 : contrat de métadonnées et garde-fous en base"
   git push                         # avance simple : aucun push forcé n'est nécessaire
   ```

   Les deux branches de sauvegarde peuvent ensuite être supprimées (`git branch -d sauvegarde/etape-0 sauvegarde/etape-1`).
3. **Relever les faits** du tableau « Faits relevés en production », en particulier le chemin réel des uploads.

#### B. Sécurité, sans attendre le déploiement

1. **Auditer les comptes à privilèges.** Jusqu'à ce correctif, n'importe qui pouvait s'inscrire avec le rôle de son choix (écart E10). Lister les comptes concernés et vérifier que chacun est connu :

   ```bash
   docker exec amame-database psql -U postgres -d amame_db \
     -c "SELECT id, email, role FROM users WHERE role IN ('SUPERADMIN','ADMIN','EDITOR') ORDER BY role, id"
   ```

   Tout compte inconnu est à rétrograder ou à supprimer. S'il en existe un, considérer que les profils et les CV ont pu être consultés.
2. **Administrateur par défaut** : ses identifiants sont dans l'historique Git. Vérifier que son mot de passe a été changé ; sinon le changer tout de suite.
3. **Changer les secrets** exposés dans Git :
   - mot de passe d'application Gmail : le révoquer, en créer un nouveau ;
   - `JWT_SECRET` : `openssl rand -base64 32`. Les utilisateurs connectés devront peut-être se reconnecter ;
   - mot de passe de la base, **dans cet ordre** : `ALTER USER postgres PASSWORD '…'` dans le conteneur de la base, puis la même valeur dans `POSTGRES_PASSWORD`, puis mise à jour de la stack. Une variable différente du mot de passe réel empêche le backend de démarrer ;
   - Grafana : sans objet dès que la supervision est retirée (action I.4). D'ici là, changer le mot de passe du compte `admin` dans l'interface : la variable ne s'applique qu'à un volume neuf.

#### C. Bunny

1. Créer la zone de stockage `amame-backups` : Standard, Francfort, sans réplication, sans Pull Zone. Détail dans [ops/README.md](../ops/README.md).

#### D. Images Docker

1. Créer un `.env` local à partir de [.env.example](../.env.example), puis construire et publier :

   ```bash
   docker compose build backend frontend && docker compose push backend frontend
   docker compose -f ops/docker-compose.yml --env-file .env build
   docker compose -f ops/docker-compose.yml --env-file .env push
   ```

   Tags produits : `backend-v1.1`, `frontend-v1.1`, `ops-v1.0`, `scraper-v1.1`.

   Les images `backend-v1.1` et `frontend-v1.1` se construisent **depuis le commit de l'étape 0**, et non depuis `main` une fois l'étape 1 commitée : ses tags par défaut sont `v1.2`. Le plus simple est un second dossier de travail :

   ```bash
   git worktree add ../amame-etape-0 b14e7dd
   cp .env ../amame-etape-0/.env && cd ../amame-etape-0
   docker compose build backend frontend && docker compose push backend frontend
   ```

   Les images `ops-v1.0` et `scraper-v1.1` sont les mêmes pour les deux étapes.

#### E. Portainer

1. **Sécuriser Portainer** : interface non exposée publiquement (tunnel SSH ou VPN), mot de passe fort, version à jour (§3.1).
2. **Stack `amame`** : ajouter les variables `POSTGRES_PASSWORD`, `JWT_SECRET`, `PGADMIN_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`, `FRONTEND`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, les `MAIL_*`, et les deux tags d'image. Mettre la stack à jour. Si l'étape 0 est déployée seule, le compose à utiliser est celui de son commit (`git show b14e7dd:docker-compose.yml`) : il déclare encore la supervision, et `GRAFANA_ADMIN_PASSWORD` n'est à saisir que dans ce cas. La supervision disparaît avec le compose de l'étape 1 (écart E14).
3. **Supprimer l'ancien conteneur `amame-scraper`**, devenu orphelin : la stack `amame-ops` crée un conteneur du même nom.
4. **Stack `amame-ops`** : la créer avec les variables décrites dans [ops/README.md](../ops/README.md), puis lancer `backup.sh` et `restore-test.sh` depuis la console du conteneur `amame-ops-backup`.
5. **Conserver `BACKUP_PASSPHRASE` hors du serveur.** Sans elle, aucune sauvegarde n'est lisible.

#### F. Critères de sortie

Constater les critères de sortie de l'étape 0 (§5), puis les cocher avec leur date. Deux vérifications demandent une manipulation :

- **limitation de débit par visiteur** : envoyer une dizaine d'inscriptions rapprochées. Les 6 premières passent, les suivantes reçoivent 429. Vérifier ensuite dans le journal du conteneur `amame-frontend` que l'adresse enregistrée est celle du visiteur et non celle du proxy frontal. Si c'est celle du proxy, ajouter son adresse aux lignes `set_real_ip_from` de [frontend/nginx.conf](../frontend/nginx.conf) : sinon tous les visiteurs partagent le même quota ;
- **poids de l'accueil** : outils de développement du navigateur, onglet réseau, cache désactivé.

#### Retour arrière de l'étape 0

Remettre `BACKEND_IMAGE_TAG=backend-v1.0` et `FRONTEND_IMAGE_TAG=frontend-v1.0` dans la stack, les deux ensemble. Les images `v1.0` rouvrent l'accès public aux fichiers privés et la faille des rôles : à n'utiliser que le temps de corriger.

#### G. Avant de déployer l'étape 1

1. **Comparer le schéma de production à `V1__baseline.sql`.** Ce fichier a été produit à partir des entités, sur un PostgreSQL 15 neuf, et non à partir de la production, à laquelle l'implémentation n'a pas accès (écart E16). Sur le serveur :

   ```bash
   docker exec amame-database pg_dump -U postgres --schema-only --no-owner --no-privileges amame_db > schema-production.sql
   ```

   Le fichier obtenu ne contient aucune donnée, seulement la structure. Le copier à la racine du dépôt, sans le commiter, puis :

   ```bash
   diff <(grep -vE '^(SET |SELECT pg_catalog|\\|--|$)' schema-production.sql) \
        <(grep -vE '^(--|$)' backend/src/main/resources/db/migration/V1__baseline.sql)
   ```

   - **aucune différence** : rien à faire ;
   - **une table ou une colonne absente en production** : le backend de l'étape 1 refuserait de démarrer (`validate`). Ne pas déployer, transmettre la différence ;
   - **une colonne en trop, une contrainte `CHECK` plus ancienne, un nom de contrainte différent** : sans effet sur le démarrage, mais V1 doit décrire la production. Transmettre la différence pour corriger V1 avant le déploiement.

   Le résultat se consigne dans les faits relevés.
2. **Relever la mémoire du backend actuel** : `docker stats --no-stream amame-backend`. Elle servira de point de comparaison (écart E22).

#### H. Images de l'étape 1

Les images `backend-v1.2` et `frontend-v1.2` se construisent **depuis le commit de l'étape 1** (`5c62c07`), et non depuis `main` une fois l'étape 2 commitée : ses tags par défaut sont `backend-v1.3`. Comme pour l'étape 0, par un second dossier de travail :

```bash
git worktree add ../amame-etape-1 5c62c07
cp .env ../amame-etape-1/.env && cd ../amame-etape-1
docker compose build backend frontend && docker compose push backend frontend
```

Tags produits : `backend-v1.2` et `frontend-v1.2`. Les images `ops-v1.0` et `scraper-v1.1` ne changent pas. L'image `ops-v1.1` de l'étape 2 peut les remplacer dès maintenant (action L).

#### I. Stack `amame` dans Portainer

1. **Compose.** Si la stack n'est pas déployée depuis le dépôt Git, remplacer son contenu par celui de l'étape 1 (`git show 5c62c07:docker-compose.yml`) : celui de `main` est déjà celui de l'étape 2, qui ne permet plus le retour arrière vers `backend-v1.1` (E24). Vérifier que `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` et `SPRING_JPA_HIBERNATE_DDL_AUTO` n'y figurent plus : `SPRING_JPA_HIBERNATE_DDL_AUTO=update` rendrait à Hibernate le droit de modifier le schéma.
2. **Variables.** Retirer `GRAFANA_ADMIN_PASSWORD`. Passer `BACKEND_IMAGE_TAG=backend-v1.2` et `FRONTEND_IMAGE_TAG=frontend-v1.2`. Aucune variable nouvelle n'est obligatoire : tant que la base est sur le VPS, le backend se connecte avec `POSTGRES_PASSWORD`. Laisser `MEDIA_BASE_URL` vide et `STORAGE_PROVIDER` à `local`.
3. **Mettre la stack à jour.** Si Portainer refuse le compose sur une erreur d'interpolation à propos de `${DATABASE_PASSWORD:-${POSTGRES_PASSWORD}}`, sa version de Compose est trop ancienne pour les valeurs par défaut imbriquées : mettre Portainer à jour, ou définir `DATABASE_PASSWORD` et `DATABASE_MIGRATION_PASSWORD` avec la valeur de `POSTGRES_PASSWORD`.
4. **Supervision.** Supprimer les conteneurs `amame-prometheus`, `amame-grafana` et `amame-postgres-exporter` s'ils existent encore, puis les volumes `prometheus_data` et `grafana_data` de la stack. Ils ne contiennent aucune donnée métier.

#### J. Vérifications après le déploiement de l'étape 1

1. **Journal du backend**, au premier démarrage : `Successfully baselined schema with version: 1`, puis `Schema "public" is up to date`, puis `Started SiteAmameApplication`. Une erreur `Schema-validation` signale un écart entre la production et les entités : revenir en arrière (ci-dessous) et transmettre le message.
2. **Journal du frontend** : `40-runtime-config.sh : mediaBaseUrl="", mediaOptimizerEnabled=false`.
3. **Critères de sortie de l'étape 1** (§5), à cocher avec leur date :

   | Critère | Comment le constater |
   | --- | --- |
   | Baseline Flyway, `validate` sans erreur | journal du backend, point 1 |
   | Recette identique à avant | pages publiques, connexion et déconnexion, création puis suppression d'un article de test avec image, inscription d'un compte de test avec CV et photo |
   | 2 à 3 requêtes SQL par liste publique | mesuré en local : 1 à 3 (journal du 5 octobre). En production, la recette suffit |
   | Concours sans fichier visibles | créer un concours sans fichier depuis l'administration : il apparaît dans la liste publique et sa page s'ouvre |
   | Avatar de la Navbar | compte avec photo, fenêtre de largeur tablette |
   | Développement local sous Windows | constaté le 5 octobre sur un poste Windows : ce critère ne se vérifie pas en production |
   | URL des médias changée sans nouvelle image | mettre `MEDIA_BASE_URL=https://amame.ml` (valeur sans risque : les fichiers restent servis par le site), puis mettre la stack à jour. `https://amame.ml/config.js` affiche la valeur et les images des articles pointent vers `https://amame.ml/uploads/…`. Remettre la variable vide ensuite |
4. **Mémoire** : `docker stats --no-stream amame-backend` après 24 heures, puis après une semaine. Valeur attendue : environ 400 Mio sur 512. Au-delà de 460 Mio, le signaler avant d'aller plus loin.

#### Retour arrière de l'étape 1

Remettre `BACKEND_IMAGE_TAG=backend-v1.1` et `FRONTEND_IMAGE_TAG=frontend-v1.1` dans la stack, les deux ensemble, sans changer le compose : il transmet encore le nom de variable que lit `backend-v1.1`. La table `flyway_schema_history` reste en base, sans effet sur l'ancienne version. Rejoué en local le 5 octobre : l'ancien backend, lancé avec les variables du compose de l'étape 1 sur une base déjà passée par l'étape 1, démarre, répond, et ne touche pas au schéma. Le compose de l'étape 2 ne transmet plus `SPRING_DATASOURCE_PASSWORD` (E24) : ce retour arrière se fait avec le compose de l'étape 1 (`git show 5c62c07:docker-compose.yml`).

#### K. Avant de déployer l'étape 2

1. **L'étape 1 est en production et ses critères sont constatés** (§5.0). La suite de tests complète a été lancée une fois avec succès (`./mvnw test`) : fait le 8 novembre 2026, à refaire si le code a changé depuis.
2. **Inventaire croisé.** Mettre la stack `amame-ops` à jour avec l'image `ops-v1.1` (action L), puis, dans la console du conteneur `amame-ops-backup` :

   ```bash
   inventory.sh
   ```

   Il doit se terminer par `inventaire conforme`. Sinon, **ne pas déployer** : une clé en double ferait échouer la migration V2 ; une référence cassée ou une ligne partagée est à traiter d'abord (tableau dans [ops/README.md](../ops/README.md)). Consigner les compteurs dans les faits relevés.
3. **Point de restauration** : lancer `backup.sh` juste avant la mise à jour de la stack.

#### L. Images de l'étape 2

Depuis `main`, une fois l'étape 2 commitée :

```bash
docker compose build backend && docker compose push backend
docker compose -f ops/docker-compose.yml --env-file .env build backup
docker compose -f ops/docker-compose.yml --env-file .env push backup
```

Tags produits : `backend-v1.3` et `ops-v1.1`. Le frontend ne change pas (`frontend-v1.2`). `ops-v1.1` contient les mêmes scripts de sauvegarde que `ops-v1.0`, plus les trois outils de l'étape 2 : il peut servir dès l'étape 0.

#### M. Stack `amame` dans Portainer

1. Passer `BACKEND_IMAGE_TAG=backend-v1.3`. Ne rien changer d'autre : `STORAGE_PURGE_ENABLED` reste absent ou à `false`. La purge ne s'active qu'à l'étape 3.6 ; d'ici là, la file se remplit sans que rien soit effacé.
2. Si la stack n'est pas déployée depuis le dépôt Git, remplacer son contenu par [docker-compose.yml](../docker-compose.yml).
3. Mettre la stack à jour.

#### N. Vérifications après le déploiement de l'étape 2

1. **Journal du backend** : `Migrating schema "public" to version "2 - file metadata contract"`, puis versions 3 et 4, puis `Started SiteAmameApplication`. En cas d'erreur, revenir en arrière (ci-dessous) et transmettre le message.
2. **Empreintes** : `backfill-sha256.sh` (simulation), puis `backfill-sha256.sh --apply`. Objectif : `0 sans empreinte`. Les lignes restantes sont expliquées par le script (fichier absent, taille différente, clé refusée).
3. **Lignes orphelines** : `delete-orphan-rows.sh` affiche la liste ; la faire valider, puis `delete-orphan-rows.sh --apply`. Leurs fichiers restent sur le disque, en attente de purge.
4. **Inventaire** : `inventory.sh` à nouveau. Attendu : `inventaire conforme`, `lignes orphelines : 0`, `sans empreinte SHA-256 : 0`.
5. **Critères de sortie de l'étape 2** (§5), à cocher avec leur date. Requêtes SQL : `docker exec -it amame-database psql -U postgres -d amame_db`.

   | Critère | Comment le constater |
   | --- | --- |
   | Remplacement de l'image d'un article : nouvelle ligne, ancienne supprimée, entrée dans la file, ancien fichier encore présent | remplacer l'image d'un article de test. `SELECT object_key, requested_at FROM storage_purge_queue ORDER BY id DESC LIMIT 1;` donne l'ancienne clé ; le fichier correspondant est toujours dans le dossier des uploads |
   | Après la rétention, fichier effacé et entrée marquée purgée | test `FileLifecycleIntegrationTest` (rétention raccourcie). En production, la purge n'est activée qu'à l'étape 3.6 |
   | Erreur après l'upload : aucun fichier ne reste | créer un article avec image et un titre déjà utilisé : erreur attendue. Le nombre de fichiers de `actualite/` ne change pas (`ls <uploads>/actualite \| wc -l` avant et après) |
   | Suppression d'un utilisateur : CV et photo dans la file | créer un compte de test avec CV et photo, s'y connecter une fois, puis le supprimer depuis l'administration : la suppression réussit (C7) et deux entrées apparaissent dans la file |
   | Modification de `file_path` refusée par la base | `BEGIN; UPDATE file_entity SET file_path = file_path \|\| 'x' WHERE id = (SELECT min(id) FROM file_entity); ROLLBACK;` : erreur `file_entity.file_path est immuable` |
   | Empreinte pour 100 % des lignes | `SELECT count(*) FILTER (WHERE file_sha256 IS NULL), count(*) FROM file_entity;` : 0 en première colonne |
   | Zéro référence cassée | `inventory.sh`, point 4 |

6. **Création d'une filière (C8)** : depuis l'administration, créer une filière de test avec une image, puis une sans image. Les deux réussissent et apparaissent dans la liste ; un nom vide est refusé par un message d'erreur, et non plus par une erreur 500. Supprimer ensuite les filières de test.

#### Retour arrière de l'étape 2

Remettre `BACKEND_IMAGE_TAG=backend-v1.2`, sans toucher au schéma. Les migrations V2 à V4 sont additives : `backend-v1.2` crée toujours des clés neuves, conformes, avec MIME et taille ; Hibernate ignore la colonne et la table ajoutées ; Flyway ignore les migrations plus récentes que celles qu'il connaît. Deux conséquences à connaître, sans gravité :

- `backend-v1.2` efface encore l'ancien fichier lors d'un remplacement et laisse sa ligne : `inventory.sh` la montrera comme ligne orpheline au fichier absent, à supprimer par `delete-orphan-rows.sh` au retour en `v1.3` ;
- si un compte qui avait une adhésion a été supprimé sous `v1.3`, l'adhésion détachée fait échouer la liste des adhésions de `v1.2` : supprimer ces adhésions (`DELETE FROM adhesions WHERE user_id IS NULL;`) ou revenir en `v1.3` ;
- la création d'une filière échoue de nouveau (C8), sans effet sur les données.

Ce retour arrière est déduit du code et des migrations ; il n'a pas été rejoué (écart E27).

### Faits relevés en production

Valeurs à relever une fois, puis à réutiliser dans toutes les étapes suivantes.

| Fait | Valeur | Relevé le |
| --- | --- | --- |
| Chemin réel du dossier des uploads sur l'hôte (§3.1, point 4) | *à relever dans Portainer : conteneur backend, onglet des volumes* | — |
| Nom du réseau Docker de la stack `amame` | *à relever avec `docker network ls` ; valeur attendue : `amame_common_net`* | — |
| Valeur effective de `COOKIE_DOMAIN` en production (étape 3.1) | *à relever dans les variables de la stack* | — |
| Proxy frontal devant le conteneur Nginx (TLS) : sur le même hôte ou ailleurs ? | *à confirmer ; OpenResty d'après [B02 §4.10]* | — |
| Le mot de passe de l'administrateur par défaut a-t-il été changé ? | *à vérifier* | — |
| La production définissait-elle `JWT_SECRET`, ou utilisait-elle la valeur par défaut du compose ? | *à vérifier dans les variables de la stack* | — |
| Comptes `SUPERADMIN`, `ADMIN` et `EDITOR` : tous connus ? | *à vérifier (action B.1)* | — |
| Poids des images de l'accueil, mesuré en production | *à mesurer ; estimation locale : 270 à 300 Ko pour la page entière* | — |
| Déploiement de l'étape 0 seule, ou avec l'étape 1 ? | *à consigner* | — |
| Le serveur ou Portainer récupèrent-ils le dépôt par `git pull` ? Les fichiers ont-ils été mis à l'abri avant (action A.1) ? | *à confirmer avant tout `pull`* | — |
| Schéma de production comparé à `V1__baseline.sql` (action G.1) | *à faire avant de déployer l'étape 1* | — |
| Mémoire du conteneur `amame-backend` : avant l'étape 1, puis 24 heures et une semaine après | *à relever avec `docker stats` ; mesuré en local sous charge : 396 Mio sur 512* | — |
| Portainer accepte-t-il les valeurs par défaut imbriquées du compose (action I.3) ? | *à constater à la mise à jour de la stack* | — |
| Suite de tests complète (`./mvnw test`) avec les tests de l'étape 2 | `BUILD SUCCESS` : 70 tests, 0 échec, 8 min 07 (en local, Docker Desktop) | 8 novembre 2026 |
| Inventaire croisé avant l'étape 2 (action K.2) : compteurs de chaque catégorie | *à relever* | — |
| Empreintes et lignes orphelines après l'étape 2 (actions N.2 à N.4) | *à relever : lignes sans empreinte, lignes orphelines supprimées* | — |

### Écarts et décisions prises pendant l'implémentation

| # | Sujet | Ce que prévoyait le rapport | Ce qui a été fait, et pourquoi |
| --- | --- | --- | --- |
| E1 | Endpoint des fichiers privés | étape 1 | **avancé à l'étape 0.** Fermer `/uploads/utilisateur/` sans lui aurait cassé les avatars (Navbar, espace membre, liste des utilisateurs) et la consultation des CV par les administrateurs jusqu'à la fin de l'étape 1. Sont donc déjà livrés : `PrivateFileController`, `StoragePaths`, `FileStorageService.load`, et les champs `imageUrl` et `cvUrl` de `UserReponseDto`. C'est la conception finale de [B02 §4.9], pas du code provisoire |
| E2 | Second chemin public vers les fichiers privés | seul `/uploads/utilisateur/` était cité | Nginx sert aussi `/app/uploads/` sous l'alias `/amame-uploads/` : un CV était lisible par `/amame-uploads/utilisateur/<uuid>.pdf`. Les deux chemins renvoient désormais 404. Le critère de sortie est étendu |
| E3 | Forme de la sauvegarde des fichiers | « une archive du dossier des uploads » | copie **par fichier, chiffrée, en ajout seul** (`files/<clé>.gpg`), c'est-à-dire la conception de DT9 dès maintenant. Une archive complète deux fois par jour aurait renvoyé tout le dossier à chaque fois. Les fichiers sont copiés avant **et** après le dump : un fichier ajouté ou remplacé pendant l'opération reste couvert |
| E4 | Test de restauration | « un environnement jetable » | instance PostgreSQL temporaire démarrée **dans** le conteneur d'exploitation, puis détruite : aucun accès au socket Docker n'est nécessaire. L'image embarque la même version majeure que la base sauvegardée (`OPS_PG_MAJOR`, 15 aujourd'hui) : un dump se restaure ainsi sans surprise dans la version qui l'a produit, y compris dans la base de production |
| E5 | Variables de `amame-ops` | `NEON_BACKUP_URL` ; `BACKUP_DB_SCHEDULE` sans format précisé | `BACKUP_DATABASE_URL` (nom neutre : la variable désigne d'abord la base locale, et §6.2 écarte les noms liés à un fournisseur) ; `BACKUP_DB_SCHEDULE` est une liste d'heures `HH:MM` en UTC. Ajouts : `BACKUP_DB_RETENTION_DAYS`, `UPLOADS_HOST_PATH`, `AMAME_NETWORK`, `OPS_IMAGE_TAG`, `SCRAPER_IMAGE_TAG`, `OPS_PG_MAJOR`. Le §7 est mis à jour |
| E6 | Tags d'image et variables de la stack `amame` | étape 1 | `BACKEND_IMAGE_TAG` et `FRONTEND_IMAGE_TAG` existent dès maintenant (valeurs par défaut `backend-v1.1` et `frontend-v1.1`), pour que le retour arrière de l'étape 0 se fasse déjà par une variable. `FRONTEND`, `COOKIE_DOMAIN` et `COOKIE_SECURE` deviennent surchargeables, valeurs par défaut inchangées |
| E7 | Lancement du scraper | « conteneur ponctuel » | conteneur en veille (`sleep infinity`), scripts lancés depuis la console Portainer. Portainer ne sait pas exécuter `docker compose run` |
| E8 | pgAdmin | lié à `127.0.0.1` | fait. Il reste en mode « desktop », sans écran de connexion : le passer en mode serveur imposerait de recréer son volume, et il disparaît à l'étape 6. L'accès exige désormais un tunnel SSH |
| E9 | Mémoire JVM | « `-Xmx` aligné sur la limite » | réglage **mesuré** sous charge, limite simulée à 512 Mo. Le tas est un pourcentage de la limite (`MaxRAMPercentage=40`) et le ramasse-miettes est le ramasse-miettes série. Trois mesures du total engagé par la JVM : 550 Mo avec un tas à 60 % et G1, donc au-dessus de la limite ; 500 Mo à 40 % avec G1 ; **440 Mo à 40 % avec le ramasse-miettes série**. L'application n'utilise réellement que 50 Mo de tas : c'est le hors-tas, environ 230 Mo, qui pèse. L'ancien réglage (`-Xms512m -Xmx2g` dans 512 Mo) exposait à des arrêts brutaux par le noyau |
| E10 | **Faille : rôle choisi par le visiteur** | non identifiée par les audits | `POST /api/visitor/register`, public, appliquait le champ `role` de la requête : **une seule requête anonyme créait un compte `SUPERADMIN`**. `PUT /api/user/update/{id}` permettait de même à tout utilisateur de se promouvoir. Constaté par un test réel, puis corrigé : l'inscription crée toujours un `USER`, la mise à jour du profil ne touche plus au rôle. Seul `PUT /api/admin/users/{id}/role`, qui vérifie la hiérarchie, change un rôle ; le formulaire d'administration passe par lui. Sans ce correctif, fermer l'accès aux fichiers privés ne protégeait rien : un compte `SUPERADMIN` auto-créé lisait tous les CV |
| E11 | **Faille : profils lisibles par tout utilisateur connecté** | non identifiée par les audits | `GET /api/user/{id}` renvoyait l'e-mail, le téléphone, l'adresse et la date de naissance de n'importe quel utilisateur à n'importe quel compte, et l'inscription est ouverte. Désormais réservé au propriétaire et aux titulaires de `USER_READ_ALL`. Au passage, un refus `@PreAuthorize` renvoie 403 et non plus 500 |
| E12 | Images statiques | conversion à l'étape 0, renommage ASCII et `srcset` à l'étape 5 | tout est fait à l'étape 0 : noms ASCII avec la largeur, dossier `public/static/`, `srcset` et `sizes`. Les originaux quittent `public/` pour [frontend/image-sources/](../frontend/image-sources/), exclu de l'image Docker ; le script [optimize_images.py](../frontend/scripts/optimize_images.py) régénère les sorties. L'étape 5 se réduit à déplacer `static/` derrière le CDN en changeant une constante |
| E13 | Favicon | « nouveau favicon » | `favicon.svg` (583 Ko, une image matricielle encodée dans du SVG) est supprimé sans remplaçant vectoriel : les icônes PNG et ICO déjà présentes suffisent à tous les navigateurs. Redessiner le logo en vectoriel reste possible, sans urgence |
| E14 | **Supervision retirée** | Prometheus et Grafana restent dans la stack `amame` ; seul `postgres-exporter` disparaît (§3.2) | **décision de l'équipe du 4 octobre 2026 : toute la supervision est retirée pour le moment.** Grafana n'a que Prometheus pour source, et `postgres-exporter` que Prometheus pour lecteur : les trois partent ensemble. Retirés : les 3 services et leurs 2 volumes, `GRAFANA_ADMIN_PASSWORD`, le dossier `monitoring/`, la dépendance `micrometer-registry-prometheus` et l'endpoint `/actuator/prometheus`. pgAdmin reste : c'est un outil d'administration de la base, qui disparaît à l'étape 6. Conséquences : le constat C1 n'a plus d'objet ; les métriques du pool (validation de DT5) se lisent à la demande dans `/actuator/metrics/hikaricp.connections.active` ; aucune alerte automatique n'existe d'ici le retour de la supervision, prévu avec A3 (§13). Pour la remettre : reprendre les services et `monitoring/` du commit de l'étape 0 (`b14e7dd`), où ils n'écoutent déjà plus que sur `127.0.0.1`, rajouter la dépendance, et ouvrir `/actuator/prometheus` au collecteur (C1) |
| E15 | Ordre des étapes | une étape ne commence que lorsque la précédente remplit ses critères en production (§5.0) | le **code** de l'étape 1 a été écrit avant le déploiement de l'étape 0, à la demande de l'équipe (4 octobre). La règle reste vraie pour la production : étape 0, ses 8 critères, puis étape 1. Les deux codes sont séparés dans Git (branche `sauvegarde/etape-0`) et dans les images (`v1.1`, `v1.2`) |
| E16 | Origine de `V1__baseline.sql` | `pg_dump --schema-only` de la production [N02 §4.3] | l'implémentation n'a pas accès à la production. V1 est le schéma que crée Hibernate à partir des entités sur un PostgreSQL 15 neuf, extrait par `pg_dump`. Retirés du fichier : les réglages de session (`SET …`, `search_path`), qui resteraient actifs pour V2 et V3 sur une base neuve, et les lignes `\restrict` qu'ajoutent les versions récentes de `pg_dump` (constaté avec la 15.19) : ce sont des commandes psql, Flyway ne les comprend pas. **La comparaison avec la production reste à faire avant le déploiement** (action G.1) |
| E17 | Variables de l'étape 1 | action 1 : « paramètres du pool, de la purge et de la réconciliation pilotés par variables » ; §7 introduit pourtant la purge à l'étape 2 et la réconciliation à l'étape 3 | le §7 fait foi : une variable n'est déclarée qu'avec le code qui la lit, pour qu'aucune ne soit sans effet. Les variables de purge, de réconciliation et de Bunny arriveront aux étapes 2 et 3. Deux variables manquaient au §7 et y sont ajoutées : `PUBLIC_LISTS_CACHE_TTL` (le plan prévoyait le cache, pas son interrupteur) et `AUTH_TOKEN_CLEANUP_SCHEDULE` (E21). Les cinq variables `DATABASE_*` ont une valeur par défaut dans le compose tant que la base est sur le VPS (`${DATABASE_PASSWORD:-${POSTGRES_PASSWORD}}`) : un seul mot de passe à tenir à jour, et rien à saisir à l'étape 1. Les durées du pool s'écrivent en millisecondes |
| E18 | Validation des uploads | images limitées à 5 Mo, documents à 10 Mo [B02 §4.10] | une seule limite, 10 Mo, celle d'aujourd'hui. Limiter les images à 5 Mo avant que le navigateur les compresse (étape 5) ferait refuser les photos de téléphone : la limite de 5 Mo est reportée à l'étape 5. DOCX et XLSX sont reconnus par leur contenu (répertoire central de l'archive, sans rien décompresser) et non par leur extension ; une archive ZIP quelconque est refusée. Un fichier refusé renvoie 400 avec un message, et non plus 500. Côté formulaires : les images proposent JPEG, PNG, GIF et WebP au lieu de `image/*` ; le formulaire des ressources ne propose plus PPT et PPTX, que le backend n'a jamais acceptés |
| E19 | Tests sur PostgreSQL | image `postgres:17` [N02 §4.6] ; H2 conservé | l'image du test suit la version de la base de production : **15 aujourd'hui, 17 à l'étape 4**, comme `OPS_PG_MAJOR`. V2 et V3 s'exécuteront d'abord sur la base du VPS, en 15 : c'est cette version qu'il faut éprouver. L'autre s'essaie par `-Dtest.postgres.image=postgres:17-alpine` (fait le 5 octobre : V1 passe en 17). H2 et `data.sql` (dialecte H2, jamais exécuté) sont retirés : les migrations ne tournent pas sur H2 (DT4). Testcontainers est fixé à 1.21.4 : la version 1.20 que gère Spring Boot 3.4 ne dialogue pas avec Docker 29 |
| E20 | Cache des listes publiques | « préparé mais désactivé », sans autre précision | annotation `@PublicListCache` sur les 22 endpoints publics de liste, au niveau du contrôleur : une réponse trouvée dans le cache n'ouvre aucune transaction, donc ne touche pas la base (une transaction en lecture seule emprunte une connexion dès son ouverture). Un seul point de vidage : toute requête d'écriture sur `/api/admin/**`. Les pages de détail ne sont pas mises en cache (compteur de vues). Activé par `PUBLIC_LISTS_CACHE_TTL` (une durée ; 0 par défaut). Les écritures faites hors de l'API (scrapers) et les compteurs de vues des listes prennent au plus cette durée de retard |
| E21 | Tâche planifiée oubliée par le plan | le plan ne recense que le dump, la purge, la copie et la réconciliation | le nettoyage des jetons de session expirés tournait toutes les 24 heures à partir du démarrage du backend, donc à une heure quelconque : un réveil de la base par jour hors de la fenêtre de nuit. Il passe à 02:30 UTC (`AUTH_TOKEN_CLEANUP_SCHEDULE`), avec les sauvegardes |
| E22 | **Mémoire du backend** (révise E9) | « toute dépendance qui alourdit le hors-tas doit s'accompagner d'une nouvelle mesure » | nouvelle mesure, et **changement de méthode : c'est la mémoire du conteneur qui compte, pas le total que déclare la JVM.** Sous la charge de l'étape 0 (18 inscriptions avec un CV de 7 Mo, puis 24 lectures), le jar de l'étape 0 occupe 482 Mio sur 512, alors que la JVM en déclare 399 : les 440 Mo retenus par E9 sous-estimaient le besoin, et la marge réelle était de 30 Mio. Les 80 Mio manquants sont de la mémoire native que la JVM ne suit pas : tampon gardé par chaque thread à la taille de sa plus grosse lecture de fichier, et fragmentation de l'allocateur. Flyway et les caches ne coûtent que 4 Mio. Corrections : fichiers lus par blocs de 8 Ko ([StorageIo.java](../backend/src/main/java/com/example/siteamame/service/file/StorageIo.java)), `-Djdk.nio.maxCachedBufferSize=262144`, `MALLOC_ARENA_MAX=2`, et tas ramené de 40 % à 30 % (148 Mio, pour 49 Mio réellement occupés après un ramassage complet). Résultat sous la même charge : **396 Mio**, et le conteneur n'atteint plus sa limite (pic à 433). Détail dans le journal du 5 octobre |
| E23 | `STATIC_BASE` du frontend | devait lire la configuration d'exécution dès l'étape 1 (note du 3 octobre) | reste `/static` jusqu'à l'étape 5. Les images statiques ne rejoignent le CDN qu'à l'étape 5 : si `STATIC_BASE` suivait `MEDIA_BASE_URL`, elles pointeraient vers le CDN dès la bascule de l'étape 3 et seraient toutes cassées pendant deux étapes |
| E24 | Retour arrière de l'étape 1 | « remettre les tags d'image précédents » | pour que ce soit vrai sans toucher au compose, celui-ci transmet encore `SPRING_DATASOURCE_PASSWORD`, seul nom que lit `backend-v1.1`. Sa valeur est toujours celle de `DATABASE_PASSWORD` : sans effet sur `backend-v1.2`. Ligne à retirer à l'étape 2 |
| E25 | Corrections faites au passage | — | trois corrections dans des fichiers que l'étape modifiait de toute façon. `JwtFilter` : un jeton encore valide d'un compte supprimé renvoie 401 et non plus 500. Comptage des catégories : les articles sans catégorie sont ignorés (ils provoquaient une erreur 500). `ConcoursRepository` : en plus de la jointure externe, les parenthèses des deux requêtes filtrées sont corrigées ([B01 §4.6]) ; les deux filtres se cumulent désormais, et un concours expiré n'apparaît plus dans une recherche |
| E26 | Frontend, au-delà du plan | — | serveur de développement : `/api` et `/uploads` sont relayés vers le backend local, sans quoi le critère « développement local sous Windows » ne peut pas être constaté. `config.js` : servi par le réseau d'abord, par la dernière copie connue hors ligne ou après 3 secondes d'attente. Balises Open Graph : une URL d'image relative est rattachée au domaine du site |
| E27 | **Étape 2 écrite sans les étapes précédentes en production, et sans les tests longs** | une étape commence quand la précédente remplit ses critères en production (§5.0) ; critères de l'étape 2 constatés par des tests Testcontainers | décision de l'équipe du 7 novembre 2026 : « on ignore les critères de sortie », c'est-à-dire qu'on ne lance pas les tests qui prennent énormément de temps. Ont été faits : compilation du code et des tests ; application de V1 à V4 sur un PostgreSQL 15 jetable avec un scénario SQL ; essai des trois scripts d'exploitation sur une base et un dossier factices. **N'ont pas été lancés** : la suite `./mvnw test` (dont `FileLifecycleIntegrationTest`, nouveau, et `SiteAmameApplicationTests`, adapté) ; aucun démarrage du backend ; le retour arrière par le tag n'a pas été rejoué. La suite complète est à lancer avant le déploiement (action K.1). L'étape 1 a été figée dans `sauvegarde/etape-1` avant toute modification. **Mise à jour du 8 novembre** : la suite complète a été lancée à la demande de l'équipe, 70 tests, aucun échec |
| E28 | Suppression d'un compte (C7) | « corriger d'abord la suppression d'un utilisateur » (notes de l'étape 2), sans règle pour les données liées | décision de l'équipe du 7 novembre 2026 : l'historique est conservé, détaché du compte. Migration V4 : jetons de session et de réinitialisation, permissions et liens `users_files` disparaissent avec le compte (`ON DELETE CASCADE`) ; adhésions, cotisations et dons gardent leur ligne avec `user_id` vide (`ON DELETE SET NULL`), comme `granted_by` des permissions accordées par le compte. Les noms des anciennes clés étrangères, générés par Hibernate, sont lus dans le catalogue et non écrits en dur (E16). Une adhésion détachée s'affiche « (compte supprimé) » (libellé fourni par le backend : le frontend ne change pas) et ne peut plus être approuvée ni rejetée (409), seulement supprimée. Les fichiers du compte sont supprimés par le backend (cascade), donc inscrits dans la file. Le motif de l'adhésion reste en base : à considérer pour la politique de confidentialité |
| E29 | Tâche de purge et connexions | « la purge réserve ses entrées en les verrouillant (SKIP LOCKED) » (DT8) | la réservation se fait dans une courte transaction (`SKIP LOCKED`, puis tentative datée), l'effacement **hors transaction**, puis une seconde courte transaction marque le résultat : aucune connexion n'est tenue pendant les appels au stockage (DT5). Une entrée réservée n'est reprise par une autre exécution qu'après 30 minutes ; une entrée en échec est reprise la nuit suivante. Au plus 50 lots de 100 par exécution. Ajouts : une entrée dont la clé est de nouveau référencée (restauration) est retirée de la file, jamais purgée ; une clé hors de `uploads/` n'est jamais effacée ; les entrées purgées sont supprimées après 60 jours (DT9) |
| E30 | Contraintes de V2 | format, MIME et taille « posés d'abord sans vérifier l'existant, puis validés une fois le nettoyage fait » ; empreinte remplie pour l'existant | les trois contraintes sont des `CHECK … NOT VALID` : appliquées à toute ligne insérée ou modifiée, sans contrôler l'existant. L'empreinte reste facultative en base : `backend-v1.2`, cible du retour arrière, n'en écrit pas. Une migration V5, à écrire quand l'inventaire et `backfill-sha256.sh` auront été passés en production, validera les trois contraintes et rendra l'empreinte obligatoire, avant la copie vers Bunny de l'étape 3, qui envoie l'empreinte de la base |
| E31 | Annulation sur exception contrôlée | « l'upload échoue proprement : rien en base, objet compensé » (DT5) | par défaut, Spring **valide** une transaction interrompue par une exception contrôlée (`IOException`) : une inscription dont la photo échouait après le CV laissait le CV en base. Les 14 méthodes d'écriture qui stockent un fichier et déclarent `IOException` passent en `@Transactional(rollbackFor = Exception.class)` ; les autres convertissaient déjà l'exception |
| E32 | `TRUNCATE file_entity` | non prévu | un `TRUNCATE` ne déclenche pas les déclencheurs de ligne : il viderait la table sans rien inscrire dans la file. Un déclencheur de V3 le refuse. `pg_restore` ne l'utilise pas |
| E33 | Unité de la rétention | « 10 jours » | `STORAGE_PURGE_RETENTION` accepte une durée (`10d`) ; un nombre seul compte des **jours**, car Spring le lirait sinon en millisecondes et purgerait tout à la première nuit. Le backend refuse de démarrer, purge activée, avec une rétention de moins d'un jour |
| E34 | Inventaire croisé | cinq catégories (§5, 2.1) | en plus : « ligne partagée » (référencée par plusieurs entités ; bloquante, car `orphanRemoval` supprimerait la ligne encore utilisée par l'autre), « fichier en attente de purge », écarts de taille, clés hors format, noms incohérents avec la clé, MIME ou taille manquants, empreintes manquantes. Session SQL en lecture seule imposée au serveur. `backfill-sha256.sh` ne remplit une empreinte que si la taille du disque correspond à celle de la base, et complète MIME et taille manquants (paquet `file` ajouté à l'image, d'où `ops-v1.1`). `delete-orphan-rows.sh` ne retient que les lignes de plus de 2 jours, et refuse de supprimer tant que le déclencheur de V3 n'existe pas |
| E35 | Colonne `file_entity.user_id` | non relevée | elle existe (relation `File.user`) mais n'est jamais remplie : le lien entre un compte et ses fichiers passe par `users_files`. Conservée telle quelle pour ne pas mêler un nettoyage de schéma à l'étape ; sa clé étrangère passe en `ON DELETE SET NULL` (V4). À retirer plus tard, avec la relation |
| E36 | Constat C9 corrigé à l'étape 2 | « à faire avant l'étape 3 » | une adresse inconnue renvoie 404 (`NoResourceFoundException`), et non plus 500 |
| E37 | Constat C8 corrigé à l'étape 2 | « sans rapport avec la migration », non retenu le 7 novembre | corrigé le 8 novembre à la demande de l'équipe, dans le même tag `backend-v1.3` : la partie JSON `filiere` est lue par `@RequestPart`, comme pour la modification et pour les autres contrôleurs. Un nom vide renvoie désormais 400 (validation `@Valid`, déjà présente mais jamais atteinte). La modification d'une filière n'est pas validée (`@Valid` absent) : comportement inchangé, hors du périmètre de C8 |

**Constats hors du périmètre de l'étape 0**, à traiter ou à planifier :

| # | Constat | Gravité | Proposition |
| --- | --- | --- | --- |
| C1 | Prometheus ne peut pas lire `/actuator/prometheus` : tout `/actuator/**` exige une authentification, la collecte reçoit 401 | — | **sans objet depuis le 4 octobre** : la supervision est retirée (E14). À traiter le jour où elle revient |
| C2 | `npm run lint` plante au chargement d'une règle (ESLint 9.38 et `typescript-eslint` incompatibles) | 🟡 | aligner les versions ; aucun rapport avec la migration |
| C3 | `npx tsc --noEmit` signale 4 erreurs antérieures à ce travail (`LayoutMembre.tsx`, `LienUtileForm.tsx`, `MembreForm.tsx`, `PartenaireForm.tsx`). Le build ne lance pas `tsc`, donc il passe | 🟡 | à corriger ; les trois formulaires appellent `.find` sur une réponse paginée et ne peuvent pas fonctionner |
| C4 | `./mvnw test` exige une base PostgreSQL locale sur le port 5454 : le seul test d'intégration ne tourne pas ailleurs | — | **réglé à l'étape 1** : le test lance son propre PostgreSQL (Testcontainers). Seul Docker est nécessaire |
| C5 | `public/images/grid-image/` (6 fichiers, 2,4 Mo) n'est utilisé que par trois composants de gabarit jamais importés (`src/components/ui/images/`) | 🟡 | supprimer les composants et le dossier |
| C6 | La mise à jour du profil accepte un nouvel e-mail sans vérification, et ignore le mot de passe envoyé par le formulaire d'administration | 🟡 | à étudier séparément |
| C7 | **Un compte qui s'est déjà connecté ne peut pas être supprimé** : `DELETE /api/admin/user/{id}` échoue (500) sur la clé étrangère de `refresh_token`. Il en va sans doute de même pour un compte qui a une adhésion, une cotisation, un don ou un jeton de réinitialisation | 🟠 | **corrigé dans le dépôt le 7 novembre 2026** (migration V4, écart E28) ; à constater en production (action N.5) |
| C8 | **La création d'une filière par l'API échoue toujours** (500) : `FiliereController.ajouterFiliere` lit la filière avec `@RequestParam` au lieu de `@RequestPart`. La modification fonctionne | 🟠 | **corrigé dans le dépôt le 8 novembre 2026** (écart E37) ; à constater en production (action N.6) |
| C9 | Toute adresse inconnue du backend renvoie 500 au lieu de 404 : le gestionnaire d'erreurs générique intercepte aussi « ressource introuvable » | 🟡 | **corrigé dans le dépôt le 7 novembre 2026** (écart E36) |
| C10 | `/actuator/health` ouvre une connexion SMTP à chaque appel et passe à `DOWN` si Gmail ne répond pas | 🟡 | n'interroger que `/actuator/health/liveness` et `/actuator/health/readiness`, qui n'en dépendent pas ; ou désactiver l'indicateur `mail` |

### Notes pour les étapes suivantes

Ce qui a été anticipé, et ce qu'il ne faudra pas oublier.

- **Étape 2, livrée dans le dépôt le 7 novembre 2026.** [SiteAmameApplicationTests.java](../backend/src/test/java/com/example/siteamame/SiteAmameApplicationTests.java) attend désormais « version 4, 26 tables ». Toute nouvelle migration change ces deux nombres.
- **Avant l'étape 3 : migration V5** (E30). Une fois `backfill-sha256.sh` passé en production avec 0 ligne sans empreinte et l'inventaire conforme : `VALIDATE CONSTRAINT` des trois contraintes `NOT VALID` de V2, puis `file_sha256` en `NOT NULL`. Elle échoue si une ligne ne respecte pas une contrainte : la faire précéder d'un nouvel `inventory.sh`.
- **Étape 3.** L'implémentation Bunny de `FileStorageService` doit : appeler `UploadCompensation.deleteOnRollback(key, this)` juste après l'envoi ; envoyer l'en-tête `Checksum` avec `ValidatedFile.sha256()` en majuscules (comme `bunny_put` dans [lib.sh](../ops/backup/lib.sh)) ; rendre `delete(key)` idempotent (404 = succès) ; refuser toute clé hors de `uploads/`. La tâche de purge n'a rien à changer : elle appelle `delete(key)`. L'activer (`STORAGE_PURGE_ENABLED=true`) à l'étape 3.6 seulement.
- **Étape 3.** `inventory.sh` compare la base au dossier monté ; à l'étape 3, il devra comparer la base aux zones Bunny (même logique, listing par l'API, mots de passe en lecture seule). La catégorie « fichier en attente de purge » vient de `storage_purge_queue`.
- **Étape 6.** Le retrait des objets privés de la sauvegarde, 30 jours après leur purge (DT9), lit `storage_purge_queue` : `purged_at`, conservé 60 jours.
- **Étape 3.** Ajouter `bunny` aux fournisseurs connus de [StorageConfig.java](../backend/src/main/java/com/example/siteamame/config/StorageConfig.java) : toute autre valeur de `STORAGE_PROVIDER` arrête déjà le démarrage avec un message. Le service de fichiers de Spring (`/uploads/**`) se désactive seul hors du mode local. La copie des fichiers de `backup.sh` lit aujourd'hui le dossier monté : elle devra lire les zones Bunny avec leurs mots de passe en lecture seule. Corriger C9 avant de surveiller les 404.
- **Étape 3.** Mémoire : le client HTTP de Bunny et l'envoi de fichiers de 10 Mo demandent une nouvelle mesure, **sur le conteneur** (`docker stats`, `memory.stat`), pas sur les chiffres de la JVM (E22). Envoyer et lire par blocs, comme `StorageIo`.
- **Étape 4.** Reconstruire l'image d'exploitation avec `OPS_PG_MAJOR=17` : `pg_dump` refuse une base plus récente que lui. Passer l'image du test de démarrage à `postgres:17-alpine` (E19). Renseigner les cinq variables `DATABASE_*` ; les valeurs par défaut du compose, liées à `POSTGRES_PASSWORD`, disparaissent avec la base locale à l'étape 6. Le profil de pool « veille » est déjà celui de la production depuis l'étape 1.
- **Étape 5.** Les images statiques sont déjà en WebP, nommées en ASCII avec leur largeur, et servies avec `srcset`. Il reste à déplacer `public/static/` dans `amame-public/static/` et à faire lire `MEDIA_BASE_URL` à `STATIC_BASE` ([staticImage.ts](../frontend/src/utils/staticImage.ts)), dans la même image (E23). Ramener la limite des images à 5 Mo une fois la compression dans le navigateur en place (E18). `<MediaImage>` porte déjà `maxWidth` et `sizes` sur chaque image : activer Optimizer ne demandera aucun code.
- **Toutes les étapes.** La limite de 512 Mo du conteneur backend laisse environ 115 Mio de marge sous charge depuis E22. Elle se vérifie sur le conteneur après chaque ajout de dépendance. Relever la limite à 768 Mo reste possible si le VPS le permet : le tas suit (30 %).
- **Toutes les étapes.** La limitation de débit ne fait confiance qu'aux proxys en adresse privée. Si le proxy frontal est sur une autre machine, son adresse doit être ajoutée à `set_real_ip_from`.
- **Toutes les étapes.** Sans supervision (E14), rien n'alerte de soi-même : les vérifications de mémoire et de pool sont manuelles, et les critères qui citaient Grafana se lisent dans `/actuator/metrics`.

### Journal

#### 3 octobre 2026 — étape 0 complète dans le dépôt (actions 0.1 à 0.7)

**Fait.** Voir le tableau de détail. Fichiers créés ou modifiés :

- **Infrastructure** : [docker-compose.yml](../docker-compose.yml), [ops/docker-compose.yml](../ops/docker-compose.yml), [ops/backup/](../ops/backup/) (`Dockerfile`, `lib.sh`, `backup.sh`, `restore-test.sh`, `restore-db.sh`, `restore-files.sh`, `entrypoint.sh`), [ops/README.md](../ops/README.md), [backend/Dockerfile](../backend/Dockerfile), [scraper/Dockerfile](../scraper/Dockerfile), [frontend/nginx.conf](../frontend/nginx.conf), [.env.example](../.env.example).
- **Backend** : `UserDataInitializer`, `SecurityConfig`, `PrivateFileController` (nouveau), `StoragePaths` (nouveau), `FileStorageService` et `FileStorageServiceImpl` (méthode `load`), `UserRepository`, `UserReponseDto`, `UserMapperDto`, `UserService`, `UserController`, `GlobalHandlerException`, les trois fichiers `application*.properties`. Trois classes de tests, 25 tests.
- **Frontend, fichiers privés et rôles** : `userType.ts`, `permissionService.ts`, `Navbar.tsx`, `LayoutMembre.tsx`, `DashboardMembre.tsx`, `DashboardHome.tsx`, `UserDetail.tsx`, `UsersManagement.tsx`, `UserForm.tsx`, `vite.config.ts`.
- **Frontend, images** : `StaticImage.tsx`, `utils/staticImage.ts`, `generated/staticImages.ts` (nouveaux), `Hero.tsx`, `PageHero.tsx`, 24 pages, `index.html`, `.dockerignore`, `scripts/optimize_images.py`, dossiers `image-sources/` et `public/static/`.
- **Scrapers** : les trois scripts lisent `DATABASE_URL`.
- **Documentation** : `CLAUDE.md`, `README.md`, ce rapport.
- **Git** : `git rm --cached` sur `backend/.env`, `frontend/.env` et `backend/uploads/`. Les fichiers restent sur le disque. **Rien n'est commité.**

**Vérifié en local.**

| Vérification | Résultat |
| --- | --- |
| Tests unitaires du backend (règles d'accès aux fichiers privés, clés de stockage, rôle jamais lu dans la requête) | 25 sur 25 |
| Backend réel sur une base PostgreSQL 15 jetable, profil `prod` | démarre ; aucun compte créé sans les variables d'amorçage ; l'administrateur est créé avec elles |
| Fichiers privés, par requêtes HTTP réelles | propriétaire 200 avec un contenu identique à l'envoi ; autre utilisateur 403 ; anonyme 401 ; administrateur 200 ; accès statique direct refusé, même au propriétaire |
| Faille des rôles | avant le correctif : une inscription anonyme avec `role=SUPERADMIN` crée un `SUPERADMIN`, qui lit le CV d'un tiers. Après : le compte est `USER`, l'auto-promotion est sans effet, le changement de rôle légitime fonctionne avec ses règles |
| Lecture d'un profil | propriétaire et administrateur 200 ; autre utilisateur 403 ; anonyme 401 |
| Nginx, configuration réelle et faux backend | `nginx -t` correct ; les deux chemins privés renvoient 404, y compris avec un chemin encodé, `..` ou une double barre ; les fichiers publics restent servis ; 6 inscriptions passent puis 429 ; un autre visiteur n'est pas pénalisé |
| Sauvegarde, de bout en bout contre un faux serveur Bunny et une base PostgreSQL 15 | 16 scénarios : sauvegarde couplée, idempotence, test de restauration réussi, fichier manquant détecté, écart de taille détecté, conservation de 30 jours, mauvaise phrase de chiffrement, mauvaise clé, base injoignable, dossier vide signalé, planificateur, restauration réelle de la base après une suppression, restauration de fichiers à l'identique |
| Frontend | `vite build` réussit ; `tsc` ne signale aucune erreur nouvelle ; le site construit, servi par la configuration Nginx réelle, renvoie les nouvelles images en `image/webp` ; aucun ancien chemin d'image ne subsiste dans le code |
| Mémoire du backend, sous charge (18 inscriptions de 7 Mo, dont 6 simultanées, puis 24 lectures) | 440 Mo engagés au total pour une limite de 512 Mo ; aucune erreur mémoire |
| Fichiers compose | les deux stacks sont valides, y compris avec `.env.example` ; seul le port 80 est publié sur toutes les interfaces ; une variable obligatoire absente bloque le déploiement avec un message explicite |

**Non vérifié.** Rien n'a été exécuté contre Bunny réel ni contre la production. Le rendu des pages n'a pas été contrôlé dans un navigateur : seuls la compilation, le build et le service des fichiers l'ont été. Le poids de l'accueil est une estimation calculée sur les fichiers.

**Session interrompue une fois** pendant la construction de l'image d'exploitation ; reprise à partir de ce suivi et de `git status`, sans perte.

#### 4 et 5 octobre 2026 — étape 1 complète dans le dépôt, supervision retirée

**Constat de départ.** Le commit `f5252df` (« Etape 0 commpleted »), déjà poussé sur GitHub, ne contient que les 39 retraits d'index : le code de l'étape 0 n'était pas commité. Son état a été figé dans la branche locale `sauvegarde/etape-0` (commit `b14e7dd`) avant toute modification, sans toucher à `main` ni à l'index.

**Fait.** Voir le tableau de détail de l'étape 1. Fichiers créés ou modifiés (130 au total) :

- **Infrastructure** : [docker-compose.yml](../docker-compose.yml) (supervision retirée, variables `DATABASE_*`, `DB_POOL_*`, `STORAGE_PROVIDER`, `MEDIA_*`, tags `v1.2`), [.env.example](../.env.example), [backend/Dockerfile](../backend/Dockerfile) (réglages mémoire), [frontend/Dockerfile](../frontend/Dockerfile), [frontend/nginx.conf](../frontend/nginx.conf), [frontend/docker/40-runtime-config.sh](../frontend/docker/40-runtime-config.sh) ; dossier `monitoring/` supprimé.
- **Backend, configuration et schéma** : `pom.xml` (Flyway, cache Caffeine, Testcontainers ; Prometheus et H2 retirés), les trois `application*.properties`, [V1__baseline.sql](../backend/src/main/resources/db/migration/V1__baseline.sql).
- **Backend, stockage** : `StorageProperties`, `StorageConfig`, `LocalFileStorageService` (remplace `FileStorageServiceImpl`), `UploadValidator`, `ValidatedFile`, `InvalidUploadException`, `StorageIo`, `MediaUrlResolver`, `StoragePaths`, `WebMvcconfigurer`, les 9 services, 5 mappers, 10 DTO, `ConcoursRepository`, `GlobalHandlerException`.
- **Backend, accès à la base** : `CacheConfig`, `PublicListCache`, `PublicListCacheInvalidator`, `RequestUserLoader`, `JwtFilter`, `ArticleRepository`, 10 contrôleurs (annotation des listes publiques), `PermissionService`, `AdhesionService`, `MembreService`, `PasswordResetService`, `UserService`, `RefreshTokenService`.
- **Backend, tests** : `SiteAmameApplicationTests` (Testcontainers), `UploadValidatorTest`, `MediaUrlResolverTest`, `LocalFileStorageServiceTest`, `CacheConfigTest`, `ConcoursMapperTest`, `UserServiceRoleTest` ; `data.sql` supprimé.
- **Frontend** : `utils/runtimeConfig.ts`, `utils/media.ts`, `utils/uploadFormats.ts`, `components/MediaImage.tsx`, `public/config.js` (nouveaux) ; `index.html`, `vite.config.ts`, `SEO.tsx`, `Navbar.tsx`, `ConcoursCardItem.tsx`, 14 pages publiques, 9 formulaires, `RessourcesManagement.tsx`, 7 fichiers de types, `articleAdapter.ts`, 4 services (code mort retiré).
- **Documentation** : `CLAUDE.md`, `README.md`, ce rapport (suivi, et §3.1, §3.2, DT5, §5 étape 6, §6.3, §7.1, §10, §12, §13 pour la supervision et les variables).

**Vérifié en local.**

| Vérification | Résultat |
| --- | --- |
| Tests du backend, suite complète | 60 sur 60, dont 58 tests unitaires et le test de démarrage sur un PostgreSQL 15 vide : Flyway applique V1, Hibernate `validate` accepte le schéma, 25 tables |
| Même test de démarrage sur PostgreSQL 17 | passe (17.11) |
| Chemin de la production : base créée par le jar de l'étape 0, sans historique Flyway | `Successfully baselined schema with version: 1`, V1 non exécutée, `validate` passe, le backend démarre. Au second démarrage : `Schema "public" is up to date` |
| Retour arrière par le seul tag | l'ancien backend, lancé avec les variables du compose de l'étape 1 sur cette base, démarre, répond, et ne touche pas au schéma |
| Fonctionnel, par requêtes HTTP réelles (56 vérifications) | concours sans fichier créé, listé et consultable ; filtres et recherche des concours sans concours expiré ; WebP accepté, extension d'après le contenu ; HTML déguisé en PNG et PDF envoyé comme image refusés en 400, sans rien écrire ; champs `*Url` de tous les DTO ; fichiers privés inchangés (propriétaire 200, anonyme 401, accès statique refusé) ; comptage des catégories ; changement de rôle effectif immédiatement malgré le cache ; jeton d'un compte supprimé : 401 |
| Requêtes SQL par liste | 1 à 3 pour les 17 listes publiques mesurées, sur 22, avec 6 à 9 éléments ayant chacun son fichier ; 2 pour la liste des utilisateurs de l'administration ; aucune requête pour recharger l'utilisateur au second appel authentifié |
| URL des médias par variable et cache des listes (14 vérifications) | backend relancé avec `MEDIA_BASE_URL=https://media.exemple.test/`, sans reconstruction : toutes les URL publiques changent, les clés en base et les URL privées non. Cache des listes à 10 minutes : un ajout direct en base reste invisible, une écriture d'administrateur vide le cache, deux pages ne partagent pas une entrée, le compteur de vues d'un article avance toujours |
| Frontend | `vite build` réussit ; `tsc` ne signale que les 4 erreurs antérieures (C3) ; `config.js` absent du précache ; aucune URL de média construite à la main ne subsiste |
| Image frontend | construite de bout en bout par le Dockerfile réel (109 Mo), démarrée, `config.js` conforme à la variable. Sur une image de test faite de la même étape finale (15 vérifications) : une même image, deux jeux de variables, `config.js` suit ; jamais mis en cache ; une valeur invalide (URL sans protocole, tentative d'injection, interrupteur mal écrit) arrête le conteneur avec un message |
| Développement sous Windows, hors Docker (10 vérifications) | backend lancé par `java -jar` : le fichier envoyé est écrit dans le dossier de lancement et servi à l'identique ; visible aussi à travers `npm run dev` |
| Fichiers compose | les deux stacks sont valides avec `.env.example` ; valeurs par défaut des variables `DATABASE_*` correctes ; une variable obligatoire absente bloque avec un message ; les cinq variables d'une base distante prennent le pas |

**Mémoire du backend, conteneur limité à 512 Mo, même charge pour toutes les mesures** (18 inscriptions avec un CV de 7 Mo dont 12 simultanées par groupes de 6, 24 lectures de ce CV, 60 listes) :

| Version et réglages | Mémoire du conteneur après la charge | Pic | Total déclaré par la JVM |
| --- | --- | --- | --- |
| Jar de l'étape 0, tas à 40 % | 482 Mio | 512, la limite | 399 Mio |
| Jar de l'étape 1 avant correction, tas à 40 % | 505 Mio | 512, la limite | 403 Mio |
| Jar de l'étape 1, lectures par blocs et deux bornes natives, tas à 40 % | 447 Mio | 512, la limite | 406 Mio |
| **Retenu** : le même, tas à 30 % | **396 Mio** | **433 Mio** | 352 Mio |
| Pour mémoire : le même, limite à 768 Mo, tas à 40 % | 517 Mio | 554 Mio | 502 Mio |

Dans les trois premiers cas, le pic atteint la limite parce que le noyau y compte aussi le cache des fichiers écrits, qu'il libère au besoin : aucun arrêt n'a eu lieu. Ce qui ne se libère pas est la mémoire propre au processus, celle de la deuxième colonne.

**Non vérifié.** Rien n'a été exécuté contre la production : ni la comparaison de V1 avec son schéma, ni la baseline sur ses données. Le rendu des pages n'a pas été contrôlé dans un navigateur : seuls la compilation, le build et le service des fichiers l'ont été. Le comportement hors ligne de la PWA avec `config.js` n'a pas été essayé. Les paramètres d'Optimizer (`MEDIA_OPTIMIZER_ENABLED=true`) n'ont pas été éprouvés contre un CDN. L'image Docker du backend n'a pas été construite : le jar a tourné dans un conteneur équivalent (Temurin 21, mêmes options, même limite). La prise en charge des valeurs par défaut imbriquées par le Compose de Portainer n'est pas connue.

**Session interrompue une fois**, pendant la rédaction de ce suivi ; reprise à partir de l'état du dépôt, sans perte. La suite de tests complète s'était terminée avant l'interruption.

#### 7 novembre 2026 — étape 2 complète dans le dépôt, sans les tests longs

**Constat de départ.** Le dépôt était exactement dans l'état du 5 octobre : rien de déployé, aucun fait relevé, l'étape 1 non commitée sur `main`. L'équipe a validé la suite (étape 2), en écartant les tests longs (écart E27), avec trois décisions : figer l'étape 1 dans une branche, conserver l'historique d'un compte supprimé (E28), corriger C9 au passage.

**Fait.** L'étape 1 a d'abord été figée dans la branche locale `sauvegarde/etape-1` (commit `5c62c07`, parent `b14e7dd`), par un index temporaire, sans toucher à `main` ni à l'index. Puis, voir le tableau de détail de l'étape 2. Fichiers créés ou modifiés (54 au total) :

- **Schéma** : [V2__file_metadata_contract.sql](../backend/src/main/resources/db/migration/V2__file_metadata_contract.sql), [V3__storage_purge_queue.sql](../backend/src/main/resources/db/migration/V3__storage_purge_queue.sql), [V4__user_deletion.sql](../backend/src/main/resources/db/migration/V4__user_deletion.sql).
- **Backend, stockage** : `FileStorageService` (`delete(key)` remplace `deleteFile(nom, dossier)`), `LocalFileStorageService`, `ValidatedFile` (empreinte), `UploadCompensation` et `StoragePurgeJob` (nouveaux), `StorageProperties` (bloc `purge`), `FileDto`, `FileMapper`, `application.properties`.
- **Backend, entités et services** : `File` (empreinte, clé non modifiable par Hibernate), les 8 entités à fichier et `User` (`orphanRemoval`), `Adhesion`, `Cotisation`, `Don` (compte facultatif), les 9 services à fichier, `AdhesionService`, `AdhesionMapper`, `GlobalHandlerException`.
- **Backend, tests** : `FileLifecycleIntegrationTest` (nouveau, Testcontainers : remplacement, purge à rétention raccourcie, compensation, suppression d'un compte, clé immuable), `LocalFileStorageServiceTest` (empreinte, compensation, suppression par clé), `SiteAmameApplicationTests` (version 4, 26 tables), 3 tests adaptés au nouveau constructeur de `StorageProperties`.
- **Exploitation** : [inventory.sh](../ops/backup/inventory.sh), [backfill-sha256.sh](../ops/backup/backfill-sha256.sh), [delete-orphan-rows.sh](../ops/backup/delete-orphan-rows.sh) (nouveaux), `lib.sh` (requête des références vers `file_entity`), `Dockerfile` (paquet `file`), [ops/README.md](../ops/README.md).
- **Configuration et documentation** : [docker-compose.yml](../docker-compose.yml), [ops/docker-compose.yml](../ops/docker-compose.yml), [.env.example](../.env.example), `CLAUDE.md`, ce rapport.

**Vérifié en local.**

| Vérification | Résultat |
| --- | --- |
| Compilation du backend et des tests (`./mvnw compile`, `./mvnw test-compile`) | `BUILD SUCCESS` |
| V1 à V4 sur un PostgreSQL 15 jetable, scénario SQL | les quatre migrations passent. Refusés : modification de `file_path`, clé en double, clé mal formée, MIME absent, empreinte mal formée, `TRUNCATE`. Acceptée : modification d'un autre champ. Suppression d'un compte avec jeton de session, don et deux fichiers : réussie, deux clés dans la file, jeton supprimé, don conservé sans compte. Une suppression annulée n'inscrit rien. Après V4 : exactement 9 clés étrangères vers `users`, avec l'action attendue, sans doublon des anciennes |
| Scripts d'exploitation, image `ops-v1.1` construite, base PostgreSQL 15 et dossier d'uploads factices | `inventory.sh` avant V2 : 1 référence cassée, 1 ligne orpheline, 1 fichier orphelin, 1 clé hors format, 1 métadonnée manquante, sortie en échec ; après réparation : conforme ; un fichier dont la ligne vient d'être supprimée est classé « en attente de purge ». `backfill-sha256.sh` refuse avant V2 ; simulation sans écriture ; `--apply` : empreinte identique à `sha256sum`, MIME (`application/pdf`) et taille complétés, fichier absent ignoré. `delete-orphan-rows.sh` : simulation, puis suppression de la seule ligne orpheline, inscrite dans la file |
| Fichiers compose | les deux stacks sont valides avec `.env.example` |

**Non vérifié.** La suite de tests n'a pas été lancée : ni les tests unitaires (dont les nouveaux tests de `LocalFileStorageServiceTest`), ni `FileLifecycleIntegrationTest`, ni `SiteAmameApplicationTests`. Le backend n'a pas été démarré : la validation par Hibernate de la nouvelle colonne, la planification de la purge, la suppression d'un compte par l'API et le 404 sur une adresse inconnue n'ont pas été observés. Le retour arrière vers `backend-v1.2` sur une base passée par V2 à V4 est déduit, pas rejoué. Aucune nouvelle dépendance : la mémoire du backend n'a pas été remesurée. Rien n'a été exécuté contre la production.

#### 8 novembre 2026 — constat C8 corrigé, suite de tests complète passée

**Fait.** À la demande de l'équipe, la création d'une filière est corrigée (écart E37), dans le code de l'étape 2, toujours non commité. Fichiers : [FiliereController.java](../backend/src/main/java/com/example/siteamame/controller/FiliereController.java) (`@RequestParam` remplacé par `@RequestPart` sur la partie `filiere`), [FiliereControllerTest.java](../backend/src/test/java/com/example/siteamame/controller/FiliereControllerTest.java) (nouveau). Le frontend envoie déjà la filière en partie JSON (`orientationService.ts`) : il ne change pas.

**Vérifié en local.** `FiliereControllerTest` seul (MockMvc autonome, sans contexte Spring ni Docker, quelques secondes), qui reproduit l'envoi du frontend : création avec image, création sans image, nom vide refusé en 400. Les 3 tests passent. Avec l'ancienne annotation remise temporairement, les 3 échouent avec un 500, comme le décrit C8 : le test détecte bien l'anomalie.

**Suite de tests complète** (`./mvnw test`, Docker démarré), lancée ensuite à la demande de l'équipe : `BUILD SUCCESS` en 8 min 07, **70 tests, aucun échec, aucun ignoré**.

| Classe | Tests | Ce que cela couvre |
| --- | --- | --- |
| `FileLifecycleIntegrationTest` (nouveau, Testcontainers) | 4 | remplacement d'une image : ancienne clé dans la file, fichier conservé, puis effacé par la purge et marqué purgé ; titre déjà utilisé : aucun fichier ne reste ; suppression d'un compte : CV et photo dans la file, jeton supprimé, don conservé ; modification de `file_path` refusée par la base |
| `SiteAmameApplicationTests` (Testcontainers) | 2 | V1 à V4 appliquées sur une base vide, version 4, 26 tables ; contexte complet démarré, donc entités et schéma concordent (Hibernate `validate`, colonne `file_sha256` comprise) |
| `LocalFileStorageServiceTest` | 7 | empreinte, compensation à l'annulation, fichier conservé au commit, suppression par clé, clés hors `uploads/` refusées |
| `FiliereControllerTest` (nouveau) | 3 | C8 |
| autres classes, inchangées par l'étape 2 | 54 | `CacheConfigTest`, `PrivateFileControllerTest`, `ConcoursMapperTest`, `MediaUrlResolverTest`, `StoragePathsTest`, `UploadValidatorTest`, `UserServiceRoleTest` |

Le journal contient une erreur `duplicate key … uklc76j4bqg2jrk06np18eve5yj` : c'est l'unicité du `slug` d'article, provoquée exprès par le test « titre déjà utilisé ». `ArticleServiceTest` et `BourseRepositoryTest` n'apparaissent pas : ils sont entièrement en commentaire, depuis avant la migration.

**Non vérifié.** La sécurité (`FILIERE_CREATE`) n'est pas en jeu dans le test de C8, et le parcours dans l'interface d'administration n'a pas été essayé (action N.6). Le backend n'a pas été lancé comme serveur réel : le 404 sur une adresse inconnue (C9) et la suppression d'un compte par l'API n'ont pas été observés par HTTP ; la tâche de purge a tourné dans le test, appelée directement, pas à l'heure planifiée. Le retour arrière vers `backend-v1.2` reste déduit, pas rejoué. Rien n'a été exécuté contre la production.

---

## Résumé

1. **Principe : Neon décrit, Bunny conserve.**
   - Neon est la **seule source de vérité sur l'existence des fichiers**. Il garde une ligne de métadonnées par fichier dans `file_entity` : clé d'objet, type, MIME, taille, empreinte SHA-256, date et rattachement métier. Il ne stocke **jamais d'octets ni d'URL**.
   - Bunny conserve les octets dans trois zones (publique, privée, sauvegardes) et diffuse les fichiers publics par son CDN.
   - Le seul lien entre les deux est la **clé d'objet** `uploads/<dossier>/<uuid>.<ext>`, unique et immuable.
2. **Six invariants** encadrent cette cohérence (§1.3). Ils sont garantis autant que possible **par la base elle-même** (contraintes, déclencheurs), pas seulement par le code Java.
3. **Ordre des écritures.**
   - L'objet est écrit dans Bunny **avant** que sa ligne soit validée dans Neon.
   - La suppression est décidée dans Neon, dans la même transaction que la suppression de la ligne. Bunny ne l'exécute qu'**après 10 jours**, un délai plus long que la fenêtre de restauration de Neon : 6 h sur le plan Free, 7 jours sur Launch. Une base restaurée ne peut donc jamais pointer vers un fichier déjà effacé, et ce délai n'aura pas à changer en passant à Launch.
4. **Neon Free au démarrage, conçu pour évoluer** (§3.2 et §6).
   - **Contraintes du plan Free** : 100 CU-h de calcul par mois, mise en veille imposée, 6 h de restauration.
   - **Garde-fous** :
     - calcul plafonné à 0,25 CU ;
     - toutes les tâches regroupées dans une fenêtre de nuit ;
     - aucune sonde qui réveille la base ;
     - dumps toutes les 12 h ;
     - suivi du quota avec des seuils chiffrés de passage à Launch.
   - **Évolution** : passer à Launch ou à Scale se fait dans la console Neon, sans migration. Changer de fournisseur revient à un dump suivi d'une restauration, car rien de spécifique à Neon n'est utilisé.
   - **Pourquoi Free suffit** : Neon ne garde que les métadonnées. La base ne grossit pas avec les uploads.
5. **Portainer** (§3.1).
   - Les secrets sont des variables de stack.
   - Les tâches planifiées vivent dans une stack séparée, `amame-ops`.
   - Les bascules consistent à modifier une variable de stack puis à mettre la stack à jour.
   - Le frontend lit l'URL des médias **au démarrage** : aucune bascule n'exige de reconstruire une image.
6. **Un socle d'abord, en sept étapes (0 à 6)**, chacune déployable, vérifiable et réversible seule.
   - La bascule du stockage vers Bunny (étape 3) précède celle de la base vers Neon (étape 4), avec **au moins une semaine d'écart**.
   - Le socle ne dépend pas d'Optimizer.
   - Il est terminé quand Neon et Bunny « marchent parfaitement », selon des critères mesurables (§9), dont 30 jours consécutifs sans incident.
7. **Les fonctionnalités avancées ensuite, une par une** (§13) : dimensions des images, Optimizer, URL signées, antivirus, recherche plein texte, plusieurs instances, etc.
   - Elles sont regroupées en quatre vagues.
   - Chacune s'active par un interrupteur et se branche sur un point d'extension déjà présent dans le socle.
   - Aucune ne remet en cause le contrat entre Neon et Bunny.
8. **Dix-huit ajustements** par rapport aux plans 02, conçus séparément, sont listés au §8.
9. **Effort du socle : 15 à 23 jours-homme.**
10. **Coût marginal du socle : moins de 1 $/mois.** Neon Free est gratuit, et le stockage et le trafic Bunny d'AMAME s'ajoutent à l'abonnement Bunny existant. Optimizer (9,50 $) et un passage de Neon à Launch (10 à 20 $) ne s'ajouteront que s'ils sont décidés.

---

## Conventions

- **Renvois aux rapports sources** : `[N01 L1]` désigne le constat L1 du rapport Neon 01, `[N02 D6]` la décision D6 du plan Neon 02. `[B01 B5]` et `[B02 D9]` suivent la même logique pour Bunny. Le préfixe évite toute confusion, car les deux séries utilisent les mêmes lettres (S1, D1…).
- **Objet** : un fichier stocké dans Bunny. **Ligne** ou **métadonnée** : un enregistrement de `file_entity` dans la base.
- **Fenêtre PITR** : période pendant laquelle Neon peut restaurer la base à un instant donné (*point-in-time restore*). Elle est de **6 heures sur le plan Free** retenu au démarrage, 7 jours sur Launch, jusqu'à 30 jours sur Scale [N02 D2].
- **CU-h** : unité de facturation du calcul Neon. Une heure de calcul éveillé à 1 CU vaut 1 CU-h ; à 0,25 CU, elle vaut 0,25 CU-h.
- **Orphelin** : objet présent dans Bunny sans ligne correspondante. **Référence cassée** : ligne dont l'objet est absent.
- **Stack** : ensemble de services Docker déclaré et piloté dans Portainer.

---

## 1. Principe directeur : Neon décrit, Bunny conserve

### 1.1 Qui garde quoi

| Information | Emplacement | Justification |
| --- | --- | --- |
| Octets des fichiers uploadés (images, PDF, CV) | Bunny Storage : `amame-public` ou `amame-private` | stockage objet à 0,01 $/Go, hors du VPS. La base reste petite, donc rapide à sauvegarder et à restaurer, et loin de la limite de stockage du plan Free |
| Diffusion publique et cache | Bunny : Pull Zone `amame-media`. Le redimensionnement à la volée par Optimizer viendra plus tard (§13, A4) | les octets ne transitent plus ni par le VPS ni par Neon. Ils ne consomment donc ni le quota de calcul ni le quota de trafic de Neon |
| Existence d'un fichier : clé, type, MIME, taille, empreinte, date | Neon, table `file_entity` | ces informations participent aux transactions métier (créer un article **et** son image) : elles doivent vivre dans la base transactionnelle |
| Rattachement à une entité (article, membre, utilisateur…) | Neon : clés étrangères, table de jointure de `User.files` | c'est ce rattachement qui décide de la durée de vie du fichier |
| Droit de lire un fichier privé | Neon (propriétaire) et backend (autorités) | la décision s'appuie sur des données relationnelles, que Bunny ne connaît pas |
| URL d'un fichier | **nulle part** : calculée à la volée (`MEDIA_BASE_URL` + clé) | changer de domaine ou de CDN revient à changer une variable, sans migration de données [B02 D5] |
| Intention de supprimer un fichier | Neon, table `storage_purge_queue` | enregistrée dans la même transaction que la suppression de la ligne (§1.4) |
| Images statiques du site (`static/…`) | Bunny `amame-public`, **sans ligne dans Neon** | elles appartiennent au site (versionnées avec le frontend), pas au contenu. Le déploiement les gère |
| Sauvegardes (dumps de la base, copies des objets) | Bunny `amame-backups`, zone dédiée | sauvegarde de la base chez un autre fournisseur que Neon (DT6) |

**Exclusions explicites :**

- **Dans Neon** : aucun octet de fichier (ni colonne binaire, ni base64), aucune URL de média absolue, aucune clé d'accès Bunny. Cette règle protège aussi la limite de stockage du plan Free.
- **Dans Bunny** : aucune information qui n'existerait que là. Les métadonnées propres à Bunny (date de création, empreinte calculée à la réception) servent uniquement aux **contrôles**, jamais de référence.

**Point de départ.** La table `file_entity` porte déjà l'essentiel ([File.java:23-39](../backend/src/main/java/com/example/siteamame/model/File.java#L23-L39)) :

- `file_name` : nom UUID ;
- `file_path` : la clé ;
- `file_type`, `file_mime_type`, `file_size`, `upload_date`.

Il manque trois choses : l'empreinte, les garanties d'unicité et d'immuabilité, et la trace des suppressions. L'étape 2 les ajoute.

### 1.2 Le contrat entre les deux : la clé d'objet

La clé `uploads/<dossier>/<uuid>.<ext>` est déjà la valeur de `file_entity.file_path` [B02 D4]. Elle devient le contrat entre Neon et Bunny, avec quatre propriétés :

| Propriété | Signification | Bénéfice |
| --- | --- | --- |
| **Identique** | même clé sur le disque actuel, dans Bunny et dans Neon | aucune ligne à modifier pendant la migration ; retour arrière par une simple variable |
| **Unique** | une clé correspond à une ligne et à un objet | les deux côtés se comparent mécaniquement (réconciliation) |
| **Immuable** | une clé n'est jamais modifiée ; un remplacement crée une nouvelle clé | cache CDN d'un an sans purge ; le contenu d'un objet ne change jamais, donc une sauvegarde incrémentale suffit |
| **Auto-descriptive** | le préfixe `uploads/utilisateur/` désigne la zone privée ; tout le reste va dans la zone publique | une seule source de vérité pour la zone, au lieu d'une colonne « visibilité » qui pourrait contredire la clé |

**Ce qu'on ne stocke pas, volontairement.** Ni le fournisseur, ni la zone, ni l'URL ne sont stockés en base. Toute information redondante est une occasion de divergence, et la clé plus la configuration suffisent à tout recalculer. Changer de fournisseur reviendrait à écrire une nouvelle implémentation de stockage et à copier les objets, sans toucher aux données (§6).

### 1.3 Les six invariants de cohérence

| ID | Invariant | Menace principale | Garantie | Contrôle |
| --- | --- | --- | --- | --- |
| **I1** | Toute ligne `file_entity` désigne un objet présent dans la bonne zone Bunny | ligne validée alors que l'upload a échoué ; objet effacé trop tôt ; suppression manuelle dans le panneau Bunny | ordre des écritures (§1.4) ; purge différée ; mots de passe des zones jamais diffusés | réconciliation : les références cassées doivent rester à **0** (alerte immédiate) |
| **I2** | Tout objet sous `uploads/` est référencé par une ligne, ou inscrit dans la file de purge, ou date de moins de 48 h | upload réussi suivi d'une transaction annulée ; arrêt brutal du backend | compensation à l'annulation ; la réconciliation inscrit les orphelins dans la file de purge | réconciliation : nombre d'orphelins |
| **I3** | Neon ne contient ni octets ni URL de média ; Bunny ne détient aucune information de référence | tentation de stocker une URL complète « pour aller plus vite » | contrainte de format sur `file_path` ; revue de code | base |
| **I4** | Une clé est unique et ne change jamais | mise à jour d'une ligne existante au lieu d'en créer une nouvelle | contrainte d'unicité ; déclencheur qui refuse la modification de `file_path` | base |
| **I5** | Une restauration de Neon à n'importe quel instant de la fenêtre PITR retrouve tous ses objets | effacement immédiat de l'objet après la suppression de la ligne | purge après 10 jours, au-delà de la fenêtre PITR (6 h sur Free, 7 jours sur Launch) | exercice trimestriel de restauration croisée (étape 6) |
| **I6** | Une base qui n'est pas la production ne peut ni écrire ni supprimer dans les zones de production | backend de recette branché sur une branche Neon avec les clés de production | clés de production présentes uniquement dans la stack de production ; purge et réconciliation désactivées par défaut | revue des variables de chaque environnement |

### 1.4 Le protocole d'écriture

#### Cycle de vie d'un fichier

```text
upload ─► objet écrit dans Bunny ─► ligne validée dans Neon ─► … vie du fichier …
   │                                                              │
   │                                         ligne supprimée + entrée de purge
   │                                         (Neon, même transaction)
   │                                                              │ après 10 jours
   │                                                              ▼
   │                                         objet effacé dans Bunny, entrée marquée « purgée »
   │
   └─ échec avant la validation ─► objet effacé immédiatement (compensation)
```

#### Création ou remplacement d'un fichier

1. **Valider** le fichier : octets de signature, taille, type attendu [B02 §4.10]. Calculer son empreinte SHA-256. Ni base ni réseau à ce stade.
2. **Envoyer l'objet** dans Bunny sous une clé neuve, avec l'empreinte en en-tête. Bunny refuse l'objet si le contenu reçu ne correspond pas à l'empreinte.
3. **Écrire la ligne** dans Neon (clé, MIME détecté, taille, empreinte) et l'associer à l'entité métier, dans la transaction métier.
4. **Valider** la transaction. Le fichier devient visible.

Si l'étape 3 ou 4 échoue, l'objet est supprimé immédiatement (compensation). Comme aucune transaction validée ne l'a jamais référencé, cette suppression immédiate est sans danger, y compris vis-à-vis de la restauration PITR. Si la compensation échoue à son tour, l'objet devient un orphelin, que la réconciliation détectera (I2).

**Pourquoi Bunny avant Neon, et pas l'inverse.** Si la ligne était validée d'abord, un échec de l'upload laisserait une référence vers un objet absent : une image cassée visible par tous (I1 violé). Dans l'ordre retenu, le pire cas est un orphelin : invisible, d'un coût négligeable, et rattrapé automatiquement. **Un orphelin invisible vaut mieux qu'une référence cassée visible.**

#### Suppression d'un fichier

Cela couvre la suppression d'une entité, le remplacement d'un fichier et la suppression d'un compte.

1. La transaction métier supprime la ligne `file_entity` (par cascade ou par `orphanRemoval`).
2. Dans la même transaction, un déclencheur de la base inscrit la clé dans `storage_purge_queue` avec la date de la demande.
3. À la validation, la ligne disparaît et l'intention de purge est enregistrée, **ensemble ou pas du tout**.
4. Une tâche planifiée, exécutée chaque nuit, efface dans Bunny les objets dont la demande a plus de 10 jours, puis marque l'entrée comme purgée. L'effacement est idempotent : un objet déjà absent n'est pas une erreur.

#### Pourquoi une file d'attente en base plutôt qu'une suppression « après commit »

Le plan Bunny prévoyait une suppression juste après le commit, déclenchée par un listener JPA [B02 D9, §4.7]. Combinée à Neon, cette approche pose cinq problèmes, que la file d'attente règle :

- **Restauration PITR (I5)** : avec une suppression immédiate, restaurer la base quelques heures en arrière ferait réapparaître des lignes dont les objets ont déjà été effacés.
- **Atomicité** : un rappel « après commit » est perdu si le backend s'arrête juste après le commit. Une ligne dans la file est validée avec la transaction (patron *transactional outbox*).
- **Exhaustivité** : un listener JPA ne voit ni une requête `DELETE` en masse ni une suppression manuelle en SQL. Le déclencheur voit **toutes** les suppressions : cascade, `orphanRemoval`, requête en masse, intervention manuelle.
- **Simplicité** : le listener `@PostRemove` et son injection différée deviennent inutiles, et les services n'appellent plus `deleteFile`.
- **Réversibilité** : pendant 10 jours, toute suppression, y compris par erreur, s'annule en retirant l'entrée de la file.

**Coût** : quelques Mo conservés 10 jours de plus chez Bunny, ce qui est négligeable. Aucun coût côté Neon : la purge s'exécute dans la fenêtre de nuit, quand la base est de toute façon réveillée pour la sauvegarde (§3.2).

**Pourquoi 10 jours alors que la PITR du plan Free ne dure que 6 h.** Ce délai est choisi pour rester valable sans modification après un passage à Launch (7 jours de PITR). Le garder plus court sur Free n'apporterait rien, puisque le coût est négligeable, et créerait un piège au moment du passage à Launch.

**Données personnelles.** Un CV supprimé devient inaccessible **immédiatement** : sa ligne n'existe plus, donc l'endpoint privé refuse l'accès, et aucune URL publique n'a jamais existé. Il est effacé physiquement sous 10 jours. Ce délai est à indiquer dans la politique de confidentialité.

---

## 2. Architecture cible

```text
Navigateur ──(pages, /api)───────► VPS Contabo, Portainer, stack « amame » :
                                   Nginx ─► Spring Boot (aucun état local)
Navigateur ──(images publiques)──► Bunny Pull Zone « amame-media » (media.amame.ml)
                                       └─ cache miss ─► Bunny Storage « amame-public »

Spring Boot ──(SQL, TLS vérifié)─► Neon, projet « amame », plan Free, branche main
                                   (Francfort, 0,25 CU, veille après 5 min d'inactivité)
                                       file_entity         : clé, type, MIME, taille, empreinte, date
                                       storage_purge_queue : suppressions en attente (10 jours)
Spring Boot ──(PUT, DELETE, GET)─► Bunny Storage « amame-public »  : uploads/** publics, static/**
                                   Bunny Storage « amame-private » : uploads/utilisateur/** (sans CDN)

Stack « amame-ops » ─(dump chiffré, toutes les 12 h)──► Bunny Storage « amame-backups » : db/
Stack « amame-ops » ─(copie incrémentale, chaque nuit)► Bunny Storage « amame-backups » : files/
Stack « amame-ops » ─(archive chiffrée, chaque mois)──► stockage hors de Bunny (à désigner)

Toutes les ressources Neon et Bunny sont en région Francfort.
```

**Lecture du schéma :**

- Le VPS ne porte plus aucune donnée : il peut être reconstruit à l'identique depuis Git, les images publiées et les variables de stack.
- Les flux d'octets (images vers les visiteurs, uploads vers Bunny) ne passent jamais par Neon.
- Les flux de métadonnées (SQL) ne passent jamais par Bunny.
- Les fichiers privés sont lus par le backend dans `amame-private` **après** une décision d'accès prise à partir des données de Neon.
- Les clés de sauvegarde n'existent que dans la stack `amame-ops`, jamais dans la stack applicative.

---

## 3. Cadre retenu : Portainer, Neon Free, Francfort

### 3.1 Un VPS piloté par Portainer

Les plans 02 supposaient un `docker compose` lancé à la main, un fichier `.env` sur le serveur et un cron sur l'hôte. Avec Portainer :

| Sujet | Hypothèse des plans 02 | Avec Portainer |
| --- | --- | --- |
| Déploiement | `docker compose up -d --build` sur le serveur | stack Portainer. Les images sont construites et publiées sur Docker Hub, puis la stack les récupère lors de sa mise à jour |
| Secrets | fichier `.env` sur le serveur | variables d'environnement de la stack, saisies dans Portainer. Le `.env.example` du dépôt reste la documentation de référence |
| Bascule par variable | modifier `.env`, puis redéployer | modifier la variable dans la stack, puis mettre la stack à jour |
| Tâches planifiées (sauvegardes, copies) | cron de l'hôte | conteneur dédié qui porte son propre planificateur, dans la stack séparée `amame-ops`. Portainer ne remplace pas un cron |
| Opérations ponctuelles (inventaire, copie, dump final) | scripts lancés sur l'hôte | conteneurs ponctuels de la stack `amame-ops`, ou SSH. Leurs journaux restent consultables dans Portainer |
| Retour arrière applicatif | reconstruire l'image | remettre le tag d'image précédent dans les variables de la stack. Les tags sont versionnés, jamais `latest` |
| URL des médias du frontend | variable figée au build [B02 §6.2] | lue au démarrage du conteneur (point 3 ci-dessous) |

**Cinq conséquences :**

1. **Portainer devient le coffre des secrets et le point de contrôle de tout le serveur.** Il pilote Docker par son socket, ce qui équivaut à un accès administrateur à l'hôte. Il détient aussi toutes les clés Neon et Bunny. Son accès se protège donc comme celui du serveur :
   - mot de passe fort ;
   - interface non exposée publiquement : tunnel SSH ou VPN, ou au minimum HTTPS avec un accès restreint ;
   - mises à jour régulières.
2. **Deux stacks.**
   - `amame` : frontend et backend ; base locale et pgAdmin jusqu'à l'étape 6. La supervision en a été retirée le 4 octobre 2026 (écart E14).
   - `amame-ops` : sauvegardes, archive mensuelle, opérations ponctuelles et scrapers.

   Les clés de la zone `amame-backups` et le rôle `amame_backup` n'existent que dans `amame-ops`. Le moindre privilège de DT6 tient donc aussi au niveau de Portainer : modifier la stack applicative ne donne pas accès aux sauvegardes.
3. **Le frontend lit l'URL des médias au démarrage, pas au build.**
   - **Le problème** : les images sont construites une fois, puis publiées. Si l'URL des médias était figée au build, basculer ou revenir en arrière obligerait à reconstruire et republier l'image : la bascule ne serait plus « une variable ».
   - **La solution** : au démarrage, le conteneur Nginx génère un petit fichier de configuration à partir de la variable de la stack. L'application le lit avant de s'afficher, et ce fichier est exclu du précache de la PWA.
   - **Le résultat** : une même image frontend sert en développement, en recette et en production.

   Le backend renvoie déjà des URL absolues (`fileUrl`), calculées à partir de `MEDIA_BASE_URL`. Le frontend n'a besoin de cette base que pour les images statiques. Le jour où Optimizer sera activé, elle lui servira aussi à reconnaître les URL du CDN auxquelles ajouter les paramètres de redimensionnement (§13, A4).
4. **Montages relatifs à vérifier.** Avec Portainer, un chemin relatif comme `./backend/uploads` ([docker-compose.yml:62-63](../docker-compose.yml#L62-L63)) est résolu par rapport au dossier de travail de Portainer : le dossier réel peut se trouver ailleurs sur l'hôte.
   - **À faire dès l'étape 0** : relever dans Portainer (volumes du conteneur backend) le chemin réel des uploads en production. C'est ce dossier qu'on sauvegarde, inventorie et copie.
   - **Recommandation** : déployer la stack `amame` depuis le dépôt Git. Le compose versionné devient alors la référence, ce qui lève aussi l'incertitude « compose de production différent du dépôt » [N01 §1].
5. **Le scraper quitte la stack applicative.** Un service sans politique de redémarrage est quand même relancé à chaque mise à jour de la stack. Le scraper actuel ([docker-compose.yml:86-104](../docker-compose.yml#L86-L104)) écrit donc dans la base à chaque déploiement, et la réveillera inutilement une fois sur Neon. Il passe dans `amame-ops`, où il ne se lance qu'à la demande.

### 3.2 Neon en plan Free au démarrage

Contraintes du plan Free, d'après [N02 D2] (tarifs consultés le 30/09/2026, à reconfirmer à la création du projet) :

| Contrainte | Conséquence pour AMAME | Garde-fou |
| --- | --- | --- |
| **100 CU-h de calcul par mois**, soit 400 h éveillées à 0,25 CU (≈ 13 h par jour), pour un mois de 730 h | « toujours actif » est impossible. Chaque réveil coûte au moins 5 minutes de calcul. **Selon la documentation Neon, le calcul est suspendu jusqu'au mois suivant si le quota est atteint**, ce qui rendrait le site indisponible (comportement exact à confirmer) | calcul **plafonné à 0,25 CU** (minimum = maximum), pour que la consommation soit simplement 0,25 × heures éveillées ; aucune connexion permanente (profil HikariCP « veille ») ; aucune sonde qui interroge la base ; tâches regroupées dans **une fenêtre de nuit** ; caches côté backend ; suivi hebdomadaire avec seuils de passage à Launch (§6.3) |
| **Mise en veille après 5 min d'inactivité, non désactivable** | le premier visiteur après une période calme attend le réveil (« quelques centaines de ms » selon Neon) et l'ouverture d'une connexion TLS | mesure pendant la répétition (étape 4.2) ; seuil de passage à Launch si le réveil devient gênant (§6.3) |
| **Restauration à un instant donné : 6 h** | une erreur découverte le lendemain n'est plus réparable par la PITR | **dumps externes toutes les 12 h**, conservés 30 jours (DT9). Ils deviennent la protection principale |
| **Trafic sortant inclus : 5 Go/mois** | les réponses SQL vers le VPS et les dumps comptent | volume attendu bien inférieur. Suivi mensuel avec seuil (§6.3) |
| **Stockage limité** (de l'ordre de 0,5 Go par projet, à confirmer) | la base actuelle fait quelques dizaines de Mo | Neon ne stocke que des métadonnées (I3) : la base ne grossit pas avec les uploads |
| **Branches en nombre limité**, et leur calcul est décompté du même quota | une branche `dev` active consomme les CU-h de la production | développement sur PostgreSQL local. Branches Neon éphémères, réservées à la répétition et aux tests de migrations Flyway, supprimées après usage |
| Ni filtrage par IP ni SLA | identique au plan Launch | mots de passe forts, TLS vérifié, rôles à privilèges minimaux [N02 §11] |

**Ce qui réveille la base, et comment l'éviter :**

| Source de réveil | Traitement |
| --- | --- |
| Visiteurs et robots d'indexation qui appellent l'API | inévitable : c'est l'usage normal. Réduit par le cache du filtre JWT [N02 §4.4] et, si la consommation l'exige, par un cache court sur les listes publiques, vidé à chaque modification par un administrateur |
| Connexions gardées ouvertes par le pool | profil « veille » de HikariCP : aucune connexion minimale, fermeture après 60 s d'inactivité, pas de *keepalive* [N02 §4.2] |
| Sondes de santé | le contrôle de la base est exclu de toute sonde interrogée fréquemment (supervision, outil de disponibilité) |
| Collecte de métriques | aucune pour le moment : la supervision est retirée (écart E14). Le jour où elle revient, Prometheus ne collecte que les métriques du backend, qui n'interrogent pas la base ; `postgres-exporter` ne revient pas [N01 O1] |
| Tâches planifiées | une seule fenêtre de nuit, à **02:30 UTC** (heure de Bamako) : dump, purge, copie des objets et, le dimanche, réconciliation. La base n'est réveillée qu'une fois. Le second dump de la journée, à **14:30 UTC**, tombe à une heure d'activité où la base est probablement déjà éveillée |
| Scrapers | lancés à la demande depuis `amame-ops`, plus jamais à chaque déploiement (§3.1) |

**Choix pris dès maintenant et conservés en cas de changement de plan.** Région Francfort, PostgreSQL 17, base `amame_db` et rôles séparés. Passer de Free à Launch ou à Scale garde le même projet, le même point d'accès et les mêmes chaînes de connexion (§6).

### 3.3 Francfort pour tout

- **Choix** : le VPS est à Lauterbourg ; Neon est en `aws-eu-central-1` ; les zones Bunny `amame-public`, `amame-private` **et `amame-backups`** sont à Francfort.
- **Ce qu'on perd** : la séparation géographique des sauvegardes qu'envisageait la version 1 de ce rapport. Un incident régional chez Bunny toucherait à la fois les fichiers et leurs sauvegardes.
- **Ce qui compense** :
  - la zone `amame-backups` reste distincte, avec une clé qui ne quitte pas `amame-ops` : le moindre privilège est intact ;
  - l'**archive mensuelle hors de Bunny devient obligatoire** : elle protège contre un incident régional comme contre la perte du compte ;
  - une région de réplication peut être ajoutée plus tard à `amame-backups`, depuis le panneau, sans migration, pour 0,01 $/Go/mois. Attention, cet ajout est irréversible.

---

## 4. Décisions transverses

Ces décisions n'appartiennent à aucun des deux plans pris isolément : elles naissent de leur combinaison.

### DT1 — Tout à Francfort

- **Justification** : un upload fait un aller-retour vers Bunny et plusieurs vers Neon dans la même requête. Rapprocher le VPS (Lauterbourg, à environ 150 km), Neon et Bunny réduit la durée des transactions (DT5). La diffusion vers les visiteurs ne dépend pas de cette région, puisqu'elle passe par le CDN.
- **Irréversible des deux côtés** : la région d'un projet Neon, la région principale et le tier d'une zone Bunny ne se changent pas après création.
- **Validé** le 2 octobre 2026, y compris pour la zone de sauvegarde (§3.3).

### DT2 — Bunny d'abord, Neon ensuite, jamais la même semaine

| Critère | Bunny d'abord (retenu) | Neon d'abord |
| --- | --- | --- |
| Retour arrière | une variable de stack, sans déplacement de données (clés identiques) | dump et restauration inverse |
| Gain perçu par les visiteurs | immédiat (CDN, poids des images) | invisible (sécurité, sauvegardes) |
| Cohérence | la base, encore locale, sert de source pour une copie vérifiée par empreinte. La bascule Neon transporte ensuite des métadonnées déjà vérifiées, sans toucher Bunny | la copie vers Bunny devrait lire une base distante qui s'endort : faisable, mais sans avantage |
| Quota Neon | la base locale absorbe la phase la plus coûteuse en requêtes : inventaire, calcul des empreintes, copie | ces opérations consommeraient le quota du plan Free |
| Risque traité plus tôt | — | absence de sauvegarde [N01 D1], mais l'étape 0 la traite déjà sans Neon |

**Règle** : au moins une semaine de stabilisation entre les deux bascules, pour qu'un incident puisse être attribué à une seule cause [N02 §10]. On exécute en premier le changement le plus facile à annuler.

### DT3 — Flyway avant toute modification du schéma

- Les garanties de cohérence (unicité, format, déclencheurs, file de purge) sont des objets que `ddl-auto=update` ne sait pas créer : Hibernate ne crée ni déclencheur, ni contrainte vérifiée sur des données existantes [N01 M1].
- Flyway est introduit en *baseline* (V1) sur la base actuelle [N02 D7]. Les migrations V2 et V3 (étape 2) s'appliquent ensuite **sur la base actuelle**, bien avant Neon.
- Au moment de la bascule, le dump transporte schéma, déclencheurs et historique Flyway : Neon démarre avec exactement les mêmes garanties.
- Hibernate passe en `validate` : il vérifie que les entités correspondent au schéma, sans jamais le modifier.

### DT4 — Les garanties sont portées par la base

- **Choix** : l'unicité de la clé, son format, l'interdiction de la modifier et l'inscription des suppressions dans la file sont déclarés dans la base, pas seulement dans le code Java.
- **Justification** : la base est le seul point par lequel passent **toutes** les écritures (backend, scrapers, interventions manuelles, scripts de migration). Une règle portée par le code ne protège que les écritures faites par ce code.
- **Portabilité** : déclencheurs et contraintes relèvent du PostgreSQL standard. Ils suivent la base chez n'importe quel fournisseur (§6.2).
- **Conséquence sur les tests** : les déclencheurs PostgreSQL ne s'exécutent pas sur H2. Les tests d'intégration du stockage utilisent donc PostgreSQL via Testcontainers, comme le prévoit déjà [N02 §4.6], et non H2 comme l'envisageait [B02 §8.1].

### DT5 — Ne pas immobiliser une connexion Neon pendant un transfert vers Bunny

**Problème.**

- Aujourd'hui, l'écriture du fichier a lieu au milieu de la transaction. Avec une base distante et un pool de 10 connexions, chaque upload en cours bloque une connexion pendant tout le transfert.
- Le plan Bunny prévoit jusqu'à 3 tentatives avec 60 s de lecture chacune [B02 §4.4]. Dans le pire cas, une connexion serait bloquée plusieurs minutes.
- L'inscription anonyme (CV et photo) deviendrait un moyen d'épuiser le pool.

**Choix :**

1. **Acquisition paresseuse des connexions.** On désactive l'auto-commit du pool HikariCP. Spring Boot indique alors à Hibernate qu'il peut attendre la première requête SQL pour emprunter une connexion. Une transaction qui commence par l'upload n'occupe donc aucune connexion pendant le transfert. C'est déjà le cas de la création d'article, où l'upload précède toute requête ([ArticleService.java:168-197](../backend/src/main/java/com/example/siteamame/service/ArticleService.java#L168-L197)).
2. **Upload avant la première requête, quand c'est possible.** Certains flux lisent la base avant l'upload : l'inscription vérifie l'e-mail avant d'envoyer les fichiers ([UserService.java:74-93](../backend/src/main/java/com/example/siteamame/service/user/UserService.java#L74-L93)) et les mises à jour relisent l'entité. Dans ces flux, on place la validation et l'envoi avant la première requête quand c'est possible. Sinon, on l'accepte : ces flux sont rares, et l'inscription est limitée en débit [B01 S2].
3. **Budget borné pour l'envoi** : 5 s pour la connexion, 20 s pour la lecture, 2 tentatives au plus. Au-delà, l'upload échoue proprement : rien en base, objet compensé.
4. **Seuil de détection de fuite de HikariCP** : aujourd'hui fixé à 10 s ([application-prod.properties:31](../backend/src/main/resources/application-prod.properties#L31)), il passe à 60 s, au-dessus de ce budget. Sinon, chaque upload lent produirait une fausse alerte.
5. **Deux profils de pool, sélectionnés par variables** (§7), sans nouvelle image :
   - **« veille »**, pour le plan Free : aucune connexion minimale, fermeture après 60 s d'inactivité, pas de *keepalive* ;
   - **« toujours actif »**, pour un éventuel passage à Launch : 2 connexions minimales, *keepalive* actif [N02 §4.2].

   Dans les deux profils, le délai d'obtention d'une connexion (15 s) couvre largement un réveil de la base.

**Alternative écartée.** Sortir systématiquement l'upload de la transaction, dans le contrôleur ou une façade sans transaction, serait plus propre. Mais il faudrait restructurer 9 services et leurs contrôleurs, ce qui est disproportionné pour AMAME, où les uploads sont rares et faits surtout par des administrateurs. On y reviendra si la métrique `hikaricp_connections_pending` cesse d'être nulle.

**À valider en recette** : pendant la création d'un article avec image, `hikaricp_connections_active` ne doit pas augmenter tant que l'upload est en cours. Sans supervision (écart E14), cette valeur se lit dans `/actuator/metrics/hikaricp.connections.active`.

### DT6 — Une zone de sauvegarde dédiée

- **Choix** : le plan Neon plaçait les dumps dans la zone privée (`amame-private/backups/db/`) [N02 §11]. On retient à la place une zone distincte `amame-backups`, en région Francfort (§3.3). Son mot de passe n'existe que dans la stack `amame-ops`, **jamais dans la stack applicative**.
- **Justification :**
  - **moindre privilège** : une compromission du backend, qui détient la clé de `amame-private`, ne permet ni de lire ni d'effacer les sauvegardes ;
  - **isolation** : la réconciliation et la purge ne voient jamais cette zone.
- **Contenu** :
  - `db/` : dumps chiffrés de Neon, toutes les 12 h ;
  - `files/` : copie incrémentale des objets (DT9).
- **Création dès l'étape 0** : elle reçoit déjà les sauvegardes de la base locale et des fichiers.
- **Coût** : quelques centimes par mois.

### DT7 — Un environnement = une base + un stockage + des clés

**Le risque.** Une branche Neon copie aussi les lignes `file_entity`, qui désignent des **objets de production**. Un backend branché sur une branche avec les clés de production pourrait :

- effacer des objets de production : remplacer une image en recette déclenche sa purge ;
- pire, avec la réconciliation active : les objets créés en production après la création de la branche n'existent pas dans la branche. Ils y apparaîtraient comme orphelins et seraient **purgés en masse**.

| Environnement | Base | Stockage (écritures) | Affichage des médias | Purge et réconciliation |
| --- | --- | --- | --- | --- |
| Production | Neon, branche `main` | Bunny `amame-public` / `amame-private` | `https://media.amame.ml` | activées |
| Répétition, recette | branche Neon éphémère (`repetition`…), supprimée après usage | `local`, dans un dossier temporaire | CDN de production, en lecture (aucune clé nécessaire) | désactivées. Réconciliation en mode rapport possible, avec les mots de passe **en lecture seule** |
| Développement | **PostgreSQL local** (recommandé sur le plan Free, pour ne pas consommer le quota), ou branche `dev` anonymisée | `local` | URL relatives (`/uploads/…`) | désactivées |

**Règles :**

- les mots de passe d'écriture des zones de production n'existent que dans les variables de la stack de production ;
- purge et réconciliation sont désactivées par défaut, et activées explicitement en production uniquement ;
- si une branche `dev` est utilisée, son anonymisation [N02 D10] supprime aussi les lignes `file_entity` des fichiers privés, puis vide la file de purge de la branche.

**Conséquence acceptée** : en recette, les fichiers uploadés pour test ne s'affichent pas via le CDN, et les CV de production ne sont pas lisibles. C'est voulu.

### DT8 — La réconciliation contrôle, elle ne supprime pas directement

- **Choix** : le plan Bunny prévoyait de supprimer directement les orphelins de plus de 48 h [B02 §4.12]. Ici, la réconciliation se contente de les **inscrire** dans la file de purge. Seule la tâche de purge efface, après 10 jours.
- **Justification** : il n'existe qu'une seule voie de suppression, toujours différée et annulable. Une erreur de configuration de la réconciliation (mauvaise branche, mauvais préfixe) reste récupérable.
- **Périmètre strict** : uniquement le préfixe `uploads/` des zones `amame-public` et `amame-private`.
  - Jamais `static/` : ces images n'ont aucune ligne en base par construction, elles seraient toutes jugées orphelines.
  - Jamais `amame-backups`.
- **Trois résultats :**
  - **références cassées** (I1) : alerte immédiate, doit valoir 0 ;
  - **orphelins** (I2) ;
  - **écarts de taille ou d'empreinte** : corruption ou copie incomplète, alerte.
- **Trois modes** :
  - `off` : désactivée (valeur par défaut) ;
  - `report` : rapport seul, pendant plusieurs semaines au début ;
  - `enforce` : inscription des orphelins dans la file.
- **Calendrier** : chaque dimanche, dans la fenêtre de nuit (§3.2). La purge, elle, tourne chaque nuit dans la même fenêtre.
- **Concurrence** :
  - la purge réserve ses entrées en les verrouillant et saute celles déjà verrouillées (`SKIP LOCKED` de PostgreSQL) : deux instances du backend ne traitent jamais la même entrée, sans avoir besoin de ShedLock ;
  - la réconciliation s'exécute sur une seule instance, protégée par un verrou consultatif PostgreSQL.

### DT9 — Des sauvegardes cohérentes entre elles

**Principe.** Une sauvegarde de la base n'a de valeur que si les objets qu'elle référence existent encore au moment de la restauration. Avec seulement 6 h de PITR sur le plan Free, **les dumps externes sont la protection principale** contre une erreur découverte tardivement.

**Choix**, tous exécutés par la stack `amame-ops` :

- **Dump de Neon toutes les 12 h**, à 02:30 et à 14:30 UTC (§3.2), conservé 30 jours. Le second dump limite à 12 h la perte maximale au-delà de la PITR. Son coût est quasi nul : la base est généralement déjà éveillée à cette heure, et un dump de quelques Mo pèse peu sur le quota de trafic.
- **Copie incrémentale des objets nouveaux** vers `amame-backups/files/`, chaque nuit. Comme les clés sont immuables, elle se limite aux clés absentes de la sauvegarde : c'est simple et peu coûteux. Elle utilise le mot de passe **en lecture seule** des zones sources.
- **Ajout seul** : la copie des objets ne supprime rien. Tout dump conservé retrouve donc ses objets.
- **Exception pour les données personnelles** : les objets privés (CV, photos) sont retirés de la sauvegarde 30 jours après leur purge. Pour cela, la tâche de sauvegarde lit dans la file les entrées marquées purgées, qui y restent 60 jours avec leur date de purge.
- **Archive mensuelle chiffrée hors de Bunny**, désormais obligatoire (§3.3). Le support est à désigner avant l'étape 6 (§12).

Cette approche remplace la « copie mensuelle des deux zones » [B02 §10], insuffisante : un dump d'hier associé à une copie de fichiers vieille de trois semaines laisserait des références cassées.

---

## 5. Plan d'implémentation étape par étape

### 5.0 Vue d'ensemble

| Étape | Contenu | Infrastructure touchée | Retour arrière | Effort |
| --- | --- | --- | --- | --- |
| **0** | Sécurisation, Portainer, premier point de restauration cohérent | VPS, Portainer, Bunny (`amame-backups` seulement) | sans objet | 2 à 3 j |
| **1** | Socle de code commun, sans changement de comportement | aucune | tag d'image précédent dans la stack | 5 à 7 j |
| **2** | Contrat de métadonnées et garde-fous en base | base actuelle (Flyway V2, V3) | tag précédent ; migrations additives | 2 à 3 j |
| **3** | Bascule du stockage vers Bunny | Bunny | variable `STORAGE_PROVIDER=local` | 2 à 3 j |
| **4** | Bascule de la base vers Neon (plan Free) | Neon | anciennes variables, base locale conservée 14 jours | 2 à 3 j |
| **5** | Diffusion des images par le CDN, sans Optimizer | Bunny (`static/`), frontend | tag d'image frontend précédent | 1 à 2 j |
| **6** | Exploitation de la cohérence et nettoyage | Portainer, Neon, Bunny | sans objet | 1 à 2 j |

**Chaque étape suit la même structure** : objectif, prérequis, actions, ce qu'elle apporte à la cohérence Neon ↔ Bunny, justification, critères de sortie, retour arrière.

**Règle commune** : une étape ne commence que lorsque la précédente remplit ses critères de sortie **en production**.

**Calendrier indicatif**, en semaines, pour une petite équipe à temps partiel :

| Semaine | 1 | 2-3 | 4 | 5 | 6 | 7 | 8 | 9-10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Étape | 0 | 1 | 2 | 3 | stabilisation ; création du projet Neon et répétition (4.1, 4.2) | 4 (bascule) | 5 | 6 (avec les nettoyages à J+14 et J+30) |

Viennent ensuite 30 jours de stabilisation du socle (§9), puis les vagues de fonctionnalités avancées (§13).

---

### Étape 0 — Sécurisation, Portainer et premier point de restauration cohérent

**Objectif.** Traiter les risques critiques des deux audits, qui existent quel que soit le choix d'hébergement. Sécuriser Portainer, qui devient le coffre des secrets. Constituer un point de restauration cohérent (base **et** fichiers) avant toute modification.

**Prérequis.** Aucun. L'étape démarre immédiatement.

**Actions :**

1. **Portainer** (§3.1) :
   - interface non exposée publiquement, mot de passe fort, version à jour ;
   - relever le chemin réel du montage des uploads en production ;
   - créer la stack `amame-ops` et y déplacer le scraper.
2. **Secrets** :
   - révoquer le mot de passe d'application Gmail et régénérer `JWT_SECRET` ;
   - retirer du suivi Git `backend/.env`, `frontend/.env` et `backend/uploads/` [B01 S3] ;
   - sortir les mots de passe de la base des fichiers versionnés et les placer dans les variables de stack [N01 S2].
3. **Compte administrateur par défaut** : vérifier qu'il a changé de mot de passe en production, et ne le créer qu'à partir de variables d'environnement [N01 S3].
4. **Fichiers privés** : fermer l'accès public à `/uploads/utilisateur/`, dans Nginx et dans Spring Security [B01 S1].
5. **Sauvegarde couplée**, exécutée par `amame-ops` :
   - dans le compte Bunny existant, création de la seule zone `amame-backups` (Francfort) ;
   - un dump de la base locale et une archive du dossier des uploads, **pris au même moment** ;
   - chiffrés, puis envoyés dans `amame-backups` ;
   - suivis d'un test de restauration du couple.

   Tant que la base est locale, `amame-ops` rejoint le réseau Docker de la stack `amame` et monte le dossier réel des uploads en lecture seule.
6. **Durcissement** :
   - `restart: unless-stopped` sur la base ;
   - pgAdmin et Grafana liés à `127.0.0.1` ;
   - port 8080 retiré de la stack ;
   - `-Xmx` aligné sur la limite mémoire du conteneur ;
   - limitation de débit de l'inscription, basée sur la vraie IP du visiteur.

   Sources : [N01 D2, S4], [B01 A4, A5, S2].
7. **Images statiques** : conversion en WebP, suppression des 21,6 Mo jamais référencés, nouveau favicon, `loading="lazy"` [B01 §7].

**Cohérence.** La sauvegarde couplée est le **premier point de restauration cohérent** : un dump et les fichiers qu'il référence, pris au même instant. Elle sert de filet de sécurité à toutes les étapes suivantes.

**Justification :**

- ce sont les risques P0 des deux audits (fuite de données personnelles, perte définitive de données, prise de contrôle) ;
- aucun ne dépend de Neon, et Bunny n'intervient qu'à travers une zone de sauvegarde ;
- Portainer concentre désormais tous les secrets : le sécuriser passe avant d'y saisir les clés Neon et Bunny ;
- les images statiques apportent le plus gros gain perçu : l'accueil passe d'environ 52 Mo à moins de 1,5 Mo.

**Critères de sortie :**

- [ ] Portainer n'est pas joignable depuis Internet sans tunnel ou VPN.
- [ ] Secrets changés ; `git ls-files` ne liste plus ni les `.env` ni `backend/uploads/`.
- [ ] Toute URL `/uploads/utilisateur/…` ou `/amame-uploads/utilisateur/…` renvoie 404 (écart E2).
- [ ] Le couple dump + fichiers, lu dans `amame-backups`, a été restauré dans un environnement jetable (`restore-test.sh`).
- [ ] Dans cette restauration, chaque ligne `file_entity` référencée retrouve son fichier.
- [ ] Une inscription envoyée avec `role=SUPERADMIN` crée un compte `USER`, et tous les comptes `SUPERADMIN`, `ADMIN` et `EDITOR` existants sont connus de l'équipe (écart E10).
- [ ] Un utilisateur connecté ne peut lire ni le profil ni les fichiers d'un autre (écarts E1 et E11).
- [ ] Les images de l'accueil pèsent moins de 1,5 Mo.

**Retour arrière.** Sans objet : aucun changement d'architecture.

---

### Étape 1 — Socle de code commun, sans changement de comportement

**Objectif.** Préparer tout le code des deux migrations et le déployer en production **sur l'infrastructure actuelle** (base locale, `STORAGE_PROVIDER=local`). Les bascules suivantes ne seront plus que des changements de variables de stack.

**Prérequis.** Étape 0 terminée.

**Déjà livré à l'étape 0** (écarts E1, E6 et E12 du suivi) : l'endpoint authentifié `/api/user/files/{id}`, `StoragePaths`, la lecture d'un fichier par `FileStorageService`, les champs `imageUrl` et `cvUrl`, les tags d'image paramétrés, et le point d'entrée unique des images statiques côté frontend. Les actions ci-dessous s'entendent pour ce qui reste.

**Code livré dans le dépôt les 4 et 5 octobre 2026** : voir « Étape 1 — détail » dans le suivi, et les écarts E14 à E26.

**Actions, dans cet ordre :**

1. **Configuration externalisée** :
   - URL, utilisateurs et mots de passe de la base lus depuis l'environnement [N02 §4.2] ;
   - propriétés typées `app.storage.*` [B02 §4.2] ;
   - paramètres du pool, de la purge et de la réconciliation pilotés par variables (§7) ;
   - tags d'image paramétrés dans la stack ;
   - un seul `.env.example` pour l'ensemble.
2. **Flyway** : baseline V1 sur le schéma de production actuel, Hibernate en `validate`, test de démarrage avec PostgreSQL via Testcontainers [N02 §4.3, §4.6].
3. **Abstraction du stockage** [B02 §4.3 à §4.11, sans la partie Bunny] :
   - les 9 services injectent l'interface `FileStorageService` au lieu de l'implémentation ;
   - le stockage local lit enfin sa propriété de configuration ;
   - validation des uploads par octets de signature, avec acceptation du WebP ;
   - calcul des URL par le backend et nouveaux champs `*Url` dans les DTO ;
   - endpoint authentifié `/api/user/files/{id}` pour les fichiers privés ;
   - corrections de `ConcoursMapper` et `ConcoursRepository`.
4. **Frontend** :
   - point d'entrée unique pour les URL de médias, composant d'image, suppression des 19 constantes `PROD_URL`, avatars servis par `imageUrl` [B02 §5.1 à §5.3] ;
   - **URL des médias lue au démarrage du conteneur** et non plus au build (§3.1), avec ce fichier de configuration exclu du précache de la PWA ;
   - paramètres de redimensionnement d'Optimizer prévus dans le composant d'image, mais **désactivés** (`MEDIA_OPTIMIZER_ENABLED=false`) jusqu'à la décision sur Optimizer (§13, A4). Sans Optimizer, ces paramètres ne serviraient à rien et fragmenteraient le cache du CDN.
5. **Accès SQL et réveils de la base** :
   - chargements groupés, comptage des catégories en une seule requête, cache du filtre JWT [N02 §4.4] ;
   - profils de pool « veille » et « toujours actif », auto-commit désactivé, seuil de fuite relevé (DT5) ;
   - contrôle de la base retiré des sondes de santé interrogées fréquemment (§3.2) ;
   - cache court des listes publiques préparé mais désactivé : c'est le premier levier si la consommation de calcul dépasse sa trajectoire (§6.3).

Les actions 3, 4 et 5 peuvent avancer en parallèle. Les actions 1 et 2 passent avant, car toute modification ultérieure du schéma dépend de Flyway (DT3).

**Cohérence.** Cette étape met en place la moitié « Neon décrit » du contrat :

- les URL ne sont plus construites par le frontend à partir d'un domaine codé en dur, mais calculées par le backend à partir de la clé (I3) ;
- l'accès aux fichiers privés passe par une décision prise à partir des données de la base.

**Justification.**

- **Une chose à la fois** : chaque refactoring est validé sous trafic réel, sans nouvelle dépendance réseau. Si un problème apparaît après une bascule, il viendra forcément de l'infrastructure, pas du code.
- **Bascules sans reconstruction** : avec la configuration lue au démarrage et les paramètres en variables, toutes les bascules et tous les changements de plan se font depuis Portainer, avec les mêmes images.

**Critères de sortie :**

- [ ] Au démarrage, Flyway signale la baseline et Hibernate `validate` ne remonte aucune erreur.
- [ ] La recette fonctionnelle est identique à avant ([N02 §8.1] ; [B02 §8.2] hors Bunny).
- [ ] Chaque liste publique exécute au plus 2 à 3 requêtes SQL (statistiques Hibernate).
- [ ] Les concours sans fichier sont visibles, sans erreur 500 [B01 B8].
- [ ] L'avatar mobile de la Navbar s'affiche [B01 F1].
- [ ] En développement local sous Windows, upload et affichage fonctionnent [B01 B2].
- [ ] Changer la variable d'URL des médias dans la stack, puis redémarrer le frontend, suffit à changer les URL affichées, sans reconstruire l'image.

**Retour arrière.** Remettre les tags d'image précédents dans la stack. La seule trace en base est la table d'historique de Flyway, sans effet sur l'ancienne version.

---

### Étape 2 — Contrat de métadonnées et garde-fous en base

**Objectif.** Rendre la base garante de la cohérence **avant** de déplacer quoi que ce soit :

- chaque fichier a une empreinte ;
- chaque clé est unique et immuable ;
- chaque suppression laisse une trace dans la file de purge.

**Prérequis.** Étape 1 en production ; Flyway opérationnel.

**Code livré dans le dépôt le 7 novembre 2026** : voir « Étape 2 — détail » dans le suivi, et les écarts E27 à E36. La suppression d'un compte (C7) y est traitée par une migration V4.

**Actions :**

**2.1 — Inventaire croisé en production (lecture seule, conteneur ponctuel de `amame-ops`).** On compare les fichiers du dossier réel des uploads aux lignes `file_entity`, puis les lignes aux entités métier qui les référencent : les 8 entités à fichier et la table de jointure de `User.files`. Chaque fichier tombe dans une catégorie :

| Catégorie | Définition | Traitement |
| --- | --- | --- |
| Cohérent | ligne référencée par une entité, fichier présent | rien |
| Référence cassée | ligne présente, fichier absent | restaurer depuis la sauvegarde de l'étape 0 ; à défaut, retirer le fichier de l'entité, après validation métier |
| Ligne orpheline | ligne référencée par aucune entité (anciens remplacements [B01 B7]) | supprimée en 2.4, donc inscrite dans la file de purge |
| Fichier orphelin | fichier sur disque sans ligne | non migré ; conservé dans l'archive de l'étape 0 |
| Doublon de clé | deux lignes avec la même clé | analyse au cas par cas, avant la contrainte d'unicité |

Résultat attendu : **zéro référence cassée, zéro doublon**.

**2.2 — Migration V2 : métadonnées et contraintes.**

- Nouvelle colonne pour l'empreinte SHA-256. Pour l'existant, elle est remplie par un conteneur ponctuel de `amame-ops`, qui lit chaque fichier référencé.
- Unicité de `file_path`.
- Contrainte de format sur `file_path` : préfixe `uploads/`, un dossier en minuscules, un UUID, une extension en minuscules. Elle est posée d'abord sans vérifier l'existant, puis validée une fois le nettoyage fait.
- Déclencheur qui refuse toute modification de `file_path` (I4).
- MIME et taille rendus obligatoires, une fois l'existant vérifié.

**2.3 — Migration V3 : file de purge.**

- Table `storage_purge_queue`, avec la clé, la date de la demande, la date de purge effective, le nombre de tentatives et la dernière erreur.
- Déclencheur après suppression sur `file_entity`, qui y inscrit la clé supprimée.

**2.4 — Code.**

- **`orphanRemoval`** sur les 8 entités et sur `User.files` ; `UserService.update` est réécrit pour modifier la collection sur place, sans la remplacer [B02 §4.7].
- **Plus d'appels à `deleteFile`** dans les services : la suppression découle désormais de celle de la ligne.
- **Empreinte et compensation** : l'empreinte est enregistrée à chaque upload, et l'objet est effacé immédiatement si la transaction est annulée [B02 §4.6, partie compensation].
- **Tâche de purge planifiée** :
  - **une fois par nuit**, dans la fenêtre de 02:30 UTC, désactivée par défaut, rétention configurable (10 jours) ;
  - en mode local, elle efface sur le disque ; en mode Bunny, dans la zone. Le comportement est identique dans les deux modes.
- **Lignes orphelines** : suppression de celles identifiées en 2.1. Leurs fichiers passent par la file : la suppression reste annulable pendant 10 jours.

**Cohérence.**

- I4 (unicité, immuabilité) et le mécanisme de I5 (purge différée) sont désormais garantis **par la base**.
- L'empreinte est calculée sur la source de vérité actuelle, le disque. Elle servira de preuve d'intégrité pour la copie vers Bunny (étape 3), puis pour la restauration dans Neon (étape 4).

**Justification :**

- **Pourquoi avant Bunny et Neon** :
  - on ne copie que des données propres ;
  - le nettoyage se fait là où les outils sont simples et gratuits : disque local, base locale, sans consommer le quota de Neon ;
  - les garde-fous sont éprouvés sans aucune dépendance réseau.
- **Pourquoi une empreinte en base** : c'est le seul moyen de vérifier, **sans tout retélécharger**, que l'objet stocké dans Bunny est bien celui que la base décrit.
- **Pourquoi un déclencheur** : voir DT4. Il remplace aussi le listener `@PostRemove` prévu par [B02 §4.7].
- **Pourquoi une purge quotidienne et non horaire** : sur le plan Free, une tâche horaire réveillerait la base 24 fois par jour, soit au moins 2 h de calcul quotidien pour rien. Une rétention de 10 jours ne gagne rien à une exécution plus fréquente.

**Critères de sortie** (tests Testcontainers et recette) :

- [ ] **Remplacement de l'image d'un article** :
  - [ ] une nouvelle ligne est créée et l'ancienne est supprimée ;
  - [ ] une entrée est ajoutée dans la file, et l'ancien fichier est encore présent ;
  - [ ] après la rétention (raccourcie en test), le fichier est effacé et l'entrée est marquée purgée.
- [ ] Erreur provoquée après l'upload (titre en double, par exemple) : aucun fichier ne reste.
- [ ] Suppression d'un utilisateur : son CV et sa photo sont inscrits dans la file.
- [ ] Une modification de `file_path` en SQL est refusée par la base.
- [ ] L'empreinte est renseignée pour 100 % des lignes.
- [ ] L'inventaire croisé indique zéro référence cassée.

**Retour arrière.** Remettre les tags d'image de l'étape 1, sans revenir sur le schéma :

- les migrations V2 et V3 sont additives et compatibles avec l'ancien code, qui crée toujours de nouvelles clés et ne modifie jamais une clé existante ;
- la file se remplit sans être purgée, sans conséquence.

---

### Étape 3 — Bascule du stockage vers Bunny

**Objectif.** Les octets quittent le VPS. La base, encore locale, garde des métadonnées **inchangées**.

**Prérequis.** Étapes 0 à 2 en production depuis au moins une semaine ; inventaire croisé à zéro référence cassée.

**Actions :**

**3.1 — Mise en place dans le compte Bunny existant** [B02 §3, sans la partie Optimizer] :

- **Zones de stockage** : `amame-public` et `amame-private`, tier Standard, Francfort, sans réplication. La zone `amame-backups` existe déjà depuis l'étape 0.
- **Pull Zone** `amame-media`, servie sur `media.amame.ml`.
- **Tests de fumée**, avec une vérification supplémentaire : le listing de Bunny restitue-t-il l'empreinte des objets ? Sinon, la réconciliation comparera les tailles, et les empreintes seulement sur un échantillon téléchargé.
- **Cookies à vérifier avant d'exposer `media.amame.ml`** [B02 D10] :
  - le profil `prod` déclare `cookie.domain=.amame.ml` ([application-prod.properties:56](../backend/src/main/resources/application-prod.properties#L56)), tandis que le compose versionné le surcharge par une valeur vide ([docker-compose.yml:41](../docker-compose.yml#L41)) ;
  - il faut vérifier la valeur effective dans les variables de la stack de production. Avec un cookie de domaine, le CDN recevrait les jetons des utilisateurs à chaque image : passer d'abord aux cookies *host-only*, ou utiliser le nom d'hôte `amame-media.b-cdn.net`.

**3.2 — Code** :

- client HTTP Bunny et implémentation Bunny du stockage [B02 §4.4, §4.5], avec le budget de DT5 (2 tentatives, 20 s) au lieu de 3 × 60 s ;
- indicateur de santé Bunny placé **hors** de la sonde de vivacité : une panne de Bunny ne doit pas faire redémarrer le backend ;
- déploiement avec `STORAGE_PROVIDER=local` : rien ne change encore.

**3.3 — Copie pilotée par les métadonnées.** Un conteneur ponctuel de `amame-ops` parcourt les lignes `file_entity`, et non le disque. Pour chaque ligne, il envoie le fichier dans la zone déduite de la clé, avec l'empreinte enregistrée en base. Le script est idempotent.

Pendant la migration seulement, ce conteneur reçoit les mots de passe d'écriture des zones publique et privée. Ils sont retirés de `amame-ops` au nettoyage de l'étape 6.

**Pourquoi partir des métadonnées plutôt que du disque** [B02 §7.2] :

- Bunny ne reçoit que ce que la base référence : I2 est vrai dès le premier jour ;
- l'empreinte envoyée est celle de la base : Bunny refuse tout fichier local qui aurait divergé.

**3.4 — Vérification avant bascule.** On lance la réconciliation en mode rapport. Pour chaque ligne, on contrôle que l'objet est présent dans la bonne zone, avec la même taille et la même empreinte. La bascule n'a lieu qu'**à zéro écart**.

**3.5 — Bascule depuis Portainer :**

1. Dans les variables de la stack `amame` : `STORAGE_PROVIDER=bunny` et `MEDIA_BASE_URL=https://media.amame.ml`, puis mise à jour de la stack. Le frontend lit la nouvelle URL au démarrage, sans reconstruction.
2. Relance immédiate de la copie, pour rattraper les lignes créées entre la copie et la bascule.
3. Redirections Nginx : `/uploads/…` redirige (301) vers le CDN ; `/uploads/utilisateur/…` reste en 404.

**3.6 — Après 48 h sans anomalie** : activer la tâche de purge en production (elle opère désormais dans Bunny) et planifier la réconciliation hebdomadaire en mode rapport.

**Cohérence.** Bunny contient exactement ce que la base décrit, vérifié objet par objet grâce à l'empreinte. Les clés étant identiques, la base n'est pas modifiée.

**Justification.** La copie et la vérification ont lieu **avant** la bascule, pendant que le service tourne normalement. La bascule elle-même se réduit à deux variables de stack. Comme la base n'est pas touchée, un incident ne peut avoir qu'une seule cause.

**Critères de sortie :**

- [ ] La recette [B02 §8.2] est passée.
- [ ] La réconciliation indique zéro référence cassée et zéro écart d'empreinte.
- [ ] Aucun 404 sur les médias dans les journaux pendant 48 h.
- [ ] Plus aucune requête `/uploads/` n'est servie depuis le disque du VPS.

**Retour arrière :**

1. Dans la stack : `STORAGE_PROVIDER=local` et `MEDIA_BASE_URL` vide, puis mise à jour.
2. Désactiver la purge pendant l'opération.
3. Rapatrier sur le disque les objets des lignes créées depuis la bascule. La liste vient de la base, triée par date d'upload.

Aucune donnée en base n'est à modifier.

---

### Étape 4 — Bascule de la base vers Neon (plan Free)

**Objectif.** Les métadonnées, comme toutes les autres données, quittent le VPS. Bunny n'est pas modifié.

**Prérequis.** Étape 3 stable depuis au moins une semaine (DT2).

**Actions :**

**4.1 — Mise en place chez Neon** [N02 §3], adaptée au plan Free :

- **Projet** : `amame`, à Francfort (`aws-eu-central-1`), PostgreSQL 17, plan **Free**.
- **Calcul** : fixé à 0,25 CU (minimum = maximum). La veille après 5 min d'inactivité est imposée. Restauration à un instant donné : 6 h, le maximum du plan.
- **Rôles** : `amame_owner`, `amame_app`, `amame_scraper` et `amame_backup`.
- **Latence** : mesurée depuis le VPS.
- **Vérifications à la création** : relever dans la console les limites exactes du plan Free (calcul, stockage, trafic, branches) et le comportement en cas de dépassement. Mettre à jour §3.2 et §6.3 si elles diffèrent.
- **Point de cohérence sur les rôles** :
  - le déclencheur de purge s'exécute avec les droits de l'utilisateur qui supprime la ligne (`amame_app`). Ce rôle doit donc pouvoir insérer dans `storage_purge_queue` et utiliser sa séquence ;
  - le script de rôles le couvre déjà (droits sur toutes les tables et séquences), mais c'est à vérifier explicitement en répétition ;
  - `amame_scraper` n'a aucun droit sur `file_entity` ni sur la file.

**4.2 — Répétition sur la branche `repetition`** [N02 §7.1], avec l'environnement de recette défini en DT7 : stockage local, médias affichés depuis le CDN de production, purge et réconciliation désactivées. En plus de la recette prévue par le plan Neon :

- vérifier que le dump a transporté **tout** le schéma : contraintes, déclencheurs, file de purge, historique Flyway de V1 à V3 ;
- lancer la réconciliation en mode rapport contre les zones de production, avec les mots de passe **en lecture seule**. Résultat attendu : zéro référence cassée, ce qui prouve que la restauration a préservé le contrat ;
- **mesurer le réveil à froid** : premier appel d'API après 6 minutes sans requête, 10 essais [N02 §8.2]. C'est la référence pour le seuil du §6.3 ;
- **relever les CU-h consommés** par la répétition, pour vérifier que l'on comprend bien la consommation ;
- **supprimer la branche** dès la répétition terminée : elle consomme le même quota que la production.

**4.3 — Bascule** [N02 §7.2] :

1. **Arrêt du backend** depuis Portainer. Plus aucune écriture n'a lieu, ni en base ni dans Bunny, puisque les uploads comme la purge passent tous par le backend.
2. **Dump final et restauration**, exécutés par un conteneur ponctuel de `amame-ops`, puis exécution du script de rôles.
3. **Comparaison** entre l'ancienne base et Neon :
   - nombre de lignes par table ;
   - liste complète des `file_path`, triée, identique des deux côtés.
4. **Mise à jour des variables** de la stack `amame` (connexion Neon, profil de pool « veille »), puis redémarrage du backend.
5. **Ancienne base** : son conteneur est arrêté depuis Portainer, son volume est conservé 14 jours.

Pendant la fenêtre de maintenance, le site public continue d'afficher ses images depuis le CDN. Seules l'API et les pages dynamiques sont indisponibles.

**4.4 — Après la bascule** :

- `amame-ops` sauvegarde désormais Neon (rôle `amame_backup`) et n'a plus besoin du réseau de la stack `amame` ;
- réconciliation en mode rapport : zéro référence cassée attendue ;
- réactivation de la purge ;
- suivi des entrées en attente : elles ont migré avec le dump et reprennent leur cours ;
- **relevé quotidien des CU-h pendant deux semaines**, puis hebdomadaire. La projection mensuelle se compare aux seuils du §6.3.

**Cohérence.** La bascule ne change ni les clés ni les objets : le contrat est transporté tel quel, et la vérification par liste de clés prouve qu'aucune métadonnée n'a été perdue.

**Justification.**

- **Un dump cohérent sans coordination** : arrêter le backend fige la base et Bunny en même temps. C'est ce qui rend le dump final cohérent avec Bunny sans coordination supplémentaire.
- **Choisir le plan Free n'engage pas** : le projet, la région, la version et les rôles sont exactement ceux qu'utiliserait le plan Launch. Seuls le plan et quelques variables changeront (§6.1).

**Critères de sortie :**

- [ ] La recette et les mesures [N02 §8] sont passées.
- [ ] Le nombre de lignes par table et la liste des clés sont identiques des deux côtés.
- [ ] La réconciliation indique zéro référence cassée.
- [ ] Le temps de réponse médian, hors réveil à froid, ne dépasse pas la référence de plus de 20 ms.
- [ ] Le réveil à froid est mesuré et consigné.
- [ ] La projection de consommation après deux semaines reste sous le seuil d'alerte (§6.3).

**Retour arrière.** Suivre [N02 §7.4] :

1. remettre les anciennes variables de connexion dans la stack ;
2. redémarrer le conteneur de l'ancienne base ;
3. redémarrer le backend.

Comme la bascule ne modifie pas Bunny, revenir à la base locale reste cohérent. Si des écritures ont eu lieu sur Neon entre-temps, le dump inverse ramène les lignes, et leurs objets sont déjà dans Bunny.

---

### Étape 5 — Diffusion des images par le CDN, sans Optimizer

**Objectif.** Achever le rôle de CDN de Bunny : toutes les images, y compris celles du site, sont servies par la Pull Zone. Les uploads sont allégés, le tout sans dépendre d'Optimizer, reporté (§13, A4).

**Prérequis.** Étape 3 terminée. Cette étape peut aussi se placer entre les étapes 3 et 4, à condition de ne jamais être livrée la même semaine qu'une bascule.

**Déjà livré à l'étape 0** (écart E12 du suivi) : les images statiques sont en WebP, nommées en ASCII avec leur largeur, rangées dans `public/static/` et servies avec `srcset` et `sizes`. Pour elles, il reste à les déplacer dans `amame-public/static/` et à pointer le frontend vers le CDN.

**Actions** [B02 §5.4 à §5.6, variante « sans Optimizer » de B02 D6] :

- **Images statiques** :
  - les WebP produits à l'étape 0 en 640, 1280 et 1920 px [B01 §7] sont renommés en ASCII, avec la largeur dans le nom ;
  - ils sont ensuite déplacés dans `amame-public/static/` ;
  - le frontend les sert avec `srcset` et `sizes`, à partir de ces trois fichiers fixes.
- **Image Docker du frontend allégée** : les images déplacées sortent de l'image (environ 90 Mo de moins à chaque build et à chaque déploiement [B01 A3]). Le logo et le favicon y restent, car ils font partie de la coquille de l'application.
- **Uploads compressés dans le navigateur avant l'envoi** :
  - 1280 px au plus, en WebP, environ 500 Ko au maximum ;
  - le réencodage retire aussi les données EXIF, dont la position GPS [B01 S4].
- **Frontend** : `preconnect` vers le domaine média ; nettoyage des règles Workbox.

**Pourquoi 1280 px pour les uploads, et non 1920 px comme le prévoyait [B02 §5.5].** Sans Optimizer, chaque image uploadée n'existe qu'en une seule taille, servie aussi bien aux cartes de 640 px qu'à la page de détail. Avec 1280 px, la page de détail reste nette et une liste de cartes reste légère sur mobile. Le jour où Optimizer sera activé, il produira les tailles inférieures à partir de cet original.

**Cohérence :**

- `static/` reste hors de Neon et hors du périmètre de la réconciliation (DT8). Ses fichiers changent de nom à chaque nouvelle version [B02 D4].
- La compression a lieu dans le navigateur, avant l'envoi : l'empreinte est calculée sur les octets réellement stockés et reste donc exacte.
- Activer Optimizer plus tard ne demandera ni nouvelle clé, ni nouvelle métadonnée, ni copie d'objets : un réglage dans le panneau Bunny et une variable de stack suffiront.

**Justification.**

- **Un CDN complet, sans coût** : cette étape achève le rôle de CDN de Bunny sans coût supplémentaire. Optimizer accélère, mais le bon fonctionnement du site n'en dépend pas. La variante sans Optimizer apporte déjà l'essentiel du gain [B02 D6].
- **Une seule cause par incident** : cette étape dépend du CDN, donc de l'étape 3, mais pas de Neon. La garder séparée des bascules préserve ce principe.

**Critères de sortie :**

- [ ] L'accueil pèse moins de 1,5 Mo.
- [ ] Les pages de listes (articles, galeries…) chargent moins de 2 Mo d'images au premier affichage, grâce au chargement différé.
- [ ] LCP inférieur à 2,5 s en « Slow 4G ».
- [ ] Taux de cache Bunny supérieur à 90 % après une semaine.
- [ ] Aucune image servie depuis le VPS, hors logo et favicon.
- [ ] Aucune URL média ne porte de paramètre de redimensionnement.

**Retour arrière.** Remettre le tag d'image frontend précédent : les images statiques reviennent dans l'image. Les objets `static/` restent dans Bunny, sans effet.

---

### Étape 6 — Exploitation de la cohérence et nettoyage

**Objectif.** Rendre le contrôle de cohérence continu et mesurable, suivre les quotas du plan Free, et retirer du VPS tout ce qui n'a plus lieu d'y être.

**Actions :**

- **Réconciliation** : passage en mode `enforce` après 4 semaines de rapports sans faux positif. Alerte sur toute référence cassée ou tout écart d'empreinte.
- **Sauvegardes** (DT9) :
  - dumps de Neon toutes les 12 h ;
  - copie incrémentale des objets chaque nuit ;
  - **archive mensuelle hors de Bunny**, sur le support désigné ;
  - alerte par e-mail en cas d'échec.
- **Suivi des quotas Neon** : relevé hebdomadaire du calcul, du trafic sortant et du stockage, comparé aux seuils du §6.3. L'équipe désigne une personne responsable de ce relevé.
- **Exercice trimestriel de restauration croisée** :
  1. restaurer le dump le plus récent dans une branche Neon éphémère ;
  2. lancer la réconciliation en mode rapport, en lecture seule : zéro référence cassée attendue ;
  3. supprimer la branche.

  C'est la preuve concrète de I5. La PITR de 6 h se teste de la même façon, sur une branche créée à H-3.
- **Nettoyage** :
  - **à J+14 de l'étape 4** : services `database` et `pgadmin`, et leurs volumes, retirés de la stack `amame` (`postgres-exporter` est déjà parti avec la supervision, écart E14) ;
  - **à J+30 de l'étape 3** : montages des uploads dans le backend et dans Nginx ([docker-compose.yml:62-63](../docker-compose.yml#L62-L63), [docker-compose.yml:79-81](../docker-compose.yml#L79-L81)), après une archive chiffrée hors du VPS ;
  - **dans `amame-ops`** : retrait des mots de passe d'écriture des zones publique et privée, qui ne servaient qu'à la copie (étape 3) ;
  - les redirections `/uploads/` restent en place plusieurs mois.
- **Branche `dev`** : seulement si elle est vraiment nécessaire, anonymisée, avec les lignes des fichiers privés supprimées et la file de purge vidée (DT7). Le développement courant reste sur PostgreSQL local.
- **Documentation** :
  - `CLAUDE.md` : Neon Free, Bunny, Portainer et ses deux stacks, variables, plus de volume `uploads`, tags d'image ;
  - README : sauvegardes, restauration croisée, environnements, seuils de passage à Launch.
- **Historique Git** : réécriture une fois les secrets changés [B02 §7.5], décision validée (§12).

**Cohérence.** Le contrôle devient continu et mesuré, et la restauration croisée est éprouvée régulièrement.

**Critères de sortie.** Les critères globaux du §9.

---

## 6. Trajectoire d'évolution : changer de plan, monter en charge, changer de fournisseur

Le plan Free est un point de départ, pas une contrainte d'architecture. Tout ce qui suit se fait **sans modifier le code ni migrer les données**, à condition de respecter les règles du §6.2.

### 6.1 Changements prévus et leur coût

| Changement | Comment | Code | Données |
| --- | --- | --- | --- |
| **Neon Free → Launch** | (1) changer de plan dans la console (moyen de paiement requis) ; (2) porter la PITR à 7 jours ; (3) au choix : garder la veille, ou la désactiver et passer les variables de pool au profil « toujours actif », puis mettre la stack à jour | aucun | aucune : même projet, même point d'accès, mêmes chaînes de connexion. La rétention de purge (10 jours) reste valable |
| **Launch → Scale** | (1) changer de plan ; (2) allonger la PITR (jusqu'à 30 jours) ; (3) **porter la rétention de purge au-delà** (par exemple 31 jours) ; (4) activer le filtrage par IP sur l'adresse du VPS | aucun | aucune |
| **Plus de puissance de calcul** | relever le maximum d'autoscaling dans la console (par exemple 0,25 → 1 CU). À éviter sur Free, où chaque pic consomme le quota quatre fois plus vite | aucun | aucune |
| **Plusieurs instances du backend** | ajouter des répliques dans la stack. Le backend est sans état ; la purge utilise `SKIP LOCKED` ; la réconciliation, un verrou consultatif | aucun | aucune |
| **Neon → autre PostgreSQL** (géré ou auto-hébergé, version 17 ou plus) | dump et restauration, script de rôles, nouvelle variable de connexion | aucun | copie par dump, contrat de clés inchangé |
| **Optimizer activé ou retiré** | panneau Bunny et variable `MEDIA_OPTIMIZER_ENABLED` (§13, A4) | aucun | aucune |
| **Réplication de `amame-backups`** dans une deuxième région | panneau Bunny (ajout irréversible) | aucun | aucune |
| **Bunny → autre stockage objet** | nouvelle implémentation de l'interface de stockage, copie des objets avec les mêmes clés, nouvelle URL média | une classe | aucune en base |

### 6.2 Règles de portabilité

Pour garder ces portes ouvertes, quatre règles s'imposent à tout développement futur :

1. **PostgreSQL standard uniquement.** Pas de pilote *serverless* propre à Neon, ni d'API de données, d'authentification ou d'extension spécifique à Neon dans le code. La console et les branches de Neon servent à l'exploitation, jamais au fonctionnement de l'application.
2. **Toute valeur d'infrastructure dans une variable** : connexion, profil de pool, fournisseur de stockage, URL des médias, rétention de purge, horaires des tâches, tags d'image. Aucune valeur d'infrastructure n'est écrite en dur dans le code ou dans une image.
3. **Le schéma n'évolue que par Flyway**, en PostgreSQL standard.
4. **Clés d'objets neutres et URL calculées** : aucune URL ni aucun nom de fournisseur en base.

### 6.3 Critères de passage de Free à Launch

| Indicateur | Où le lire | Seuil d'alerte (on active les leviers) | Seuil de passage à Launch |
| --- | --- | --- | --- |
| Projection mensuelle du calcul : consommation × 30 / jours écoulés | console Neon, relevé hebdomadaire | > 60 CU-h | > 80 CU-h, ou plus de 80 % du quota consommé avant le 25 du mois |
| Trafic sortant du mois | console Neon | > 3 Go | > 4 Go |
| Stockage | console Neon | > 60 % de la limite | > 80 % de la limite |
| Réveil à froid : médiane du premier appel d'API après 6 min d'inactivité, sur 10 mesures | mesure manuelle mensuelle | > 1 s | > 2 s, ou plaintes d'utilisateurs |
| Besoin de restauration au-delà de 6 h | incident | — | dès le premier incident où 6 h n'auraient pas suffi |
| Branches ou environnements supplémentaires | besoin de l'équipe | — | selon le besoin |

**Leviers à activer au seuil d'alerte, du moins coûteux au plus coûteux :**

1. Vérifier qu'aucune source de réveil imprévue n'est apparue (§3.2) : sonde, robot d'indexation, tâche déplacée hors de la fenêtre de nuit.
2. Activer le cache court des listes publiques, préparé à l'étape 1 : donner une durée à `PUBLIC_LISTS_CACHE_TTL` (par exemple `10m`), puis mettre la stack à jour.
3. Passer à Launch. Le passage prend quelques minutes, sans interruption de service. Coût : environ 10 $/mois en gardant la veille, environ 20 $/mois en toujours actif [N02 §9].

**Ne jamais attendre le quota.** Si Neon suspend le calcul jusqu'au mois suivant, le site est indisponible. Le passage à Launch se décide au seuil, pas après l'incident.

---

## 7. Configuration consolidée

Le `.env.example` du dépôt documente toutes les variables, sans aucune valeur secrète. En production, les valeurs sont saisies dans les variables des stacks Portainer.

### 7.1 Stack `amame` (application)

| Variable | Utilisée par | Secret | Introduite à l'étape | Remarque |
| --- | --- | --- | --- | --- |
| `BACKEND_IMAGE_TAG`, `FRONTEND_IMAGE_TAG` | stack | non | 0 | versionnés ; le retour arrière consiste à remettre le tag précédent |
| `POSTGRES_PASSWORD` | base locale, backend | oui | 0 | mot de passe de la base du VPS. PostgreSQL ne le lit qu'à la création du volume : le changer d'abord par `ALTER USER`. Disparaît avec la base locale (étape 6) |
| `JWT_SECRET` | backend | oui | 0 | plus aucune valeur par défaut dans le compose |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | backend | mot de passe : oui | 0 | vides en temps normal ; créent le premier administrateur sur une table des utilisateurs vide |
| `PGADMIN_PASSWORD` | pgAdmin | oui | 0 | outil accessible sur `127.0.0.1` seulement. `GRAFANA_ADMIN_PASSWORD` a disparu avec la supervision (écart E14) |
| `FRONTEND`, `COOKIE_DOMAIN`, `COOKIE_SECURE` | backend | non | 0 | valeurs locales par défaut ; en production : `https://amame.ml` et `true` |
| `DATABASE_URL` | backend | non | 1 | URL JDBC ; `sslmode=verify-full` sur Neon. Par défaut, tant que la base est sur le VPS : `jdbc:postgresql://database:5432/amame_db` |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | backend | oui | 1 | `amame_app` sur Neon. Par défaut, tant que la base est sur le VPS : `postgres` et `POSTGRES_PASSWORD` |
| `DATABASE_MIGRATION_USERNAME`, `DATABASE_MIGRATION_PASSWORD` | backend (Flyway) | oui | 1 | `amame_owner` sur Neon. Mêmes valeurs par défaut que ci-dessus |
| `DB_POOL_MAX_SIZE` | backend | non | 1 | 10 |
| `DB_POOL_MIN_IDLE` | backend | non | 1 | **0** (« veille », plan Free) ; 2 (« toujours actif ») |
| `DB_POOL_IDLE_TIMEOUT` | backend | non | 1 | en millisecondes : **60000** (« veille ») ; 300000 (« toujours actif ») |
| `DB_POOL_KEEPALIVE_TIME` | backend | non | 1 | en millisecondes : **0, désactivé** (« veille ») ; 120000 (« toujours actif ») |
| `STORAGE_PROVIDER` | backend | non | 1 | `local`, puis `bunny` à l'étape 3 |
| `MEDIA_BASE_URL` | backend et frontend, lue au démarrage | non | 1 | **même valeur pour les deux conteneurs** ; remplace la variable de build `VITE_MEDIA_BASE_URL` |
| `MEDIA_OPTIMIZER_ENABLED` | frontend, lue au démarrage | non | 1 | `false` tant qu'Optimizer n'est pas activé : aucun paramètre de redimensionnement n'est ajouté aux URL (§13, A4) |
| `PUBLIC_LISTS_CACHE_TTL` | backend | non | 1 | **0, désactivé** ; une durée (`10m`, `1h`) active le cache des listes publiques (§6.3, écart E20) |
| `AUTH_TOKEN_CLEANUP_SCHEDULE` | backend | non | 1 | nettoyage des jetons de session expirés, chaque nuit à 02:30 UTC, dans la même fenêtre que les sauvegardes (écart E21) |
| `BUNNY_STORAGE_ENDPOINT` | backend | non | 3 | Francfort par défaut |
| `BUNNY_PUBLIC_ZONE`, `BUNNY_PUBLIC_ZONE_KEY` | backend | clé : oui | 3 | écriture dans `amame-public` |
| `BUNNY_PRIVATE_ZONE`, `BUNNY_PRIVATE_ZONE_KEY` | backend | clé : oui | 3 | écriture dans `amame-private` |
| `BUNNY_API_KEY` | backend | oui | facultative | seulement si la purge du cache CDN est utilisée |
| `STORAGE_PURGE_ENABLED` | backend | non | 2 | `false` par défaut ; `true` en production uniquement |
| `STORAGE_PURGE_RETENTION` | backend | non | 2 | 10 jours ; doit toujours dépasser la fenêtre PITR de Neon |
| `STORAGE_PURGE_SCHEDULE` | backend | non | 2 | chaque nuit à 02:30 UTC |
| `STORAGE_RECONCILIATION_MODE` | backend | non | 3 | `off` par défaut ; `report`, puis `enforce` en production |
| `STORAGE_RECONCILIATION_SCHEDULE` | backend | non | 3 | chaque dimanche à 02:30 UTC |

### 7.2 Stack `amame-ops` (sauvegardes et opérations)

| Variable | Utilisée par | Secret | Introduite à l'étape | Remarque |
| --- | --- | --- | --- | --- |
| `BACKUP_DATABASE_URL` | sauvegarde | oui | 0 | base locale jusqu'à l'étape 4, puis Neon avec le rôle `amame_backup`, en lecture seule. Remplace `NEON_BACKUP_URL` (écart E5) |
| `SCRAPER_DATABASE_URL` | scrapers | oui | 0 | rôle `amame_scraper` après l'étape 4 |
| `BACKUP_PASSPHRASE` | sauvegarde | oui | 0 | à conserver aussi hors du serveur ; sans elle, les sauvegardes sont illisibles |
| `BACKUP_DB_SCHEDULE` | sauvegarde | non | 0 | heures `HH:MM` en UTC, séparées par des espaces ; `02:30 14:30` par défaut |
| `BACKUP_DB_RETENTION_DAYS` | sauvegarde | non | 0 | 30 jours ; ne concerne que les dumps, jamais les fichiers |
| `UPLOADS_HOST_PATH` | sauvegarde | non | 0 | chemin réel du dossier des uploads sur l'hôte, monté en lecture seule. Inutile après l'étape 3 |
| `AMAME_NETWORK` | sauvegarde, scrapers | non | 0 | réseau Docker de la stack `amame`, pour joindre la base locale. Inutile après l'étape 4 |
| `OPS_IMAGE_TAG`, `SCRAPER_IMAGE_TAG` | stack | non | 0 | versionnés, comme ceux de la stack `amame` |
| `OPS_PG_MAJOR` | construction de l'image | non | 0 | version majeure de la base sauvegardée : 15 sur le VPS, **17 à partir de l'étape 4** |
| `BUNNY_BACKUP_ZONE`, `BUNNY_BACKUP_ZONE_KEY` | sauvegarde | oui | 0 | **jamais dans la stack `amame`** (DT6) |
| `BUNNY_PUBLIC_ZONE_READONLY_KEY`, `BUNNY_PRIVATE_ZONE_READONLY_KEY` | copie incrémentale ; réconciliation en recette | oui | 3 | mots de passe en lecture seule des zones |
| `BUNNY_PUBLIC_ZONE_KEY`, `BUNNY_PRIVATE_ZONE_KEY` | copie de migration | oui | 3 | **temporaires** : retirés à l'étape 6 |

**Règle de cohérence à respecter dans la durée.** La rétention de purge doit toujours dépasser la fenêtre PITR de Neon :

- plan Free (6 h) ou Launch (7 jours) : 10 jours conviennent ;
- plan Scale avec une PITR de 30 jours : la porter à 31 jours au moins.

Sinon, I5 n'est plus garanti (§6.1).

---

## 8. Écarts par rapport aux plans 02

| # | Sujet | Proposition initiale | Ajustement retenu | Raison |
| --- | --- | --- | --- | --- |
| 1 | Suppression des objets | après le commit, via un listener `@PostRemove` [B02 D9, §4.7] | déclencheur en base, file de purge, effacement après 10 jours | PITR (I5), atomicité, exhaustivité, réversibilité (§1.4) |
| 2 | Réconciliation | suppression directe des orphelins de plus de 48 h, verrou ShedLock [B02 §4.12] | inscription dans la file ; préfixe `uploads/` seulement ; production seulement ; `SKIP LOCKED` | une seule voie de suppression, différée ; protège `static/` (DT8) |
| 3 | Copie des fichiers | parcours du disque [B02 §7.2] | parcours des métadonnées, empreinte issue de la base | Bunny démarre sans orphelin ; intégrité prouvée (étape 3) |
| 4 | Empreinte SHA-256 | envoyée à Bunny, non conservée [B02 §4.4] | conservée dans `file_entity` | vérification sans retéléchargement ; preuve de migration |
| 5 | Sauvegarde de la base | zone privée, dossier `backups/db/` [N02 §11] | zone dédiée `amame-backups`, clé limitée à `amame-ops` | moindre privilège (DT6) |
| 6 | Sauvegarde des fichiers | copie mensuelle des zones [B02 §10] | copie incrémentale chaque nuit, plus une archive mensuelle hors de Bunny | sauvegardes cohérentes avec les dumps (DT9) |
| 7 | Relances vers Bunny | 3 tentatives, 60 s de lecture [B02 §4.4] | 2 tentatives, 20 s | ne pas bloquer une connexion Neon (DT5) |
| 8 | HikariCP | réglé pour une base distante [N02 §4.2] | en plus : auto-commit désactivé, seuil de fuite à 60 s, deux profils pilotés par variables | DT5 ; passage de Free à Launch sans nouvelle image |
| 9 | Tests du stockage | H2 [B02 §8.1] | PostgreSQL via Testcontainers | les déclencheurs sont propres à PostgreSQL (DT4) |
| 10 | Répétition Neon | backend démarré sur la branche [N02 §7.1] | en plus : stockage local, tâches désactivées, réconciliation en lecture seule ; branche supprimée aussitôt | I6 (DT7) ; quota du plan Free |
| 11 | Environnement de développement | branche `dev` anonymisée [N02 D10] | PostgreSQL local ; branche `dev` seulement si nécessaire, avec les lignes des fichiers privés supprimées et la file vidée | quota partagé sur Free ; les lignes désignent des objets de production |
| 12 | Calendrier | migrations en parallèle, pas le même jour [N02 §10] | séquentiel : Bunny, puis Neon au moins une semaine plus tard | DT2 |
| 13 | Plan Neon | Launch, toujours actif [N02 D2, D6] | **Free au démarrage**, veille imposée, calcul fixé à 0,25 CU, passage à Launch sur seuils chiffrés | décision du 2 octobre 2026 ; trajectoire au §6 |
| 14 | Fréquence des dumps | quotidienne [N02 §11] | toutes les 12 h, conservés 30 jours | PITR limitée à 6 h sur le plan Free |
| 15 | Tâches planifiées | cron de l'hôte, horaires libres [N02 §11] | conteneur planificateur dans `amame-ops` ; une seule fenêtre de nuit pour tout ce qui touche la base | Portainer ; un seul réveil de la base par nuit |
| 16 | Déploiement et secrets | `docker compose` et `.env` sur le serveur [N02 §6, B02 §6] | stacks Portainer `amame` et `amame-ops`, variables de stack, tags versionnés | contexte d'exploitation réel (§3.1) |
| 17 | URL des médias côté frontend | variable de build [B02 §6.1, §6.2] | lue au démarrage du conteneur | bascule et retour arrière sans reconstruire l'image |
| 18 | Optimizer | évaluation pendant l'essai gratuit, en phase 3 [B02 D6, §11] | **reporté après le socle**. Les paramètres sont désactivés par variable ; les images statiques sont servies en trois largeurs fixes avec `srcset` ; les uploads sont compressés dans le navigateur (1280 px) | décision du 2 octobre 2026 : le socle ne dépend pas d'Optimizer (§13) |

Toutes les autres décisions des plans 02 sont reprises telles quelles :

- **Neon** : PostgreSQL 17, connexion directe, rôles séparés, Flyway, TLS vérifié ;
- **Bunny** : API HTTP native, deux zones publique et privée, tier Standard, clés identiques, URL calculées, endpoint privé.

---

## 9. Critères d'acceptation du socle : « Neon et Bunny marchent parfaitement »

Le socle est terminé, et les fonctionnalités avancées peuvent commencer (§13), lorsque tous les points suivants sont vrais :

- [ ] **Stabilité** : 30 jours consécutifs en production sans référence cassée, sans écart d'empreinte et sans incident attribuable à Neon ou à Bunny.
- [ ] **VPS sans données** : ni volume de base, ni dossier `uploads`. Reconstruire le serveur depuis Git, les images publiées et les variables de stack suffit.
- [ ] **Réconciliation** : zéro référence cassée, zéro écart d'empreinte, tous les orphelins inscrits dans la file de purge.
- [ ] **Restauration croisée** : le dernier dump, restauré dans une branche, ne présente aucune référence cassée.
- [ ] **Performance** :
  - [ ] API, hors réveil à froid : temps de réponse médian au plus 20 ms au-dessus de la référence [N01 §2.5] ;
  - [ ] réveil à froid mesuré, sous le seuil d'alerte (§6.3) ;
  - [ ] accueil : moins de 1,5 Mo ;
  - [ ] LCP : moins de 2,5 s en « Slow 4G » ;
  - [ ] cache Bunny : taux supérieur à 90 %.
- [ ] **Quotas Neon** : sur le premier mois complet, la projection reste sous 60 CU-h, ou le passage à Launch a été effectué.
- [ ] **Sécurité** :
  - [ ] aucun secret dans Git ;
  - [ ] Portainer non exposé publiquement ;
  - [ ] backend connecté avec `amame_app`, sans privilège d'administration ;
  - [ ] clés d'écriture de production présentes uniquement dans la stack de production ;
  - [ ] clés de sauvegarde présentes uniquement dans `amame-ops` ;
  - [ ] fichiers privés accessibles seulement par l'endpoint authentifié.

---

## 10. Risques propres à la combinaison et parades

| Risque | Cause | Parade |
| --- | --- | --- |
| **Base suspendue jusqu'au mois suivant** | quota de calcul du plan Free atteint | calcul fixé à 0,25 CU ; une seule fenêtre de nuit ; aucune sonde sur la base ; caches ; relevé hebdomadaire ; passage à Launch au seuil, jamais après (§6.3) |
| Réveils à froid perçus par les visiteurs | veille imposée sur le plan Free | mesure à la répétition et chaque mois ; seuil de passage à Launch |
| Perte de données au-delà de 6 h | PITR limitée sur le plan Free | dumps toutes les 12 h, conservés 30 jours (DT9) |
| Suppression massive d'objets de production | backend de recette ou de développement branché avec les clés de production, réconciliation active | DT7 : clés de production dans la seule stack de production, tâches désactivées par défaut ; purge différée de 10 jours, donc récupérable |
| Références cassées après une restauration de Neon | objets effacés avant la fin de la fenêtre PITR | rétention de purge supérieure à la PITR, à revoir à chaque changement de plan (§7) ; exercice trimestriel |
| Compromission de Portainer | accès à Docker, donc à l'hôte et à tous les secrets | interface non publique, mot de passe fort, mises à jour ; clés de sauvegarde isolées dans `amame-ops` |
| Incident régional à Francfort touchant fichiers et sauvegardes | toutes les ressources Bunny dans la même région | archive mensuelle obligatoire hors de Bunny ; réplication de `amame-backups` ajoutable plus tard (§3.3) |
| Pool de connexions saturé par des uploads lents | upload Bunny effectué dans une transaction | DT5 ; limitation de débit ; lecture de `hikaricp.connections.pending` dans `/actuator/metrics`, puis alerte le jour où la supervision revient (écart E14) |
| Bascule impossible sans reconstruire une image | valeur figée au build | URL des médias lue au démarrage ; paramètres en variables de stack (§3.1) |
| Sauvegarde ou copie qui vise le mauvais dossier | chemin relatif résolu par Portainer ailleurs que prévu | chemin réel relevé à l'étape 0 ; stack déployée depuis le dépôt Git |
| Incident impossible à attribuer | deux bascules trop rapprochées | au moins une semaine entre les étapes 3 et 4 (DT2) |
| Fichier privé exposé par le CDN | erreur d'affectation de zone | zone déduite de la clé ; zone privée sans Pull Zone ; contrainte de format sur la clé |
| Jetons d'authentification envoyés au domaine média | cookie de domaine `.amame.ml` | cookies *host-only* vérifiés avant l'étape 3, ou nom d'hôte `b-cdn.net` [B02 D10] |
| Données personnelles conservées trop longtemps | purge différée, sauvegardes | 10 jours documentés ; objets privés retirés de la sauvegarde 30 jours après leur purge (DT9) |
| Dépendance à deux fournisseurs | Neon (groupe Databricks) et Bunny | règles de portabilité (§6.2) : un changement de fournisseur est une copie, pas une refonte |
| Socle fragilisé à mesure que les fonctionnalités s'ajoutent | plusieurs nouveautés livrées ensemble ; contrat ou portabilité contournés | règles d'intégration du §13.1 : une fonctionnalité à la fois, derrière un interrupteur, contrat et portabilité respectés |

---

## 11. Coûts

Tarifs repris des plans 02 (consultés les 29 et 30 septembre 2026). AMAME dispose déjà d'un abonnement Bunny : seul compte le coût **marginal** des ressources ajoutées pour le projet. Hypothèse de trafic : 10 000 visites par mois [B02 §9].

**Socle (étapes 0 à 6) :**

| Poste | Mensuel |
| --- | --- |
| Neon, plan Free | 0 $ |
| Bunny Storage, à 0,01 $/Go : `amame-public` (≈ 1 Go), `amame-private` (≈ 0,5 Go), `amame-backups` (dumps et copie des objets, ≈ 2 Go) | ≈ 0,04 $ |
| Bunny CDN, ≈ 9 Go par mois, de 0,01 $/Go (PoP européens) à 0,06 $/Go (Lagos) | ≈ 0,10 à 0,55 $ |
| Archive mensuelle hors de Bunny | selon le support choisi (quelques Go au plus) |
| **Total marginal** | **moins de 1 $/mois**, en plus de l'abonnement Bunny existant |

**Fonctionnalités avancées, seulement si elles sont décidées (§13) :**

| Poste | Mensuel |
| --- | --- |
| Bunny Optimizer (A4) | + 9,50 $ |
| Neon Launch avec veille, ≈ 12 h d'activité par jour (A9) | + ≈ 10 $ |
| Neon Launch toujours actif, 0,25 CU (A9) | + ≈ 20 $ |

---

## 12. Décisions validées

Le 2 octobre 2026, l'équipe a validé les recommandations, avec les précisions ci-dessous.

| # | Sujet | Décision |
| --- | --- | --- |
| 1 | Approche | **le socle d'abord** : Neon et Bunny doivent marcher parfaitement (critères du §9). Les fonctionnalités avancées s'ajoutent ensuite, une par une (§13) |
| 2 | Hébergement | VPS piloté par **Portainer** (§3.1) |
| 3 | Plan Neon | **Free au démarrage**, veille imposée, calcul fixé à 0,25 CU. Passage à Launch selon les seuils du §6.3 ; Launch toujours actif reste la cible quand un seuil est atteint |
| 4 | Compte Bunny | **abonnement existant** : les zones et la Pull Zone d'AMAME y sont créées |
| 5 | Bunny Optimizer | **reporté après le socle** ; décision ultérieure, sur mesures (§13, A4) |
| 6 | Rétention de purge | 10 jours |
| 7 | Archive mensuelle hors de Bunny | validée et **obligatoire** (§3.3) ; le support reste à désigner avant l'étape 6 |
| 8 | Régions | **Francfort pour tout** : Neon et les trois zones Bunny, y compris `amame-backups` |
| 9 | Historique Git | réécriture une fois les secrets changés, à l'étape 6 |
| 10 | Supervision | **retirée pour le moment** (décision du 4 octobre 2026) : Prometheus, Grafana et `postgres-exporter` quittent la stack `amame`. Son retour est prévu avec A3 (§13), une fois le socle stable |

**Reste à trancher en cours de route :**

- le support de l'archive mensuelle (avant l'étape 6) ;
- le moment du passage à Launch, selon les relevés (§6.3) ;
- l'ordre et le calendrier des fonctionnalités avancées, une fois le socle stable (§13).

---

## 13. Feuille de route : fonctionnalités avancées, intégrées au fur et à mesure

**Principe.**

1. **D'abord un socle qui marche parfaitement** : les étapes 0 à 6, validées par les critères du §9.
2. **Ensuite seulement, des fonctionnalités avancées**, ajoutées **une par une**.

Le socle a été conçu avec des points d'extension (§13.2) : chaque ajout se branche sur un élément existant, sans refonte ni migration de données.

### 13.1 Règles d'intégration

Une fonctionnalité avancée n'entre en production que si elle respecte les six règles suivantes :

1. **Socle stable** : les critères du §9 sont remplis, dont 30 jours consécutifs sans référence cassée ni incident attribuable à Neon ou à Bunny.
2. **Une seule à la fois** : jamais la même semaine qu'une autre fonctionnalité, une bascule ou un changement de plan. Un incident garde ainsi une seule cause possible.
3. **Interrupteur** : elle s'active et se désactive par une variable de stack, sans nouvelle image. Désactivée, elle laisse le socle se comporter exactement comme avant.
4. **Contrat respecté** :
   - si elle crée des objets, elle suit le protocole du §1.4 : objet d'abord, ligne ensuite, suppression par la file de purge ;
   - si elle ajoute des métadonnées, c'est par une migration Flyway, avec des valeurs calculées à partir des octets, jamais une URL ;
   - si elle introduit un nouveau dossier ou une nouvelle zone, la réconciliation est étendue dans la même livraison.
5. **Portabilité** (§6.2) : une fonctionnalité propre à un fournisseur n'est acceptée qu'avec une justification écrite et un plan de sortie.
6. **Critères de sortie mesurables**, et documentation (`CLAUDE.md`, README) mise à jour dans la même livraison.

### 13.2 Points d'extension prévus dans le socle

| Point d'extension | Créé à l'étape | Fonctionnalités qui s'y branchent |
| --- | --- | --- |
| Interface de stockage `FileStorageService` | 1 | changement de fournisseur ; vidéos (A13) ; upload direct (A14) |
| Validation des uploads | 1 | lecture des dimensions (A1) ; analyse antivirus (A7) |
| Calcul des URL côté backend, composant d'image côté frontend | 1 | Optimizer et `srcset` des uploads (A4) ; URL signées (A8) ; changement de domaine média |
| Table `file_entity` et migrations Flyway | 2 | dimensions (A1) ; propriétaire et auteur (A2) ; nouveaux types de médias (A13) |
| File de purge | 2 | nettoyage des objets dérivés (vignettes, variantes) |
| Réconciliation | 3 | nouveaux dossiers, par exemple les logos importés (A5) |
| Variables de stack et profils de pool | 1 | plan Neon (A9) ; interrupteurs de toutes les fonctionnalités |
| Stack `amame-ops` | 0 | nouvelles tâches : import d'images externes (A5), rapports |

### 13.3 Catalogue, par vagues

Les vagues vont du plus sûr au plus engageant :

1. renforcer le contrat et la visibilité, sans coût ;
2. améliorer l'expérience et le contenu ;
3. sécuriser les fichiers ;
4. monter en charge, uniquement sur déclencheur.

L'ordre **à l'intérieur** d'une vague reste libre, selon les priorités de l'association.

#### Vague 1 — Consolider (sans coût, dès la stabilisation du socle)

| # | Fonctionnalité | Apport | Effet sur le contrat Neon ↔ Bunny | Coût et effort | Déclencheur |
| --- | --- | --- | --- | --- | --- |
| A1 | Dimensions des images dans les métadonnées | largeur et hauteur lues à l'upload, et rattrapées pour l'existant. Toutes les images reçoivent des attributs `width` et `height` : fin des décalages de mise en page [B01 P3] | deux colonnes ajoutées par Flyway, calculées à partir des octets comme l'empreinte | 0 $ ; ≈ 1 j | socle stable |
| A2 | Propriétaire et auteur explicites | la colonne `user_id` de `file_entity` existe mais n'est jamais remplie [B01 B7]. On la renseigne pour les fichiers privés et on ajoute l'auteur des uploads d'administration. Le contrôle d'accès devient une simple lecture de métadonnée, et chaque fichier garde la trace de son auteur | colonne remplie à partir de la table de jointure, colonne d'auteur ajoutée par Flyway. À terme, la table de jointure de `User.files` peut disparaître | 0 $ ; ≈ 1 j | socle stable |
| A3 | Observabilité | remise en place de la supervision retirée le 4 octobre 2026 (écart E14 : services, configuration, accès du collecteur à `/actuator/prometheus`). extension standard `pg_stat_statements` pour repérer les requêtes lentes. Métriques des appels à Bunny (durée, erreurs) dans Grafana, à côté de celles du pool de connexions | aucun | 0 $ ; ≈ 0,5 j | socle stable |

#### Vague 2 — Performance et contenu

| # | Fonctionnalité | Apport | Effet sur le contrat Neon ↔ Bunny | Coût et effort | Déclencheur |
| --- | --- | --- | --- | --- | --- |
| A4 | Bunny Optimizer et `srcset` des uploads | redimensionnement et conversion (WebP, AVIF) à la volée : chaque écran reçoit la taille dont il a besoin, y compris pour les images uploadées [B02 D6, §3.4]. Activation : réglage du panneau, classes d'images, `MEDIA_OPTIMIZER_ENABLED=true` | aucun : les variantes sont des entrées du cache du CDN, pas des objets | 9,50 $/mois ; ≈ 1 j | décision de l'équipe, sur mesure du poids des pages de listes après l'étape 5 |
| A5 | Images externes rapatriées dans Bunny | les logos d'établissements et les drapeaux sont aujourd'hui chargés depuis des sites tiers [B01 P8]. Une tâche de `amame-ops` les télécharge, les valide, les stocke dans un nouveau dossier, puis crée leurs lignes | suit le protocole du §1.4. Le rôle `amame_scraper` reçoit le droit d'insérer dans `file_entity`, et la réconciliation couvre le nouveau dossier. Les droits de réutilisation des images sont à vérifier | ≈ 0 $ ; 1 à 2 j | images tierces cassées ou lentes |
| A6 | Recherche plein texte | recherche PostgreSQL standard (dictionnaire français, accents ignorés) sur les bourses, concours, articles et filières : résultats classés par pertinence, en une seule requête | aucun ; index PostgreSQL standard, donc portable | 0 $ ; 1 à 2 j | besoin produit |

#### Vague 3 — Sécurité des fichiers

| # | Fonctionnalité | Apport | Effet sur le contrat Neon ↔ Bunny | Coût et effort | Déclencheur |
| --- | --- | --- | --- | --- | --- |
| A7 | Analyse antivirus des uploads | l'inscription accepte des fichiers de visiteurs anonymes [B01 S2]. Une analyse (ClamAV, dans un conteneur dédié) intégrée à la validation les bloque avant l'envoi vers Bunny | aucun : un fichier refusé n'atteint ni Bunny ni Neon | 0 $, mais environ 1 Go de mémoire pour l'antivirus, à vérifier sur le VPS ; ≈ 1 j | volume d'uploads anonymes, ou exigence de sécurité |
| A8 | URL signées pour les fichiers privés | Pull Zone dédiée à `amame-private`, protégée par jeton (Token Authentication) [B02 D2]. Le backend vérifie le droit d'accès dans Neon, puis renvoie une URL signée valable quelques minutes. Le fichier part alors du CDN et non plus du backend, et les avatars ne tombent plus en 401 quand la session expire [B02 §4.9] | Neon reste le seul décideur. L'URL est calculée et expirante, jamais stockée | quelques centimes de trafic ; ≈ 2 j | consultation fréquente des fichiers privés, ou charge du backend |

#### Vague 4 — Échelle, uniquement sur déclencheur

| # | Fonctionnalité | Apport | Effet sur le contrat Neon ↔ Bunny | Coût et effort | Déclencheur |
| --- | --- | --- | --- | --- | --- |
| A9 | Neon Launch, avec ou sans veille | quota de calcul sans plafond, 7 jours de restauration ; plus de réveil à froid en toujours actif | aucun (§6.1) | 10 à 20 $/mois ; quelques minutes | seuils du §6.3 |
| A10 | Plusieurs instances du backend | déploiements sans coupure, absorption des pics | aucun : le backend est sans état, et la purge comme la réconciliation sont déjà protégées contre les exécutions concurrentes. Il faut retirer le nom de conteneur fixe, qui empêche les répliques, et vérifier que le total des connexions des instances reste sous la limite de Neon | 0 $ ; ≈ 1 j | saturation du backend, ou besoin de déploiements sans coupure |
| A11 | Branches Neon de prévisualisation en intégration continue | une base temporaire par pull request : les migrations Flyway et les tests s'exécutent sur une copie réaliste, et la branche est supprimée à la fusion | règles de DT7 : stockage local, aucune clé de production. Les branches partent d'une branche anonymisée, jamais de `main` | 1 à 2 j ; plutôt sur Launch, car les branches consomment le quota | plusieurs contributeurs, migrations fréquentes |
| A12 | Réplica en lecture | sépare les lectures lourdes (statistiques, exports) du trafic courant | aucun : un second point d'accès PostgreSQL, en lecture seule | selon le plan Neon ; ≈ 1 j | charge de lecture mesurée ; sans objet aujourd'hui |
| A13 | Vidéos avec Bunny Stream | encodage et lecture adaptée au débit, au lieu de vidéos brutes dans Storage | Neon garde l'identifiant de la vidéo et ses métadonnées (nouveau type de média, ajouté par Flyway). La réconciliation couvre la bibliothèque Stream | facturé à l'usage ; 2 à 3 j | publication de vidéos (témoignages, tutoriels) |
| A14 | Upload direct du navigateur vers Bunny | gros fichiers envoyés sans passer par le backend | le protocole change : une ligne « en attente » est réservée avant l'envoi, puis confirmée après vérification de l'empreinte, ou purgée. I1 et I2 sont préservés | 3 j ou plus | fichiers de plus de 10 Mo ; à étudier quand l'API S3 de Bunny sera stable [B02 D1] |

#### Fonctionnalités écartées

| Fonctionnalité | Raison |
| --- | --- |
| Neon Auth, Data API de Neon, pilote *serverless* de Neon | elles lieraient le code applicatif à Neon (§6.2). L'authentification JWT et la connexion JDBC existantes suffisent |
| Logique métier dans les scripts *edge* de Bunny | la logique et les décisions d'accès restent dans le backend, à partir des données de Neon (§1.1) |

---

## Annexe — Correspondance avec les phases des plans 02

| Étape de ce rapport | Plan Neon 02 (§10) | Plan Bunny 02 (§11) |
| --- | --- | --- |
| 0 — Sécurisation | phase 0, avec la sauvegarde envoyée vers `amame-backups` | phase 0, plus la création de la seule zone `amame-backups` |
| 1 — Socle de code commun | phase 1, avec les profils de pool pilotés par variables | phase 1, sauf `orphanRemoval` et listener ; URL des médias lue au démarrage |
| 2 — Contrat de métadonnées | Flyway V2/V3 (**nouveau**) | phase 1 : `orphanRemoval` ; listener **remplacé** par le déclencheur et la file de purge |
| 3 — Bascule Bunny | — | phase 2 |
| 4 — Bascule Neon | phases 2 et 3, sur le plan Free | — |
| 5 — Diffusion des images par le CDN | — | phase 3, variante sans Optimizer [B02 D6] ; Optimizer reporté (§13, A4) |
| 6 — Exploitation et nettoyage | phase 4, avec le suivi des quotas | phase 4 |
