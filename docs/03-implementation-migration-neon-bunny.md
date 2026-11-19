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

**Dernière mise à jour : 17 novembre 2026.**

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
| **0** | Sécurisation, Portainer, premier point de restauration | 🟡 écrit et vérifié en local ; sur `main` (`b14e7dd`), poussé sur GitHub le 8 novembre | 🟡 images publiées le 13 novembre ; stack `amame-ops` en service depuis le 14 novembre (sauvegarde et test de restauration réussis) ; application mise à jour le 15 novembre (`v1.1`), secrets changés, e-mails envoyés, limite de débit active et propre à chaque visiteur, accès aux données d'autrui refusé par le serveur, images de l'accueil à 0,16 Mo (16 novembre) ; correctif `v1.1.1` déployé et vérifié le 16 novembre (E44 corrigé) ; reste la sécurisation de Portainer (E43) ; à éclaircir : la session administrateur qui semble expirer au bout de 15 minutes | 7 / 8 |
| **1** | Socle de code commun | 🟡 écrit et vérifié en local ; sur `main` (`5c62c07`), poussé sur GitHub le 8 novembre ; images `v1.2` construites le 16 novembre avec le correctif E44 (E45), V1 corrigée et migration `V1_1` (E47), passage `v1.1.1` → `v1.2` essayé en local sur une base à la structure de la production (47 vérifications) ; commitées sur la branche locale `deploiement/v1.2` (`3baba45`) et **publiées le 16 novembre** ; `main` porte les mêmes corrections, non commitées | 🟡 **`v1.2` déployé le 16 novembre à 20:05 UTC** : baseline, migration 1.1 appliquée, validation du schéma sans erreur. Une première tentative, à 17:25, avait échoué sur deux variables vides de la stack (E49) : retour à `v1.1.1`, base inchangée, variables corrigées. L'équipe n'a pas fait les autres vérifications. Reste la mémoire (J.4) avant de passer à 512M (E48). Cookies sans domaine (E50) | 1 / 7 |
| **2** | Contrat de métadonnées et garde-fous en base | 🟡 écrit et vérifié en local ; commité sur `main` (`7466a23`) et poussé sur GitHub le 8 novembre ; suite de tests complète passée le 8 novembre (70 tests) ; migrations et scripts d'exploitation essayés sur une base jetable ; **17 novembre** : correctifs E51 (variables vides) et C13, 90 tests ; passage `v1.2` → `v1.3` et retour arrière essayés en local avec la stack de production (74 vérifications) ; commités sur la branche locale `deploiement/v1.3` (`e9e5437`) et **image `backend-v1.3` publiée le 17 novembre** | 🟡 **`backend-v1.3` déployé le 17 novembre à 11:26 UTC** : migrations 2, 3 et 4 appliquées, démarrage sans erreur ; inventaire conforme et sauvegarde juste avant. Actions N.2 à N.4 faites (26 lignes, toutes avec empreinte, 0 orpheline) ; les autres critères reposent sur l'essai local (décision de l'équipe du 17 novembre). ✅ Étape close | 2 / 6 en production |
| **3** | Bascule du stockage vers Bunny | 🟡 écrit le 17 novembre (3.2 à 3.5, migration V5) ; `./mvnw test` 115 tests, 0 échec ; essai local de bout en bout avec la stack de production et un faux Bunny : 61 vérifications, 0 échec ; commité sur la branche locale `deploiement/v1.3` (`6552a6d`) et **images `backend-v1.4`, `frontend-v1.3`, `ops-v1.2` publiées le 17 novembre** | 🟡 **déployée sans attendre le 24 (E57)** : `backend-v1.4` et `frontend-v1.3` le 18 novembre à 08:04 UTC (V5) ; zones `amame-public-storage-zone` et `amame-private-storage-zone`, Pull Zone `amamemedia` ; copie et réconciliation conformes (26 objets) ; **bascule vers Bunny à 08:35 UTC**, médias servis par `https://amamemedia.b-cdn.net` (E58) ; sauvegarde depuis Bunny. Recette passée le 18 novembre ; `ops-v1.2.1` (PostgreSQL 15.20, C16), `restore-test.sh` réussi. Restent les 48 h sans 404 (20 novembre), puis la purge (3.6) | 3 / 4 |
| **4** | Bascule de la base vers Neon | 🟡 préparation commencée le 18 novembre, à la demande de l'équipe : outils de transfert et de comparaison, image `ops-v1.3` en PostgreSQL 18 (version du projet Neon, E59), suite de tests sur 17 et sur 18, essais locaux du transfert, des rôles et du retour arrière (n° 5 en 17, n° 6 en 18 : 40 vérifications, 0 échec chacun), TLS vérifié par chaque image (C18) ; commité (`a9864c1`), **`ops-v1.3` publiée le 19 novembre** (essai n° 7 avec l'image publiée : 40 vérifications, 0 échec) | ⬜ projet Neon relevé le 18 novembre : PostgreSQL 18, plan Launch (E60). Mise en place **faite le 18 novembre** (action U) ; répétition le 19 novembre (action V, branche supprimée) ; **bascule faite le 19 novembre, site sur Neon depuis 13:08 UTC** (action W, E61) ; bascule (action W) **dès la répétition réussie** (E61 : l'équipe renonce au délai d'une semaine du DT2) | 4 / 6 |
| **5** | Diffusion des images par le CDN | ⬜ (conversion et `srcset` déjà livrés) | ⬜ | 0 / 6 |
| **6** | Exploitation et nettoyage | ⬜ | ⬜ | §9 |

### Étape 0 — détail

Code dans le commit `b14e7dd` de `main`. Rien n'est déployé : tout ce qui suit attend les actions manuelles A à F. La stack à coller dans Portainer est [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml), écrite le 9 novembre pour le serveur réel (écart E39) : le compose du commit `b14e7dd` ne s'y applique pas tel quel (E38).

| # | Action (§5, étape 0) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 0.1 | Portainer, stack `amame-ops`, scraper déplacé | 🟡 | stack [ops/docker-compose.yml](../ops/docker-compose.yml) et son mode d'emploi [ops/README.md](../ops/README.md) ; service `scraper` retiré de [docker-compose.yml](../docker-compose.yml) | sécuriser Portainer ; relever le chemin réel des uploads ; créer la stack |
| 0.2 | Secrets | 🟡 | `backend/.env`, `frontend/.env` et `backend/uploads/` retirés de l'index Git (39 fichiers) ; plus aucun mot de passe ni secret par défaut dans le compose, les `application-*.properties` et les 3 scrapers ; [.env.example](../.env.example) complet | changer le mot de passe d'application Gmail, `JWT_SECRET` et le mot de passe de la base ; saisir les variables de stack |
| 0.3 | Compte administrateur | 🟡 | [UserDataInitializer.java](../backend/src/main/java/com/example/siteamame/datainitializer/UserDataInitializer.java) : plus d'identifiants dans le code, création seulement si `BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD` sont fournis | vérifier que le mot de passe de l'administrateur par défaut a été changé |
| 0.4 | Fichiers privés | 🟡 | Nginx : 404 sur `/uploads/utilisateur/` **et** `/amame-uploads/utilisateur/` ; Spring Security : `denyAll` ; endpoint authentifié `/api/user/files/{id}` ; 6 écrans du frontend basculés sur `imageUrl` et `cvUrl`. **Deux failles d'accès corrigées au passage** (écarts E10 et E11) | déployer, constater les 404, **auditer les comptes à privilèges** |
| 0.5 | Sauvegarde couplée | 🟡 | image d'exploitation [ops/backup/](../ops/backup/) : `backup.sh`, `restore-test.sh`, `restore-db.sh`, `restore-files.sh`, planificateur | ~~créer la zone de sauvegarde~~ (fait le 13 novembre : `amamestoragezone`, E40) ; première sauvegarde ; test de restauration |
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

### Étape 3 — détail

Code écrit le 17 novembre 2026, à la demande de l'équipe, le jour même du déploiement de l'étape 2 : l'étape 3 ne se **déploie** qu'après une semaine de l'étape 2 en production (prérequis du §5), soit à partir du 24 novembre. Tags : `backend-v1.4`, `frontend-v1.3`, `ops-v1.2` (`scraper-v1.1` inchangé).

| # | Action (§5, étape 3) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 3.1 | Mise en place dans Bunny | — | rien à coder | zones `amame-public` et `amame-private`, Pull Zone sur `media.amame.ml`, tests de fumée (action Q) |
| 3.2 | Code | 🟡 | [BunnyStorageClient.java](../backend/src/main/java/com/example/siteamame/service/file/BunnyStorageClient.java) (client HTTP du JDK, budget de DT5), [BunnyFileStorageService.java](../backend/src/main/java/com/example/siteamame/service/file/BunnyFileStorageService.java) (zone déduite de la clé, compensation et purge inchangées), [BunnyStorageHealthIndicator.java](../backend/src/main/java/com/example/siteamame/service/file/BunnyStorageHealthIndicator.java) (E54) ; `StorageConfig` refuse une configuration incomplète ; migration V5 (E56) ; redirection de `/uploads/` dans `frontend-v1.3` (E55) | déployer avec `STORAGE_PROVIDER=local` : rien ne change (action P) |
| 3.3 | Copie pilotée par la base | 🟡 | [copy-to-bunny.sh](../ops/backup/copy-to-bunny.sh) : lignes `file_entity`, empreinte de la base contrôlée par Bunny, fichier divergent refusé, idempotent | copie (action R) |
| 3.4 | Vérification avant bascule | 🟡 | [reconcile-bunny.sh](../ops/backup/reconcile-bunny.sh), mode rapport (E52) | réconciliation à zéro anomalie bloquante (action R) |
| 3.5 | Bascule | 🟡 | variables `BUNNY_*` dans [amamestack.yml](../deploy/portainer/amamestack.yml) ; sauvegarde depuis Bunny (`BACKUP_FILES_SOURCE=bunny`, DT9) ; rapatriement pour le retour arrière (E53) | bascule (action S) |
| 3.6 | Purge et réconciliation régulière | ⬜ | purge déjà prête (étape 2) ; réconciliation planifiée et mode `enforce` à écrire (E52) | après 48 h sans anomalie |

### Étape 4 — détail

Préparation commencée le 18 novembre 2026, à la demande de l'équipe ; la **bascule (4.3) dès la répétition réussie** (E61, décision du 19 novembre ; le DT2 prévoyait le 25 novembre). Seule image nouvelle : `ops-v1.3`, sur PostgreSQL **18**, la version du projet Neon (E59). `backend-v1.4` et `frontend-v1.3` ne changent pas : la bascule ne change que des variables.

| # | Action (§5, étape 4) | Dépôt | Ce qui a été livré | Reste à faire en production |
| --- | --- | --- | --- | --- |
| 4.1 | Mise en place chez Neon | 🟡 | SQL des rôles et de la base dans [ops/README.md](../ops/README.md), essayé en local avec un propriétaire de console non superutilisateur (phase B des essais n° 5 et 6) | **faite le 18 novembre** (action U) : version 18.7, rôles et base constatés (sorties transmises) ; calcul 0,25 ↔ 1 CU constaté ; historique à 1 jour, voulu par l'équipe (E62) ; mot de passe réinitialisé et veille déclarés par l'équipe |
| 4.2 | Répétition sur une branche | 🟡 | [db-transfer.sh](../ops/backup/db-transfer.sh) (simulation par défaut, cible vide exigée, restauration en une transaction), [db-compare.sh](../ops/backup/db-compare.sh) (9 points, lecture seule), [db-grants.sql](../ops/backup/db-grants.sql) (droits des rôles et droits par défaut) ; essais locaux n° 5 (PostgreSQL 17) et n° 6 (18) | **faite le 19 novembre** : transfert identique, lecture par `amame_backup`, backend ponctuel, recette, mesures (V.7 : +27 ms à chaud, réveil 1,01 s) ; conteneurs et branche `repetition` supprimés |
| 4.3 | Bascule | 🟡 | `SPRING_DATASOURCE_PASSWORD` retirée de [amamestack.yml](../deploy/portainer/amamestack.yml) (C17) ; suffixes TLS vérifiés pour chaque image (C18) ; ancienne base en lecture seule après le transfert ; retour arrière essayé (phase G) | **faite le 19 novembre** : transfert à 12:29 UTC, backend sur Neon depuis 13:08 UTC (action W) ; article de test et `amame-ops` en `ops-v1.3` faits (W.7, W.8 : sauvegarde depuis Neon, restauration et réconciliation conformes) |
| 4.4 | Après la bascule | ⬜ | — | sauvegardes par `amame_backup`, relevés de consommation, suites dans le dépôt (action X) |

### Prochaine action

**État au 17 novembre 2026** : étapes 0, 1 et 2 en production (`backend-v1.3`, `frontend-v1.2`, `ops-v1.1`). Pour les étapes 1 et 2, l'équipe a choisi de s'appuyer sur les essais locaux pour les critères non constatés en production. Code déployé : branche locale `deploiement/v1.3`, non poussée ; `main` n'a pas bougé depuis `ba50a0a`. Ensuite :

1. **Mémoire d'`amame-backend`** (E48), 24 heures puis une semaine après le 17 novembre : `grep -E '^(anon|file) ' /sys/fs/cgroup/memory.stat` dans la console. Passage à 512M seulement si `anon` reste sous 420 Mio.
2. **Étape 3 (Bunny)** : code écrit, essayé en local, commité (`6552a6d`, branche locale `deploiement/v1.3`) ; images `backend-v1.4`, `frontend-v1.3` et `ops-v1.2` **publiées le 17 novembre**. **Déployée et basculée le 18 novembre** (E57, E58) : médias dans Bunny depuis 08:35 UTC. Recette passée le 18 novembre (incident des mots de passe en lecture seule, C15 ; sauvegardes réparées par `ops-v1.2.1`, C16). Reste : **le 20 novembre après 08:35 UTC**, `reconcile-bunny.sh` et statistiques de la Pull Zone `amamemedia` sans 404 (dernier critère) ; ensuite seulement `STORAGE_PURGE_ENABLED=true` (3.6). Proposé, sans urgence : `backend-v1.4.1` (C15). Plus tard : `media.amame.ml` (DNS chez Jokers Hosting). Le fichier orphelin `actualite/fd838654-….pdf` n'est pas copié (action O.6).
3. **Étape 4 (Neon)** : **bascule faite le 19 novembre, site sur Neon depuis 13:08 UTC** (actions U, V, W ; E61). Sauvegarde, test de restauration et réconciliation conformes sur Neon (W.8). Critères : 4 / 6 cochés ; temps de réponse non atteint (+31 ms), écart accepté et compensé par le cache des listes publiques (E62) ; reste la projection de consommation. Répétition nettoyée (V.9). Cache des listes publiques actif à 10 minutes, constaté. Reste : **relevé quotidien des CU-h pendant deux semaines** (page du projet, bloc *Usage*), puis projection mensuelle (action X) ; mémoire du backend avec le cache actif (E48) ; ancienne base gardée en lecture seule au moins 14 jours, jusqu'au 3 décembre.
4. En attente, sans lien avec l'ordre des étapes : sécurisation de Portainer (E43), constats C11 et C12. (`main` réconcilié avec `deploiement/v1.3` le 19 novembre : avance rapide, poussée sur GitHub.)

La liste ci-dessous date d'avant les déploiements ; elle reste comme historique.

**Côté équipe**, dans cet ordre :

1. Action A.1 : la production ne se déploie pas par `git pull` (fait relevé le 8 novembre). La précaution ne vaut donc que pour un éventuel clone du dépôt sur le serveur et pour le poste de chaque développeur : le commit qui retire `backend/uploads/` du suivi est sur GitHub.
2. ~~Régulariser Git (action A.2)~~ : **fait le 8 novembre**, `main` porte les étapes 0, 1 et 2, poussé sur GitHub.
3. ~~Lancer la suite de tests complète avant de déployer `backend-v1.3`~~ : **fait le 8 novembre 2026** en local, 70 tests, aucun échec. À relancer seulement si le code change d'ici le déploiement.
4. **Avant toute mise à jour de la stack** (écarts E38 et E39). Fait le 9 novembre : sauvegarde manuelle de la base ; relevé du nom de la stack, du réseau, du chemin des uploads et du volume de la base ; fichiers de stack de production écrits. **Reste à faire** :
   - conserver hors du dépôt une copie **complète** du contenu actuel de la stack `amamestack` : c'est le retour arrière. Contenu transmis le 14 novembre, sans ses secrets ; l'équipe garde la version complète ;
   - ~~relever la cible de Nginx Proxy Manager~~ : **fait le 14 novembre**, `amame-frontend:80`, *Custom locations* vide ;
   - ~~relever les autres conteneurs de `common_net`~~ : **fait le 14 novembre**, dont `sahel_academy_backend` et `sahel_academy_web`, d'un autre projet. `backend` désigne deux conteneurs : corrigé par des liens Docker (E42) ;
   - ~~`common_net` interne ? le backend résout-il `smtp.gmail.com` ?~~ : **fait le 14 novembre**, interne, et le backend ne sort pas. `amamestack.yml` a reçu un réseau `sortie` (E41). Le port 587 sort bien vers Gmail (essai depuis `amame-ops-backup`).
5. Dérouler les actions manuelles de l'étape 0 (B à F, dans l'ordre de E), puis celles de l'étape 1 (G à J), puis celles de l'étape 2 (K à N).
6. Noter ce qui a été constaté en production : faits relevés, critères remplis avec leur date.

**Côté implémentation, à la prochaine session** :

1. Reporter dans ce suivi les faits relevés et cocher les critères constatés, pour les étapes 0, 1 et 2.
2. Si la comparaison de l'action G.1 montre un écart entre la production et `V1__baseline.sql` : corriger V1 avant tout déploiement de l'étape 1.
3. Si l'inventaire croisé (action K.2) signale une anomalie bloquante : la traiter avant tout déploiement de l'étape 2.
4. Étape 3, sur demande de l'équipe : le code (3.2 : client et implémentation Bunny ; 3.3 : copie pilotée par les métadonnées ; 3.4 : réconciliation en mode rapport) peut s'écrire avant le déploiement des étapes précédentes, comme pour l'étape 2. Il ne s'éprouve vraiment qu'avec les zones Bunny `amame-public` et `amame-private` (action 3.1). Prérequis à intégrer : une migration V5 qui valide les contraintes `NOT VALID` et rend l'empreinte obligatoire, une fois les empreintes remplies à 100 % en production (écart E30).

### Actions manuelles en attente

À faire par l'équipe, **dans cet ordre**. Rien de ce qui suit n'a été fait : l'implémentation s'est arrêtée au dépôt local. Les actions A à F concernent l'étape 0, les actions G à J l'étape 1, les actions K à N l'étape 2, les actions O à T l'étape 3.

**Deux façons de déployer.** Le plan demande de déployer l'étape 0, de constater ses 8 critères, puis de déployer l'étape 1 : un incident n'a alors qu'une cause possible. Déployer les deux ensemble reste possible (actions A à C et E.1, puis directement G à J avec les images `v1.2`), mais les critères des deux étapes se vérifient alors en même temps. **Choix du 9 novembre : l'étape 0 seule d'abord**, obligatoire depuis que la production réelle est connue (E38, point 4).

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

   **Fait le 8 novembre 2026, push compris.** `main` pointe sur `7466a23` (étape 2), dont les parents sont `5c62c07` (étape 1), `b14e7dd` (étape 0) et `f5252df` ; le tout est poussé sur GitHub (`origin/main` = `ba50a0a`, commit de suivi) et les deux branches de sauvegarde sont supprimées. Le commit de l'étape 2 contient 56 fichiers (les 54 de l'étape 2 et les 2 de C8) ; aucun `.env` ni fichier de `backend/uploads/`. Le suivi a été mis à jour dans un second commit. Le push n'a été fait qu'après confirmation par l'équipe que la production se met à jour par les images Docker Hub, et non depuis Git : il ne pouvait pas déclencher de mise à jour de la stack.
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
   - Grafana : sans objet, la supervision n'a jamais été déployée en production (E38).
   - Ces changements se font au moment de la mise à jour de la stack, dans l'ordre de l'action E (points 6 à 10).

#### C. Bunny

1. Créer la zone de stockage `amame-backups` : Standard, Francfort, sans réplication, sans Pull Zone. Détail dans [ops/README.md](../ops/README.md). **Fait le 13 novembre** : zone **`amamestoragezone`**, Francfort (déclaré par l'équipe ; écart E40). Elle sert aux sauvegardes et à rien d'autre : `BUNNY_BACKUP_ZONE=amamestoragezone`. Son mot de passe (*Access Key*) va dans `BUNNY_BACKUP_ZONE_KEY` de `amame-ops`, et nulle part ailleurs. Si son point d'accès (*Storage Zone Region Endpoint*) n'est pas `storage.bunnycdn.com` (Francfort), saisir aussi `BUNNY_STORAGE_ENDPOINT=https://<point d'accès>`.

#### D. Images Docker

**Fait le 13 novembre 2026** (journal du jour) : les quatre images sont construites, contrôlées et publiées ; chacune porte son commit dans l'étiquette `org.opencontainers.image.revision`.

| Image | Commit | Empreinte publiée |
| --- | --- | --- |
| `backend-v1.1` | `b14e7dd` | `sha256:dcf48c471be9765391b278d573cacee2ddabc18bc2943a78625b81f3d9fe2a2c` |
| `frontend-v1.1` | `b14e7dd` | `sha256:751da1afdf53f2930e5c5431f2e37eb547195cb83ea906dac52e0ae8fdd26f86` |
| `ops-v1.1` | `ba50a0a` | `sha256:c58ce8866553fd445181a6235a2d2f3240f7e999a874b8b7b826f8dcc9f84a2a` |
| `scraper-v1.1` | `ba50a0a` | `sha256:a909c6944a4f690add6682f07dff7361ad5186c8c2a59b048e1467d3e0a71349` |
| `backend-v1.1.1` | `b548a4a` (correctif E44, branche `correctif/v1.1.1`) | `sha256:6ac5dd132c7c681326008c878b4d81bf35d152965dde3298298eba58cf47c38a` |
| `frontend-v1.1.1` | `b548a4a` (correctif E44, branche `correctif/v1.1.1`) | `sha256:995c61c2391e438a3527459270041becca199a7c906f09ce8b6568d384605fa5` |
| `backend-v1.2` | `3baba45` (étape 1 + E44 + E47, branche locale `deploiement/v1.2`) | `sha256:9addf348903e848d204bd29bfdf963bcfe6f78e3e4dd73320bc80cad0cf30dd1` |
| `frontend-v1.2` | `3baba45` (étape 1 + E44, branche locale `deploiement/v1.2`) | `sha256:de99015c5ae88ee35bc6f9cc0de3b7ed5e0a57112f99486648537167ef7dd7da` |
| `backend-v1.3` | `e9e5437` (étape 2 + E44 + E47 + E50 + E51 + C13, branche locale `deploiement/v1.3`), publiée le 17 novembre 2026. Couches identiques à l'image essayée | `sha256:95a1e65adb3f4652bb8d80ea6e6919bc6ad6e47ed69d9495b9292ade5098829a` |
| `backend-v1.4` | `6552a6d` (étape 3, branche locale `deploiement/v1.3`), publiée le 17 novembre 2026. Code identique à l'image essayée | `sha256:c4e0602e6401885cbeb9ead808f9eaf63ff13930bd53cf0ceac9871823bdf7fd` |
| `frontend-v1.3` | `6552a6d` (étape 3 + C14), publiée le 17 novembre 2026. C14 ajouté après l'essai : image revérifiée seule (disque, redirection, 404 du privé, service worker) | `sha256:3a08db5e23d9fd8cc8144d1a6f009257210fce8d0a715f99887d0d1ad3d60a5a` |
| `ops-v1.2` | `6552a6d` (étape 3), publiée le 17 novembre 2026. Scripts identiques à l'image essayée | `sha256:106cd93b44363ac6156352150d725126c37841163f6d4fa57d3d7a1e59534a49` |
| `ops-v1.2.1` | `a590e48` (même code que `ops-v1.2`, PostgreSQL 15.20, constat C16), publiée le 18 novembre 2026. Couches identiques à l'image essayée | `sha256:754dfdb117b5bbbbe129af267d46e1480f427d3d187db14bd8a4039ac6de2568` |
| `ops-v1.3` | `a9864c1` (étape 4, PostgreSQL 18.7, la version de Neon), publiée le 19 novembre 2026. Scripts et PostgreSQL identiques à l'image essayée ; base `postgres:18-alpine` reconstruite en amont le 18 novembre (seul `gnutls` change, 3.8.13 → 3.8.14) : essai n° 7 refait avec l'image publiée, 40 vérifications, 0 échec | `sha256:41300a07f280d49f89f302ba1f5fc0c6dfc5a2e67ec58917a3df2a3ab438ca0b` |

Les deux images `v1.1.1` ont été publiées le 16 novembre 2026 (journal du jour). Elles remplacent `backend-v1.1` et `frontend-v1.1` dans la stack `amamestack`. Les images `ops-v1.1` et `scraper-v1.1` ne changent pas.

Les deux images `v1.2` ont été publiées le même jour, après l'essai n° 2 et avec l'autorisation de l'équipe. Elles sont construites depuis la branche locale `deploiement/v1.2` : `5c62c07`, puis `0d39229` (correctif E44 repris de `b548a4a`), puis `3baba45` (V1 corrigée, `V1_1`, écart E47). Leurs couches sont identiques, une à une, à celles des images essayées : seule l'étiquette de révision change. La branche n'est pas poussée sur GitHub.

Pour reconstruire un jour ces images, la marche à suivre reste celle-ci.

1. Sur le poste de développement : Docker Desktop démarré, `docker login` avec le compte `yayacode224`. Les commandes `docker build` ci-dessous n'ont besoin d'aucun `.env` (les commandes `docker compose build` exigeraient une valeur pour chaque variable obligatoire). Le serveur est en `linux/amd64`, comme le poste.

   Les images `backend-v1.1` et `frontend-v1.1` se construisent **depuis le commit de l'étape 0**, et non depuis `main`, par un second dossier de travail. Il ne contient que les fichiers suivis par Git : aucun `.env` local ne peut entrer dans l'image. Depuis la racine du dépôt :

   ```bash
   git worktree add ../amame-etape-0 b14e7dd
   docker build -t yayacode224/amame:backend-v1.1  ../amame-etape-0/backend
   docker build -t yayacode224/amame:frontend-v1.1 ../amame-etape-0/frontend
   docker build -t yayacode224/amame:ops-v1.1 --build-arg PG_MAJOR=15 ops/backup
   docker build -t yayacode224/amame:scraper-v1.1 scraper
   ```

   `ops-v1.1` (depuis `main`) remplace `ops-v1.0` dès l'étape 0 : mêmes scripts de sauvegarde, plus les outils de l'étape 2, qui vérifient la présence des migrations avant d'agir (action L).
2. Publier les quatre images, une fois toutes construites :

   ```bash
   docker push yayacode224/amame:backend-v1.1
   docker push yayacode224/amame:frontend-v1.1
   docker push yayacode224/amame:ops-v1.1
   docker push yayacode224/amame:scraper-v1.1
   ```

   Le dépôt Docker Hub est public : les images ne contiennent aucun secret (le backend ne copie que `pom.xml` et `src`, le frontend vient du dossier de travail propre, les deux `.dockerignore` excluent `.env` depuis le 9 novembre).
3. Supprimer le second dossier de travail : `git worktree remove ../amame-etape-0`.

#### E. Portainer

Ordre revu le 9 novembre pour le serveur réel (E39) : les uploads n'ont pas pu être copiés à la main faute d'accès SSH, la première sauvegarde de `amame-ops` doit donc réussir **avant** toute mise à jour de l'application.

1. **Sécuriser Portainer** : interface non exposée publiquement (tunnel SSH ou VPN), mot de passe fort, version à jour (§3.1). Même chose pour l'administration de Nginx Proxy Manager (port `81`, publique en HTTP le 9 novembre).
2. **Supprimer l'ancien conteneur `amame-scraper`** (Containers → `amame-scraper` → Remove). Il est arrêté et ne sert pas au site ; la stack `amame-ops` crée un conteneur du même nom et échouerait sinon. **Fait le 13 novembre.**
3. **Créer la stack `amame-ops`** en collant [deploy/portainer/amame-ops.yml](../deploy/portainer/amame-ops.yml), avec les variables de [ops/README.md](../ops/README.md). Valeurs propres au serveur : `UPLOADS_HOST_PATH=/data/compose/64/backend/uploads` ; `BUNNY_BACKUP_ZONE=amamestoragezone` (E40) ; `AMAME_NETWORK` inutile (`common_net` par défaut) ; base désignée par `amame-database`, avec le mot de passe **actuel** de la base. Puis, dans la console du conteneur `amame-ops-backup` : `backup.sh`, puis `restore-test.sh`, qui doit se terminer par `test de restauration RÉUSSI`. **Ne pas continuer sans ce résultat.** Stack créée le 13 novembre : le planificateur a démarré à 14:52 UTC (sauvegardes à 02:30 et 14:30 UTC). Le premier `backup.sh` a échoué : `Could not resolve host: storage.bunnycdn.com`, car le DNS par défaut des conteneurs ne fonctionne pas sur ce serveur (faits relevés, ligne « DNS des conteneurs »). Le fichier de stack a été corrigé le jour même : serveurs DNS explicites, comme le backend. Le 14 novembre, après la mise à jour de la stack (conteneur recréé), même échec. Le diagnostic a montré que la cause n'est pas le DNS : `common_net` ne sort pas vers Internet (faits relevés, ligne « Sortie vers Internet depuis `common_net` »). Le fichier de stack ajoute donc un second réseau, propre à `amame-ops`. Stack mise à jour le 14 novembre : `curl https://storage.bunnycdn.com/` répond `200` depuis `amame-ops-backup`, la sortie vers Internet fonctionne. **Première sauvegarde réussie le 14 novembre à 11:42 UTC** : 29 fichiers copiés, dump `db/amame-20261114T114150Z.dump.gpg` (224 427 octets avant chiffrement). **Test de restauration réussi le 14 novembre à 11:47 UTC** : 25 tables ; 31 lignes `file_entity`, dont 26 référencées, toutes retrouvées, sans écart de taille ; 3 fichiers de la sauvegarde sans ligne référencée (information, à revoir avec l'inventaire de l'étape 2). Action E.3 faite.
4. **Conserver `BACKUP_PASSPHRASE` hors du serveur.** Sans elle, aucune sauvegarde n'est lisible. **Fait** (déclaré par l'équipe le 14 novembre).
5. **Vérifier la cible de Nginx Proxy Manager** (Prochaine action, point 4) : aucune cible sur le port `8080`. **Fait le 14 novembre** : `amame-frontend:80` (faits relevés, « Proxy frontal ») ; *Custom locations* à confirmer vide.
6. **Préparer les nouveaux secrets**, sans rien changer encore : un mot de passe d'application Gmail neuf (l'ancien reste valide jusqu'au point 10), un `JWT_SECRET` neuf, un mot de passe de base neuf.
7. **Changer le mot de passe de la base**, juste avant le point 8 :
   - générer le nouveau mot de passe en lettres et chiffres seulement, par exemple `openssl rand -hex 24`. Il entre tel quel dans les URL de `amame-ops` (point 9), où `/`, `@`, `:`, `?`, `#` et `%` casseraient l'adresse ;
   - recharger la page de Portainer avant de commencer : le 15 novembre, une page restée ouverte longtemps a fait échouer la mise à jour (`Network Error`) ;
   - dans la console du conteneur `amame-database` : `psql -U postgres -d amame_db`, puis `\password postgres` (saisie masquée, absente de l'historique), puis `\q`.

   À partir de là, le backend en place ne peut plus ouvrir de nouvelle connexion : enchaîner sans attendre. En cas d'échec de la suite, remettre l'ancien mot de passe de la même façon.

   **Fait le 15 novembre, après le point 8** : la stack avait d'abord été mise à jour avec l'ancien mot de passe de la base, qui avait circulé en clair dans l'ancienne stack. Ensuite, à la suite : ce point 7 ; `POSTGRES_PASSWORD` dans la stack `amamestack`, puis *Update the stack* sans *Re-pull image* ; le point 9. Pour un prochain changement, même ordre.
8. **Mettre à jour la stack `amamestack`** (Stacks → `amamestack` → Editor) :
   - remplacer tout le contenu par [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) ;
   - supprimer les anciennes variables éventuelles, puis saisir : `BACKEND_IMAGE_TAG=backend-v1.1`, `FRONTEND_IMAGE_TAG=frontend-v1.1`, `POSTGRES_PASSWORD` (le nouveau), `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD` (le nouveau), `MAIL_FROM`, `UPLOADS_HOST_PATH=/data/compose/64/backend/uploads`, `BACKEND_MEMORY_LIMIT=768M`. `FRONTEND`, `COOKIE_DOMAIN` et `COOKIE_SECURE` ont leur valeur de production par défaut dans ce fichier. Liste prête à remplir : [deploy/portainer/amamestack.env.example](../deploy/portainer/amamestack.env.example), à recopier **hors du dossier du projet** (ou dans le gestionnaire de mots de passe), compléter, puis coller dans la section *Environment variables*, **sous** l'éditeur, en *Advanced mode*. Jamais dans l'éditeur du fichier lui-même. **Jamais le `.env.example` de la racine** : il porte les tags de l'étape 2, les valeurs de développement des cookies et les clés de sauvegarde ;
   - **Update the stack**, option *Re-pull image* activée.

   **Fait le 15 novembre**, après deux refus de Portainer (journal du 15 novembre) : conteneurs recréés, site accessible, données présentes (constaté par l'équipe). Vérifications de l'action F en cours.

   Si Portainer répond `YAMLSyntaxError: Document contains trailing content not separated by a ... or --- line` : le 15 novembre, la cause était, selon l'équipe, un doublon dans le fichier `.env` préparé pour les variables ; une fois le doublon retiré, Portainer a accepté le fichier. En local, le même message vient d'une ligne qui n'est pas du YAML **au-dessus** de `services:` : des lignes `NOM=valeur` collées dans l'éditeur du fichier au lieu de la section *Environment variables*, un reste de l'ancien contenu, ou un commentaire qui a perdu son `#`. L'ancienne stack n'avait aucune variable : ses secrets étaient écrits en clair dans le fichier. Remède : vider entièrement l'éditeur (Ctrl+A, Suppr), coller le fichier du dépôt **sans le modifier**, puis vérifier la première et la dernière ligne. **Ne pas retirer les valeurs par défaut `${VAR:-…}`** : une variable absente de Portainer arriverait vide au backend, au lieu de prendre sa valeur de production.

   Si Portainer répond `Failure` — `Network Error` : le navigateur n'a pas reçu la réponse de Portainer. Ce message ne dit pas ce que le serveur a fait : rien, une partie, ou tout. Le 15 novembre, le message apparaissait aussitôt après le clic, sans rien changer sur le serveur : il a suffi de recharger la page de Portainer dans le navigateur. Si le message arrive après une longue attente, en revanche, **ne pas recliquer** sur *Update the stack* avant d'avoir relevé l'état : date de création et image des trois conteneurs, images `v1.1` présentes ou non, réseau `amamestack_sortie` présent ou non, fin du journal de `amame-backend`. Si rien n'a été appliqué, recommencer en deux temps pour raccourcir l'attente : télécharger d'abord les deux images (Images → *Pull image*), puis mettre à jour la stack **sans** *Re-pull image*. Les tags versionnés ne changent jamais, et Compose télécharge de lui-même une image absente.

   Si Portainer refuse le fichier sur une erreur d'interpolation à propos de `${DATABASE_PASSWORD:-${POSTGRES_PASSWORD}}`, sa version de Compose est trop ancienne pour les valeurs par défaut imbriquées : ajouter les variables `DATABASE_PASSWORD` et `DATABASE_MIGRATION_PASSWORD` avec la valeur de `POSTGRES_PASSWORD`, puis recommencer. Un refus de Portainer ne change aucun conteneur.
9. **Mettre la stack `amame-ops` à jour** avec le nouveau mot de passe dans `BACKUP_DATABASE_URL` et `SCRAPER_DATABASE_URL`, puis relancer `backup.sh` : c'est le premier point de restauration de l'étape 0. **Fait le 15 novembre** : `backup.sh` réussi avec le nouveau mot de passe (déclaré par l'équipe).
10. **Révoquer l'ancien mot de passe d'application Gmail**, une fois l'envoi d'un e-mail constaté (inscription de test, ou mot de passe oublié). **Fait le 15 novembre** : e-mail « mot de passe oublié » reçu, réinitialisation réussie, ancien mot de passe d'application révoqué.

Les utilisateurs connectés sont déconnectés une fois : le `JWT_SECRET` change, et la session passe de 30 jours d'un seul jeton à 15 minutes renouvelées pendant 7 jours.

#### F. Critères de sortie

Juste après la mise à jour, avant les critères :

- les trois conteneurs `amame-database`, `amame-backend` et `amame-frontend` sont *running* ; le journal du backend se termine par `Started SiteAmameApplication` ;
- console de `amame-frontend` : `nslookup backend` renvoie **une seule** adresse, celle d'`amame-backend` (onglet *Networks* du conteneur dans Portainer) (E42) ;
- console de `amame-backend` : `getent hosts smtp.gmail.com` renvoie une adresse (E41) ;
- conteneur `amame-backend` → *Volumes* : `/data/compose/64/backend/uploads` → `/app/uploads`. Une image d'article **déjà existante** s'affiche sur le site : un chemin faux donnerait un dossier vide, sans erreur ;
- connexion, puis déconnexion, avec un compte existant (cookies `.amame.ml`, `Secure`).

**Constaté le 15 novembre par l'équipe** : les cinq vérifications ci-dessus. `nslookup backend` depuis `amame-frontend` renvoie une seule adresse (`172.20.0.5`, celle du backend recréé ; `sahel_academy_backend` est en `172.20.0.4`). `getent hosts smtp.gmail.com` depuis `amame-backend` renvoie une adresse, `rc=0` (le 14 novembre : `rc=2`). L'envoi réel d'un e-mail reste à constater (action E.10).

**Fichiers privés : tester avec un fichier qui existe.** Une URL inventée, comme `/uploads/utilisateur/test`, renvoie 404 même avec l'ancienne configuration : elle ne prouve rien. Dans la console d'`amame-frontend`, `find /app/uploads/utilisateur -type f | head -n 1` donne un fichier réel. Ce nom peut porter des données personnelles : ne pas le transmettre. Ouvrir ce chemin dans une fenêtre privée du navigateur, derrière `https://amame.ml/uploads/` puis derrière `https://amame.ml/amame-uploads/` : 404 attendu dans les deux cas. Si le fichier s'affiche, refaire l'essai 30 minutes plus tard : le cache de Nginx Proxy Manager (*Cache Assets*) a pu le garder.

Constater les critères de sortie de l'étape 0 (§5), puis les cocher avec leur date. Deux vérifications demandent une manipulation :

- **limitation de débit par visiteur** : envoyer une dizaine d'inscriptions rapprochées. Les 6 premières passent, les suivantes reçoivent 429. Vérifier ensuite dans le journal du conteneur `amame-frontend` que l'adresse enregistrée est celle du visiteur et non celle du proxy frontal. Si c'est celle du proxy, ajouter son adresse aux lignes `set_real_ip_from` de [frontend/nginx.conf](../frontend/nginx.conf) : sinon tous les visiteurs partagent le même quota ;
- **poids de l'accueil** : outils de développement du navigateur, onglet réseau, cache désactivé.

#### Retour arrière de l'étape 0

Recoller dans Portainer le contenu de la stack d'avant la mise à jour (images `yaya236/amame-web-site:*-v7`), conservé hors du dépôt, et mettre la stack à jour. Les images `yayacode224/amame:*-v1.0` n'ont jamais tourné en production (écart E38) : ne pas s'en servir. L'ancienne stack rouvre l'accès public aux fichiers privés et la faille des rôles : à n'utiliser que le temps de corriger. Avant de la recoller :

- si le mot de passe de la base a été changé, reporter le nouveau dans l'ancienne stack, aux trois endroits où l'ancien figure (base, backend, scraper) ;
- retirer son service `scraper` : le nom `amame-scraper` appartient désormais à la stack `amame-ops`.

Côté schéma, `ddl-auto=update` de l'étape 0 n'ajoute que des tables et des colonnes, que l'ancien backend ignore. Ce n'est pas vérifié pour une colonne obligatoire que l'ancien code ne remplirait pas : le code de `v7` n'est pas dans le dépôt. Après un retour arrière, essayer une écriture (créer puis supprimer un article de test) ; en cas d'échec, restaurer le dump `amame-avant-etape0.dump` (faits relevés).

#### G. Avant de déployer l'étape 1

**Points 1 et 2 adaptés le 16 novembre 2026 (écart E46).** Sans SSH, le `pg_dump` et le `diff` décrits au point 1 ne peuvent pas se faire sur le serveur.

- **Le schéma** : à la place, une requête collée dans la console d'`amame-database` donne une empreinte par table (colonnes, contraintes, index, noms). Elle est comparée à l'empreinte de V1 calculée en local. Les contraintes `CHECK` sont normalisées avant le calcul : PostgreSQL écrit différemment la même contrainte selon qu'elle a été créée par Hibernate ou par V1.
- **La mémoire** (point 2) : elle se lit dans la console d'`amame-backend`, avec `cat /sys/fs/cgroup/memory.current`, sans `docker stats`.

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

**Changé le 16 novembre 2026 (écart E45)** : les images `v1.2` se construisent depuis `5c62c07` **plus le correctif E44** (`b548a4a`, appliqué sans conflit sauf `vite.config.ts`, résolu à l'identique de `main`). Sinon, elles réintroduiraient en production le problème du cache du navigateur, corrigé par `v1.1.1`. Les commandes ci-dessous restent valables, à partir de la branche qui porte ces deux commits.

Les images `backend-v1.2` et `frontend-v1.2` se construisent **depuis le commit de l'étape 1** (`5c62c07`), et non depuis `main`. Comme pour l'étape 0 (action D), par un second dossier de travail :

```bash
git worktree add ../amame-etape-1 5c62c07
docker build -t yayacode224/amame:backend-v1.2  ../amame-etape-1/backend
docker build -t yayacode224/amame:frontend-v1.2 ../amame-etape-1/frontend
docker push yayacode224/amame:backend-v1.2
docker push yayacode224/amame:frontend-v1.2
git worktree remove ../amame-etape-1
```

Les images `ops-v1.1` et `scraper-v1.1` de l'étape 0 ne changent pas.

#### I. Stack `amame` dans Portainer

1. **Compose.** Rien à coller : [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) sert aussi aux étapes 1 et 2 (E39). **En production, c'est une version de l'équipe sans valeurs par défaut qui est en place (E49)** : toute variable lue par la nouvelle version doit y être définie et non vide. Il ne contient ni `SPRING_DATASOURCE_URL`, ni `SPRING_DATASOURCE_USERNAME`, ni `SPRING_JPA_HIBERNATE_DDL_AUTO` : `SPRING_JPA_HIBERNATE_DDL_AUTO=update` rendrait à Hibernate le droit de modifier le schéma. Seul `SPRING_DATASOURCE_PASSWORD` y reste, pour le retour arrière (E24).
2. **Variables.** Passer `BACKEND_IMAGE_TAG=backend-v1.2` et `FRONTEND_IMAGE_TAG=frontend-v1.2`. **Garder `BACKEND_MEMORY_LIMIT=768M`** (écart E48, 16 novembre). Le passage à 512M est une mise à jour séparée, après la mesure du point J.4. Aucune variable nouvelle n'est obligatoire : tant que la base est sur le VPS, le backend se connecte avec `POSTGRES_PASSWORD`. Laisser `MEDIA_BASE_URL` vide et `STORAGE_PROVIDER` à `local`.
3. **Mettre la stack à jour**, option *Re-pull image* activée.
4. **Supervision.** Sans objet en production : elle n'y a jamais été déployée (E38).

#### J. Vérifications après le déploiement de l'étape 1

1. **Journal du backend**, au premier démarrage : `Successfully baselined schema with version: 1`, puis `Migrating schema "public" to version "1.1 - enum check constraints"` et `Successfully applied 1 migration to schema "public", now at version v1.1` (écart E47), puis `Started SiteAmameApplication`. Une erreur `Schema-validation` signale un écart entre la production et les entités : revenir en arrière (ci-dessous) et transmettre le message. Une erreur sur la migration 1.1 est annulée par PostgreSQL (transaction) : même conduite.
   Ensuite, dans la console d'`amame-database` : `SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank;` donne `1 | BASELINE | t`, puis `1.1 | SQL | t`. L'empreinte du schéma (E46), relancée, doit donner pour `users` et `user_permission` les valeurs de V1 corrigée + V1_1 (essai du 16 novembre), et rien d'autre ne doit changer.
   **Défaut corrigé par V1_1** : connecté en SUPERADMIN, accorder `ADHESION_MANAGE` à un compte de test depuis l'administration, puis la retirer. Avant `v1.2`, la base refusait (erreur 500).
2. **Journal du frontend** : `40-runtime-config.sh : mediaBaseUrl="", mediaOptimizerEnabled=false`.
3. **Critères de sortie de l'étape 1** (§5), à cocher avec leur date :

   | Critère | Comment le constater |
   | --- | --- |
   | ✅ Baseline Flyway, `validate` sans erreur — 16 novembre 2026 : baseline en 1, migration 1.1 appliquée, `EntityManagerFactory` initialisé sans erreur `Schema-validation` | journal du backend, point 1 |
   | Recette identique à avant | pages publiques, connexion et déconnexion, création puis suppression d'un article de test avec image, inscription d'un compte de test avec CV et photo |
   | 2 à 3 requêtes SQL par liste publique | mesuré en local : 1 à 3 (journal du 5 octobre). En production, la recette suffit |
   | Concours sans fichier visibles | créer un concours sans fichier depuis l'administration : il apparaît dans la liste publique et sa page s'ouvre |
   | Avatar de la Navbar | compte avec photo, fenêtre de largeur tablette |
   | Développement local sous Windows | constaté le 5 octobre sur un poste Windows : ce critère ne se vérifie pas en production |
   | URL des médias changée sans nouvelle image | ~~mettre `MEDIA_BASE_URL=https://amame.ml`~~ **À ne plus faire à partir de `frontend-v1.3`** (17 novembre) : le frontend redirige alors `/uploads/` vers `MEDIA_BASE_URL`, et cette valeur, le site lui-même, ferait tourner la redirection en boucle. Le changement d'URL sans nouvelle image est constaté à la bascule de l'étape 3.5, avec `https://media.amame.ml` |

4. **Mémoire** : `docker stats --no-stream amame-backend` après 24 heures, puis après une semaine. Valeur attendue : environ 400 Mio sur 512. Au-delà de 460 Mio, le signaler avant d'aller plus loin.
   Sans accès à `docker stats` (E46) : dans la console d'`amame-backend`, `grep -E '^(anon|file) ' /sys/fs/cgroup/memory.stat`. `anon` est le chiffre à suivre. Avec la limite gardée à 768M (E48), le tas peut grandir jusqu'à 30 % de 768 Mio : si `anon` reste sous **420 Mio** après une semaine, `backend-v1.2` tiendra sous 512M, où son tas est plus petit. On supprime alors `BACKEND_MEMORY_LIMIT` (mise à jour séparée), puis on refait le relevé 24 heures plus tard.

#### Retour arrière de l'étape 1

Remettre `BACKEND_IMAGE_TAG=backend-v1.1.1` et `FRONTEND_IMAGE_TAG=frontend-v1.1.1` dans la stack, les deux ensemble (pas `v1.1`, qui a le défaut E44), avec `BACKEND_MEMORY_LIMIT=768M`, sans changer le compose : [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) transmet encore le nom de variable que lit `backend-v1.1` (`SPRING_DATASOURCE_PASSWORD`). La table `flyway_schema_history` reste en base, sans effet sur l'ancienne version. Rejoué en local le 5 octobre : l'ancien backend, lancé avec les variables du compose de l'étape 1 sur une base déjà passée par l'étape 1, démarre, répond, et ne touche pas au schéma. Le compose de développement de l'étape 2 ne transmet plus `SPRING_DATASOURCE_PASSWORD` (E24) ; le fichier de production le garde tant que ce retour arrière doit rester possible.

#### K. Avant de déployer l'étape 2

1. **L'étape 1 est en production et ses critères sont constatés** (§5.0). La suite de tests complète a été lancée une fois avec succès (`./mvnw test`) : fait le 8 novembre 2026, à refaire si le code a changé depuis.
2. **Inventaire croisé.** La stack `amame-ops` tourne en `ops-v1.1` depuis l'étape 0 (action D). Dans la console du conteneur `amame-ops-backup` :

   ```bash
   inventory.sh
   ```

   Il doit se terminer par `inventaire conforme`. Sinon, **ne pas déployer** : une clé en double ferait échouer la migration V2 ; une référence cassée ou une ligne partagée est à traiter d'abord (tableau dans [ops/README.md](../ops/README.md)). Consigner les compteurs dans les faits relevés.
3. **Point de restauration** : lancer `backup.sh` juste avant la mise à jour de la stack.
4. ~~**Stack de production = fichier du dépôt** (écart E49)~~. **Abandonné le 17 novembre** : l'équipe garde sa version, sans valeurs par défaut. `backend-v1.3` traite une variable vide comme absente (E51), essayé avec cette version (journal du 17 novembre). Pour un retour arrière en `v1.2`, les variables que lit `v1.2` doivent rester définies dans Portainer : c'est le cas depuis le 16 novembre.
5. ✅ **Tests qui demandent Docker**, avec le code du renouvellement de session : `AuthRefreshIntegrationTest`, `SiteAmameApplicationTests` et `FileLifecycleIntegrationTest`. Refait le 17 novembre après E51 et C13 : `./mvnw test`, 90 tests, 0 échec. `backend-v1.3` part de `main`, qui porte aussi les correctifs E44, E47, E50, E51 et C13. Si le backend change encore avant la construction, relancer `./mvnw test`.
6. ✅ **Essai local du passage `v1.2` → `v1.3`, et du retour arrière**, avec la stack de production du 17 novembre : 74 vérifications, 0 échec (journal du 17 novembre).
7. **Secrets dans un fichier `.env` chargé dans Portainer** (choix de l'équipe, 17 novembre) : un fichier par stack. `BACKUP_PASSPHRASE` et `BUNNY_BACKUP_ZONE_KEY` ne vont jamais dans celui d'`amamestack`. Le fichier reste hors du dépôt Git, et une copie est gardée hors du serveur.

#### L. Images de l'étape 2

✅ **Fait le 17 novembre 2026**, avec l'autorisation de l'équipe : `backend-v1.3` construite depuis `e9e5437`, pointe de la branche locale `deploiement/v1.3` (partie de `main`, `ba50a0a`, plus E44, E47, E50, E51, C13 et le suivi), puis publiée. Empreinte à l'action D. La branche n'est pas poussée sur GitHub ; `main` n'a pas bougé.

```bash
docker build --label org.opencontainers.image.revision=e9e5437 -t yayacode224/amame:backend-v1.3 backend
docker push yayacode224/amame:backend-v1.3
```

Le frontend ne change pas (`frontend-v1.2`). `ops-v1.1`, publiée dès l'étape 0 (action D), contient déjà les trois outils de l'étape 2.

#### M. Stack `amame` dans Portainer

1. Passer `BACKEND_IMAGE_TAG=backend-v1.3`. Ne rien changer d'autre : `STORAGE_PURGE_ENABLED` reste absent, vide ou à `false`. La purge ne s'active qu'à l'étape 3.6 ; d'ici là, la file se remplit sans que rien soit effacé. `FRONTEND_IMAGE_TAG` reste `frontend-v1.2` et `BACKEND_MEMORY_LIMIT` reste `768M` (E48).
2. Le contenu de la stack ne change pas : la version de l'équipe reste en place (K.4 abandonné, E51). Ne pas y coller le [docker-compose.yml](../docker-compose.yml) de développement.
3. Mettre la stack à jour, option *Re-pull image* activée.

#### N. Vérifications après le déploiement de l'étape 2

1. **Journal du backend** : `Migrating schema "public" to version "2 - file metadata contract"`, puis versions 3 et 4, `Successfully applied 3 migrations to schema "public", now at version v4`, la ligne `Variables d'environnement vides, traitées comme absentes : …` (liste attendue : celles que la stack transmet vides, sans aucun secret), puis `Started SiteAmameApplication`. En cas d'erreur, revenir en arrière (ci-dessous) et transmettre le message. Les migrations sont déjà appliquées à ce moment-là : le retour en `v1.2` sur une base en V4 a été essayé (journal du 17 novembre).
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
   | ✅ Empreinte pour 100 % des lignes — 17 novembre 2026 : `inventory.sh` à 12:04, 26 lignes, 0 sans empreinte | `SELECT count(*) FILTER (WHERE file_sha256 IS NULL), count(*) FROM file_entity;` : 0 en première colonne |
   | ✅ Zéro référence cassée — 17 novembre 2026 : `inventory.sh` avant (11:22) et après (11:55) le déploiement, 0 référence cassée | `inventory.sh`, point 4 |

6. **Création d'une filière (C8)** : depuis l'administration, créer une filière de test avec une image, puis une sans image. Les deux réussissent et apparaissent dans la liste ; un nom vide est refusé par un message d'erreur, et non plus par une erreur 500. Supprimer ensuite les filières de test.

#### Retour arrière de l'étape 2

Remettre `BACKEND_IMAGE_TAG=backend-v1.2`, sans toucher au schéma. Les migrations V2 à V4 sont additives : `backend-v1.2` crée toujours des clés neuves, conformes, avec MIME et taille ; Hibernate ignore la colonne et la table ajoutées ; Flyway ignore les migrations plus récentes que celles qu'il connaît. Deux conséquences à connaître, sans gravité :

- `backend-v1.2` efface encore l'ancien fichier lors d'un remplacement et laisse sa ligne : `inventory.sh` la montrera comme ligne orpheline au fichier absent, à supprimer par `delete-orphan-rows.sh` au retour en `v1.3`, une fois qu'elle a plus de 2 jours (délai du script) ;
- si un compte qui avait une adhésion a été supprimé sous `v1.3`, l'adhésion détachée fait échouer la liste des adhésions de `v1.2` : supprimer ces adhésions (`DELETE FROM adhesions WHERE user_id IS NULL;`) ou revenir en `v1.3` ;
- la création d'une filière échoue de nouveau (C8), sans effet sur les données.

Ce retour arrière, d'abord déduit du code et des migrations (écart E27), a été rejoué en local le 17 novembre 2026, avec la stack de production : `v1.2` démarre sur la base en V4 sans migration, les données et les fichiers restent lisibles, et le retour en `v1.3` ensuite donne un inventaire conforme (journal du 17 novembre). `backend-v1.2` n'a pas le correctif E51 : les variables qu'il lit doivent rester définies et non vides dans Portainer.

**Plus possible une fois `backend-v1.4` déployé** (migration V5, étape 3) : l'empreinte devient obligatoire, et `backend-v1.2` n'en enregistre pas. Ses uploads échoueraient. Le retour arrière le plus lointain est alors `backend-v1.3`.

#### O. Avant de déployer l'étape 3

1. **Une semaine d'étape 2 en production** (prérequis du §5) : pas avant le 24 novembre 2026. **Levé par l'équipe le 17 novembre (E57)** : déploiement le jour même.
2. ✅ **Inventaire** — 18 novembre 2026, 08:23 UTC : conforme, 0 sans empreinte. `inventory.sh` dans la console d'`amame-ops-backup`. Attendu : `inventaire conforme`, `sans empreinte SHA-256 : 0`. La migration V5 rend l'empreinte obligatoire et valide le format des clés : une seule ligne fautive la fait échouer, et `backend-v1.4` ne démarre pas. PostgreSQL annule alors la migration entière : la base reste en V4, revenir en `backend-v1.3` et transmettre le message.
3. **Point de restauration** : `backup.sh` juste avant la mise à jour de la stack.
4. ✅ **Tests** : `./mvnw test` le 17 novembre 2026, 115 tests, 0 échec. À relancer si le code change d'ici la construction des images.
5. ✅ **Essai local** du passage `v1.3` → `v1.4`, de la copie, de la bascule et des deux retours arrière, avec la stack de production et un faux Bunny : 61 vérifications, puis 13 pour le retour en `v1.3`, 0 échec du code livré (journal du 17 novembre). À refaire si le code change d'ici la construction des images.
6. **Fichier `actualite/fd838654-….pdf`** (sans ligne en base, relevé à l'étape 2) : il n'est pas copié, puisque la copie part de la base. Il reste sur le disque et dans les sauvegardes. Rien à faire, sauf si l'équipe le reconnaît comme un document à republier depuis l'administration.

#### P. Images de l'étape 3, déploiement en stockage local (3.2)

1. ✅ **Images** `backend-v1.4`, `frontend-v1.3` et `ops-v1.2` : **publiées le 17 novembre 2026**, avec l'autorisation de l'équipe, depuis `6552a6d` (branche locale `deploiement/v1.3`). Empreintes à l'action D. `scraper-v1.1` ne change pas.

   ```bash
   docker build --label org.opencontainers.image.revision=6552a6d -t yayacode224/amame:backend-v1.4 backend
   docker build --label org.opencontainers.image.revision=6552a6d -t yayacode224/amame:frontend-v1.3 frontend
   docker build --build-arg PG_MAJOR=15 --label org.opencontainers.image.revision=6552a6d -t yayacode224/amame:ops-v1.2 ops/backup
   docker push yayacode224/amame:backend-v1.4
   docker push yayacode224/amame:frontend-v1.3
   docker push yayacode224/amame:ops-v1.2
   ```

2. **Stack `amamestack`** : dans le contenu de la stack (version de l'équipe), ajouter au service `backend`, sous `environment`, ces cinq lignes, sans valeur :

   ```yaml
         - BUNNY_STORAGE_ENDPOINT=${BUNNY_STORAGE_ENDPOINT}
         - BUNNY_PUBLIC_ZONE=${BUNNY_PUBLIC_ZONE}
         - BUNNY_PUBLIC_ZONE_KEY=${BUNNY_PUBLIC_ZONE_KEY}
         - BUNNY_PRIVATE_ZONE=${BUNNY_PRIVATE_ZONE}
         - BUNNY_PRIVATE_ZONE_KEY=${BUNNY_PRIVATE_ZONE_KEY}
   ```

   Elles restent vides jusqu'à la bascule (action S) : `backend-v1.4` les traite comme absentes (E51) et ne les lit qu'avec `STORAGE_PROVIDER=bunny`. Variables : `BACKEND_IMAGE_TAG=backend-v1.4`, `FRONTEND_IMAGE_TAG=frontend-v1.3`. Ne rien changer d'autre : `STORAGE_PROVIDER` reste `local` (ou vide), `MEDIA_BASE_URL` reste vide, `STORAGE_PURGE_ENABLED` reste absent ou à `false`. Mettre la stack à jour, option *Re-pull image* activée.
3. **Vérifications** :
   - journal du backend : `Migrating schema "public" to version "5 - file metadata required"`, `Successfully applied 1 migration to schema "public", now at version v5`, puis `Started SiteAmameApplication` ;
   - journal du frontend : `40-runtime-config.sh : /uploads/ servi depuis le disque` ;
   - le site affiche les images des articles ; une adresse `https://amame.ml/uploads/utilisateur/…` répond 404.
4. **Stack `amame-ops`** : `OPS_IMAGE_TAG=ops-v1.2`. Ajouter au service `backup`, sous `environment`, les sept lignes de [amame-ops.yml](../deploy/portainer/amame-ops.yml) : `BUNNY_PUBLIC_ZONE`, `BUNNY_PRIVATE_ZONE`, `BUNNY_PUBLIC_ZONE_KEY`, `BUNNY_PRIVATE_ZONE_KEY`, `BUNNY_PUBLIC_ZONE_READ_KEY`, `BUNNY_PRIVATE_ZONE_READ_KEY`, `BACKUP_FILES_SOURCE` (vide ou absente : `disk`). Mettre la stack à jour, *Re-pull image* activé. `backup.sh` doit se terminer comme avant.

#### Q. Bunny : zones et Pull Zone (3.1)

À faire dans le panneau Bunny, à tout moment avant l'action R. Ne jamais coller de mot de passe dans une conversation ou un ticket : ils vont directement dans les variables des stacks (fichier `.env` chargé dans Portainer, action K.7).

1. **Deux zones de stockage**, même région que `amamestoragezone` (Francfort), tier Standard, sans réplication : `amame-public` et `amame-private`. Les noms de zone sont uniques chez Bunny, tous comptes confondus (E40) : si un nom est pris, en choisir un autre et le reporter tel quel dans `BUNNY_PUBLIC_ZONE` ou `BUNNY_PRIVATE_ZONE`.
2. **Mots de passe** de chaque zone (*FTP & API Access*) :
   - *Password* (écriture) : `BUNNY_PUBLIC_ZONE_KEY` et `BUNNY_PRIVATE_ZONE_KEY`, dans `amamestack` (à la bascule) et dans `amame-ops` (pendant la migration seulement) ;
   - *Read-only password* : `BUNNY_PUBLIC_ZONE_READ_KEY` et `BUNNY_PRIVATE_ZONE_READ_KEY`, dans `amame-ops` seulement.
   Si le point d'accès de ces zones n'est pas `storage.bunnycdn.com`, renseigner `BUNNY_STORAGE_ENDPOINT=https://<point d'accès>` dans les deux stacks.
3. **Pull Zone** `amamemedia` (lettres et chiffres seulement : Bunny refuse le tiret et le point ; le nom donne l'adresse `amamemedia.b-cdn.net`), origine : la zone de stockage **publique** seulement. Puis, dans la Pull Zone, *Hostnames* : ajouter `media.amame.ml`, avec l'enregistrement DNS `CNAME media → amamemedia.b-cdn.net`, puis certificat gratuit et *Force SSL*. Aucune Pull Zone sur la zone privée.
4. **Cookies** (D10) : rien à faire. `COOKIE_DOMAIN` est vide en production depuis le 15 novembre (E50) : les cookies ne partent jamais vers `media.amame.ml`. À constater à l'action T.
5. **Tests de fumée**, une fois `ops-v1.2` en place avec les variables des zones : `copy-to-bunny.sh` (simulation) dans la console d'`amame-ops-backup`. Il liste les deux zones : un mot de passe faux ou un nom de zone erroné le fait échouer tout de suite. Attendu sur des zones vides : `déjà dans Bunny : 0`, et autant de lignes `à envoyer` que de lignes `file_entity`.

#### R. Copie et réconciliation (3.3 et 3.4)

**Adresse du CDN**, notée `<CDN>` dans les actions R à T : `https://amamemedia.b-cdn.net` (choix de l'équipe du 17 novembre, E58). Quand `media.amame.ml` aura son enregistrement DNS et son certificat, passer `MEDIA_BASE_URL=https://media.amame.ml` dans `amamestack` et mettre la stack à jour : aucune nouvelle image, aucune donnée à modifier.

Dans la console d'`amame-ops-backup`, le service tournant normalement :

```bash
copy-to-bunny.sh             # simulation : objets à envoyer
copy-to-bunny.sh --apply     # attendu : « erreurs : 0 », puis « copie terminée »
copy-to-bunny.sh             # relance : « SIMULATION : … 0 objet(s) à envoyer »
reconcile-bunny.sh           # attendu : « réconciliation conforme »
```

- Une ligne `DIVERGENT` (fichier du disque différent de sa ligne) ou `ABSENT` : ne pas basculer, transmettre la sortie.
- Relever le compteur `empreinte non fournie par Bunny` : 0 répond à la question des tests de fumée (§5, 3.1) ; le listing de Bunny restitue alors l'empreinte, et la réconciliation la contrôle pour chaque objet.
- Contrôle du CDN : ouvrir `<CDN>/uploads/<clé d'une image publique>` (clé lue dans `file_entity` ou dans la sortie de la copie) : l'image s'affiche. Une clé `uploads/utilisateur/…` sur `<CDN>` répond 404.

#### S. Bascule (3.5)

1. `backup.sh`, puis `reconcile-bunny.sh` : `réconciliation conforme`. Sinon, ne pas basculer.
2. **Stack `amamestack`**, variables : `STORAGE_PROVIDER=bunny`, `MEDIA_BASE_URL=<CDN>`, `BUNNY_PUBLIC_ZONE`, `BUNNY_PUBLIC_ZONE_KEY`, `BUNNY_PRIVATE_ZONE`, `BUNNY_PRIVATE_ZONE_KEY` (mots de passe d'**écriture**, *Password* : jamais le *Read-only password*, qui fait échouer tous les uploads, incident du 18 novembre). Mettre la stack à jour (pas besoin de *Re-pull*). Le backend et le frontend redémarrent.
3. **Aussitôt**, dans `amame-ops-backup` : `copy-to-bunny.sh --apply` (lignes créées entre la copie et la bascule), puis `reconcile-bunny.sh`.
4. **Stack `amame-ops`** : `BACKUP_FILES_SOURCE=bunny`, mise à jour de la stack, puis `backup.sh`. Attendu : `fichiers : N dans Bunny, M nouveau(x) copié(s)`. Les nouveaux fichiers ne sont plus sur le disque : sans ce réglage, ils manqueraient aux sauvegardes.
5. **Journaux** :
   - backend : `Stockage des fichiers dans Bunny : zone publique …, zone privée …`, puis `Started SiteAmameApplication`. Un refus de démarrer cite la variable manquante (`STORAGE_PROVIDER=bunny : à définir : …`) : la renseigner, ou revenir en arrière (ci-dessous) ;
   - frontend : `40-runtime-config.sh : /uploads/ redirigé vers <CDN>`.

#### T. Vérifications et critères de l'étape 3

| Vérification | Comment la constater |
| --- | --- |
| Les images du site viennent du CDN | outils de développement du navigateur, onglet Réseau : les images ont des adresses `<CDN>/uploads/…` ; aucun cookie n'est envoyé avec elles (E50) |
| Une ancienne adresse redirige | `https://amame.ml/uploads/<clé>`, en navigation privée (C14) ou avec `curl -I` : réponse 301 vers `<CDN>/uploads/<clé>` |
| Les fichiers privés restent privés | `https://amame.ml/uploads/utilisateur/<clé>` et `<CDN>/uploads/utilisateur/<clé>` : 404. Un membre voit sa photo et son CV dans son espace ; un administrateur aussi |
| Un upload va dans Bunny | créer un article de test avec image : il s'affiche, et `reconcile-bunny.sh` le compte parmi les objets cohérents. Remplacer l'image : l'ancienne clé entre dans la file de purge, son objet reste dans Bunny |
| Sauvegarde depuis Bunny | `backup.sh` puis `restore-test.sh` : réussis |

Critères de sortie (§5), à cocher avec leur date :

| Critère | Comment le constater |
| --- | --- |
| ✅ La recette est passée — 18 novembre 2026 : images servies par le CDN, redirection 301, fichiers privés en 404 (site et CDN) et visibles par leur propriétaire, upload public (article n° 7) et privé (inscription avec photo et CV) dans Bunny, suppressions vers la file de purge, sauvegarde depuis Bunny et `restore-test.sh` réussis (journal du 18 novembre). Seul le remplacement d'une image n'a pas été refait en production : même mécanisme que la suppression, constatée, et essayé en local (phase D de l'essai n° 4) | le tableau ci-dessus, en entier |
| ✅ Zéro référence cassée, zéro écart d'empreinte — 18 novembre 2026 : bascule du backend à 08:35 UTC, `reconcile-bunny.sh` à 08:52, 26 cohérents, `réconciliation conforme` | `reconcile-bunny.sh` après la bascule : `réconciliation conforme` |
| Aucun 404 sur les médias pendant 48 h (jusqu'au 20 novembre, 08:35 UTC) | statistiques de la Pull Zone `amamemedia` : aucune réponse 404 ; `reconcile-bunny.sh` toujours conforme au bout de 48 h |
| ✅ Plus aucune requête `/uploads/` servie depuis le disque — 18 novembre 2026, constaté de l'extérieur après 08:54 UTC : `https://amame.ml/uploads/…` répond `301` vers `https://amamemedia.b-cdn.net/uploads/…`, `config.js` et l'API portent l'adresse du CDN | journal du frontend (`redirigé vers`) et redirection 301 constatée ci-dessus |

**3.6, après 48 h sans anomalie** : `STORAGE_PURGE_ENABLED=true` dans `amamestack`, mise à jour de la stack. La purge efface alors dans Bunny les objets en file depuis plus de 10 jours. La réconciliation hebdomadaire et son mode `enforce` restent à écrire (E52) : d'ici là, `reconcile-bunny.sh` à la main, une fois par semaine.

#### Retour arrière de l'étape 3

**Avant la bascule** (après l'action P seulement) : `BACKEND_IMAGE_TAG=backend-v1.3`, `FRONTEND_IMAGE_TAG=frontend-v1.2`. La migration V5 reste en place ; `backend-v1.3` enregistre toujours une empreinte, et sa validation du schéma ne contrôle pas `NOT NULL`. Essayé en local le 17 novembre (phase F de l'essai n° 4). Pas plus loin que `v1.3` (voir le retour arrière de l'étape 2).

**Après la bascule** : aucune donnée en base n'est à modifier, et rien n'est effacé dans Bunny.

1. `STORAGE_PURGE_ENABLED` absent ou à `false` pendant l'opération.
2. **Rapatriement**, encore en mode Bunny : `copy-from-bunny.sh /data/uploads` (simulation) dans `amame-ops-backup`, puis l'écriture dans un conteneur ponctuel (procédure dans [ops/README.md](../ops/README.md)). Les fichiers créés depuis la bascule reviennent sur le disque, contrôlés par leur taille et leur empreinte.
3. **Stack `amamestack`** : `STORAGE_PROVIDER=local`, `MEDIA_BASE_URL` vide, mise à jour. Le frontend sert de nouveau `/uploads/` depuis le disque.
4. Relancer le rapatriement (fichiers créés entre l'étape 2 et l'étape 3 ; ceux déjà présents ne sont pas réécrits), puis supprimer le conteneur ponctuel.
5. **Stack `amame-ops`** : `BACKUP_FILES_SOURCE=disk`, mise à jour. `inventory.sh` : `inventaire conforme`.

#### U. Neon : réglages, mot de passe exposé, rôles et base (4.1), faite le 18 novembre

Dans la console Neon, projet `amame-site`. Aucun mot de passe ni aucune chaîne de connexion ne se transmet par une conversation : seules les sorties demandées ci-dessous.

1. **Mot de passe exposé le 13 novembre** : rôle `amame-site-owner` de la branche `production` (*Roles & Databases*) → *Reset password*. Il ne sert qu'à la console.
2. **Version exacte** : *SQL Editor*, branche `production` : `SHOW server_version;`. À transmettre. Plus récente que 18.7 (la version de `ops-v1.3`) : l'image est reconstruite avant la répétition (C16).
3. **Calcul** (E60) : calcul de la branche `production` et réglage par défaut du projet : autoscaling **0,25 ↔ 1 CU** (relevé : 0,25 ↔ 8) ; mise en veille (*Scale to zero*) **activée, 5 minutes**. Relever le réglage de veille actuel avant de le changer.
4. **Rétention de l'historique** (E60, §6.1) : **7 jours** (relevé : 6 heures). Elle reste plus courte que la rétention de la purge (10 jours).
5. **Rôles et base** : les deux requêtes de [ops/README.md](../ops/README.md) (« Rôles et base »), sur la branche `production`. Quatre mots de passe neufs et différents, tirés dans la console d'`amame-ops-backup` (commande dans le README), gardés hors du dépôt, par exemple dans un gestionnaire de mots de passe de l'équipe. Contrôle dans le *SQL Editor*, sorties à transmettre :

   ```sql
   SELECT rolname, rolsuper, rolcreaterole, rolcreatedb FROM pg_roles WHERE rolname LIKE 'amame\_%' ORDER BY 1;
   SELECT datname, pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'amame_db';
   ```

   Attendu : les quatre rôles, `f` dans les trois colonnes ; `amame_db` appartient à `amame_owner`.
6. **Hôte direct** : *Connect*, branche `production`, base `amame_db`, *Connection pooling* désactivé : l'hôte `ep-….eu-central-1.aws.neon.tech`, **sans** `-pooler`. Il n'est pas secret, mais il n'est pas écrit dans le dépôt.

**Ne jamais démarrer un backend sur une base Neon vide** : Flyway, qui se connecte en propriétaire, y créerait un schéma neuf, et `db-transfer.sh` refuserait ensuite cette cible. Le backend ne s'y connecte qu'après un transfert réussi.

#### V. Répétition sur une branche Neon (4.2), après U

Environnement de recette de DT7 : stockage local, médias affichés depuis le CDN de production, purge désactivée. Rien n'est écrit dans la production, ni dans la base du VPS ni dans Bunny.

1. *Branches → New branch* : `repetition`, parent `production`, état actuel. Elle hérite des rôles et de la base vide `amame_db`. Relever son hôte direct.
2. **Conteneur ponctuel `amame-transfert`** (Portainer, *Containers → Add container*), comme pour le rapatriement ([ops/README.md](../ops/README.md)) : image `yayacode224/amame:ops-v1.3`, commande `sleep 14400`, réseau `common_net` puis *Join network* `amame-ops_sortie`. Variables :
   - `SOURCE_DATABASE_URL` : la valeur de `BACKUP_DATABASE_URL` de la stack `amame-ops` (base du VPS) ;
   - `TARGET_DATABASE_URL=postgresql://amame_owner:<mot de passe>@<hôte direct de repetition>/amame_db?sslmode=verify-full&sslrootcert=/etc/ssl/certs/ca-certificates.crt`.
3. Dans sa console : `db-transfer.sh` (simulation : versions, `cible : vide, rôles amame_app, amame_scraper et amame_backup présents`), puis `db-transfer.sh --apply`. Attendu : `bases identiques`. La production tourne pendant la répétition : une connexion entre le dump et la comparaison peut ajouter une ligne à `refresh_token`. Un écart limité à cette table s'explique ; tout autre écart arrête la répétition. Sorties à transmettre.
4. **Lecture par `amame_backup`**, même console : `pg_dump -Fc -f /tmp/essai.dump "<URL de amame_backup sur repetition, même suffixe>" && pg_restore -l /tmp/essai.dump | grep -c 'TABLE DATA'`. Attendu : le nombre de tables (27).
5. **Backend ponctuel `amame-repetition`** : image `yayacode224/amame:backend-v1.4`, réseau `amame-ops_sortie` seul, mémoire limitée à 512 Mo. Variables :
   - `SPRING_PROFILES_ACTIVE=prod` ;
   - `DATABASE_URL=jdbc:postgresql://<hôte direct de repetition>/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory` ;
   - `DATABASE_USERNAME=amame_app`, `DATABASE_PASSWORD`, `DATABASE_MIGRATION_USERNAME=amame_owner`, `DATABASE_MIGRATION_PASSWORD` ;
   - `STORAGE_PROVIDER=local`, `MEDIA_BASE_URL=https://amamemedia.b-cdn.net`, `STORAGE_PURGE_ENABLED=false` ;
   - `JWT_SECRET` : une valeur neuve de 48 caractères, **pas celle de la production**.

   Journal attendu : `Database: jdbc:postgresql://<hôte>/amame_db (PostgreSQL 18.…)`, l'avertissement de Flyway sur la version 18 (sans effet, E59), `Schema "public" is up to date. No migration necessary.`, `Started SiteAmameApplication`.
6. **Recette**, depuis la console d'`amame-transfert` : `curl -s -o /dev/null -w '%{http_code}\n' http://amame-repetition:8080/api/visitor/bourses`, puis `…/api/visitor/articles/search` : `200`.
7. **Mesures** (critères de l'étape 4), même console :
   - **réveil à froid**, dix mesures espacées de 400 s (la veille survient 5 min après la dernière connexion, que le pool ferme au bout de 60 s), environ 70 minutes :
     `nohup sh -c 'for i in 1 2 3 4 5 6 7 8 9 10; do sleep 400; curl -s -o /dev/null -w "%{time_total}\n" http://amame-repetition:8080/api/visitor/bourses; done' > /tmp/reveil.txt 2>&1 &`, puis plus tard `cat /tmp/reveil.txt` ;
   - **temps de réponse à chaud**, juste après un appel : `for i in $(seq 10); do curl -s -o /dev/null -w "%{time_total}\n" http://amame-repetition:8080/api/visitor/bourses; done`. Référence : la même boucle sur `http://amame-backend:8080/api/visitor/bourses` (backend de production, base du VPS).
8. **Consommation** : CU-h de la branche `repetition` dans la console.
9. **Nettoyage** : supprimer les conteneurs `amame-repetition` et `amame-transfert`, puis la branche `repetition`.

#### W. Bascule (4.3), dès la répétition réussie (E61)

Prérequis : V réussie ; utilisateurs prévenus de l'interruption (une demi-heure environ), fait selon l'équipe le 19 novembre. Le dernier critère de l'étape 3 (20 novembre) n'est plus un préalable (E61).

1. `amame-ops-backup` : `backup.sh`.
2. **Arrêter `amame-backend`** (Portainer, *Containers*). Le site reste affiché et ses images viennent du CDN ; seules l'API et les pages dynamiques sont indisponibles.
3. Conteneur ponctuel `amame-transfert` (V.2), avec `TARGET_DATABASE_URL` sur l'hôte direct de **`production`**. `db-transfer.sh` : `autres connexions ouvertes : 0` ; puis `db-transfer.sh --apply` : `bases identiques`. Sinon, ne pas basculer : redémarrer `amame-backend`, rien n'a changé pour lui.
4. **Ancienne base en lecture seule**, console d'`amame-database` : `psql -U postgres -d postgres -c "ALTER DATABASE amame_db SET default_transaction_read_only = on"`. Une écriture qui s'y tromperait encore (variable mal saisie, scraper) échoue au lieu de se perdre. La lecture et `pg_dump` restent possibles (essayé le 18 novembre).
5. **Stack `amamestack`** :
   - contenu de [amamestack.yml](../deploy/portainer/amamestack.yml), donc **sans `SPRING_DATASOURCE_PASSWORD`** (C17) ;
   - variables : `DATABASE_URL=jdbc:postgresql://<hôte direct de production>/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory`, `DATABASE_USERNAME=amame_app`, `DATABASE_PASSWORD`, `DATABASE_MIGRATION_USERNAME=amame_owner`, `DATABASE_MIGRATION_PASSWORD`. Les `DB_POOL_*` restent absentes : profil « veille » ;
   - *Update the stack*, sans *Re-pull*.
6. **Journal du backend** : `Database: jdbc:postgresql://ep-…/amame_db (PostgreSQL 18.…)`, `Schema "public" is up to date. No migration necessary.`, `Started SiteAmameApplication`. **Si l'hôte affiché est `database:5432`**, les variables n'ont pas été prises : arrêter le backend et corriger.
7. **Recette rapide** dans l'interface : connexion, listes publiques, une page avec images, article de test avec image créé puis supprimé.
8. **Stack `amame-ops`** : `OPS_IMAGE_TAG=ops-v1.3` ; `BACKUP_DATABASE_URL=postgresql://amame_backup:<mot de passe>@<hôte direct de production>/amame_db?sslmode=verify-full&sslrootcert=/etc/ssl/certs/ca-certificates.crt` ; `SCRAPER_DATABASE_URL`, même forme avec `amame_scraper` (C18). *Update the stack* avec *Re-pull image*. Puis, dans `amame-ops-backup` : `postgres --version` (18.…), `backup.sh`, `restore-test.sh`, `reconcile-bunny.sh` (`réconciliation conforme`).
9. Supprimer `amame-transfert`.

#### X. Après la bascule (4.4) et critères de l'étape 4

- **Consommation** : CU-h relevés chaque jour pendant deux semaines, puis chaque semaine (console Neon) ; projection mensuelle consignée.
- **Ancienne base** : laissée en service, en lecture seule ; son volume est conservé au moins 14 jours. Elle quitte la stack à l'étape 6.
- **Dans le dépôt**, après la bascule : image des tests en `postgres:18-alpine` (E19) ; `OPS_PG_MAJOR=18` et `ops-v1.3` par défaut dans les fichiers compose, le `Dockerfile`, `.env.example`, le README d'exploitation et CLAUDE.md (**fait le 19 novembre**). `AMAME_NETWORK` reste tant que l'ancienne base sert au retour arrière (son étape 4 remet `amame-ops` sur la base du VPS, donc sur `common_net`) : retirée avec elle, à l'étape 6. La base locale de `docker-compose.yml` reste en 15 : `restore-db.sh` vers elle demande `ops-v1.2.1` et `OPS_PG_MAJOR=15` (documenté dans `.env.example`).

| Critère (§5) | Comment le constater |
| --- | --- |
| La recette et les mesures [N02 §8] sont passées | V.6 et V.7, puis W.7 et W.8 |
| Le nombre de lignes par table et la liste des clés sont identiques des deux côtés | `bases identiques` de W.3 |
| La réconciliation indique zéro référence cassée | `reconcile-bunny.sh` de W.8 |
| Le temps de réponse médian, hors réveil à froid, ne dépasse pas la référence de plus de 20 ms | V.7 : médiane à chaud sur Neon contre médiane du backend de production |
| Le réveil à froid est mesuré et consigné | V.7 : les dix mesures de `/tmp/reveil.txt` |
| La projection de consommation après deux semaines reste sous le seuil d'alerte (§6.3) | relevés de X |

#### Retour arrière de l'étape 4

**Avant la mise à jour d'`amamestack`** (W.1 à W.4) : lever la lecture seule (`psql -U postgres -d postgres -c "ALTER DATABASE amame_db RESET default_transaction_read_only"`, depuis la base `postgres` : depuis `amame_db`, la levée est elle-même refusée), redémarrer `amame-backend`. Pour une nouvelle tentative, vider la cible dans le *SQL Editor* de Neon : `DROP DATABASE amame_db;` puis `CREATE DATABASE amame_db OWNER amame_owner;`.

**Après la bascule**, quand Neon a reçu des écritures :

1. Arrêter `amame-backend`, puis lever la lecture seule de l'ancienne base (ci-dessus).
2. Conteneur ponctuel `amame-transfert` (V.2, cible : `production`), dans sa console :

   ```bash
   pg_dump --format=custom --file=/tmp/retour.dump "$TARGET_DATABASE_URL"
   pg_restore --clean --if-exists --no-owner --no-privileges --file=- /tmp/retour.dump \
     | sed -e '/^SET transaction_timeout/d' \
     | psql "$SOURCE_DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -q -o /dev/null
   ```

   `pg_restore` directement vers la base 15 échoue sur `SET transaction_timeout`, que PostgreSQL 15 ne connaît pas : d'où le passage par `psql`. Essayé en local depuis 17 et depuis 18 vers 15.20 (phase G des essais n° 5 et 6).
3. **`amamestack`** : retirer les cinq variables `DATABASE_*` (retour aux valeurs par défaut : la base du VPS), *Update the stack*. Journal : `database:5432`, `up to date`.
4. **`amame-ops`** : `OPS_IMAGE_TAG=ops-v1.2.1`, anciennes valeurs de `BACKUP_DATABASE_URL` et `SCRAPER_DATABASE_URL`, mise à jour ; `backup.sh`. Supprimer `amame-transfert`.

### Faits relevés en production

Valeurs à relever une fois, puis à réutiliser dans toutes les étapes suivantes.

| Fait | Valeur | Relevé le |
| --- | --- | --- |
| Chemin réel du dossier des uploads sur l'hôte (§3.1, point 4) | `/data/compose/64/backend/uploads` → `/app/uploads`. C'est le `./backend/uploads` relatif de la stack, résolu dans le dossier de travail de Portainer pour la stack n° 64. Le fichier de production le donne désormais en absolu (`UPLOADS_HOST_PATH`), pour ne plus dépendre de ce dossier (E39) | 9 novembre 2026 (Portainer, conteneur `amame-backend`) |
| Stack applicative dans Portainer | nom **`amamestack`** (n° 64) ; volume de la base **`amamestack_database_data`**. Les deux dépendent du nom de la stack : toujours mettre à jour cette stack, ne jamais en créer une autre | 9 novembre 2026 |
| Réseau `common_net` | externe, partagé, **interne** (`Internal: true` dans Portainer). Conteneurs branchés : `amame-frontend` (172.20.0.2), `amame-backend` (.3), `sahel_academy_backend` (.4), `sahel_academy_web` (.5), `amame-database` (.7), `amame-scraper` (.8), `amame-ops-backup` (.9), `npm`. Un autre projet partage donc ce réseau : les noms `backend` et `database` ne doivent désigner que les conteneurs d'AMAME (le frontend joint `backend:8080`, `backend-v1.1` joint `database:5432`). **`nslookup` du 14 novembre** : `database` → 172.20.0.7 seul, mais **`backend` → 172.20.0.3 et 172.20.0.4** : le service de `sahel_academy_backend` s'appelle aussi `backend`. Le Nginx du frontend répartit alors l'API entre les deux. Correction : liens Docker dans `amamestack.yml` (écart E42) | 9 et 14 novembre 2026 |
| **Stack de production réelle** (écart E38) | images `yaya236/amame-web-site:backend-v7` (publiée le 7 juin 2026), `frontend-v7` (9 juin), `scraper-v2`, toutes `linux/amd64` ; réseau **externe** `common_net` ; ports publiés sur toutes les interfaces : `3000` (frontend) et `8080` (backend) ; base réglée par `command` (`shared_buffers=1GB`, `work_mem=16MB`, `maintenance_work_mem=256MB`, `effective_cache_size=4GB`) ; backend limité à 3 Go ; `ddl-auto=update` ; journaux `DEBUG` pour le web et la sécurité ; JWT de 30 jours ; `COOKIE_DOMAIN` et `COOKIE_SECURE` absents, donc `.amame.ml` et `true` par le profil `prod` ; scraper dans la stack (`restart: "no"`) ; mot de passe de la base par défaut et secrets écrits en clair dans la stack. Pas de supervision, pas de pgAdmin. **Son contenu, conservé hors du dépôt, est le retour arrière de l'étape 0** | 9 novembre 2026 (stack transmise par l'équipe) |
| Docker Hub | poste de développement connecté avec le compte `yayacode224` ; dépôt `yayacode224/amame` **public**, qui ne contenait que les tags `backend-v1.0`, `frontend-v1.0` et `scraper-v1.0` (29 septembre), jamais utilisés en production. Tags de l'étape 0 publiés le 13 novembre : `backend-v1.1`, `frontend-v1.1`, `ops-v1.1`, `scraper-v1.1` (action D). Correctif publié le 16 novembre : `backend-v1.1.1`, `frontend-v1.1.1` (E44) | 9, 13 et 16 novembre 2026 |
| Comptes Bunny et Neon | créés | 9 novembre 2026 (déclaré par l'équipe) |
| Sortie vers Internet depuis `common_net` | **aucune**. Mesures dans `amame-ops-backup`, branché sur `common_net` seul, le 14 novembre : `nslookup … 8.8.8.8` et `… 1.1.1.1` donnent `Network unreachable`, et `curl https://1.1.1.1/` échoue immédiatement (« after 0 ms »). Ailleurs, tout fonctionne : le DNS interne résout `amame-database`, et les serveurs `dns: [8.8.8.8, 1.1.1.1]` de la stack sont bien appliqués. Diagnostic : le conteneur n'a pas de route par défaut, ce qui est le comportement d'un réseau déclaré `internal`. Docker y coupe aussi la résolution des noms extérieurs : d'où « DNS server returned general failure », avec ou sans `dns:`. Réseau `internal` **confirmé** dans Portainer le 14 novembre. Parade : un second réseau, ordinaire, propre à chaque stack, `amame-ops_sortie` puis `amamestack_sortie` pour le backend (écart E41). **Conséquence en production, constatée le 14 novembre** : dans `amame-backend`, `getent hosts smtp.gmail.com` échoue (`rc=2`). Le site actuel n'envoie donc aucun e-mail : inscription, mot de passe oublié. Les `dns: [8.8.8.8, 1.1.1.1]` de l'ancienne stack n'y pouvaient rien | 13 et 14 novembre 2026 |
| Zone Bunny de sauvegarde | **`amamestoragezone`**, région Francfort (écart E40 : le plan l'appelait `amame-backups`) ; *Access Key* et point d'accès relevés par l'équipe | 13 novembre 2026 (déclaré par l'équipe) |
| Projet Neon | région `eu-central-1` (Francfort), conforme. **Écarts avec le plan (§5, 4.1), à régler à l'étape 4** : base `amame-site-db` au lieu de `amame_db`, rôle propriétaire `amame-site-owner` au lieu de `amame_owner` (les tirets imposent des guillemets en SQL : créer plutôt la base et les rôles prévus) ; chaîne fournie sur le point d'accès **`-pooler`**, alors que Flyway et `pg_dump` demandent la connexion directe (§9) ; version de PostgreSQL *à relever* (17 prévu, `OPS_PG_MAJOR`). Le mot de passe du rôle propriétaire a été transmis dans une conversation : **à réinitialiser dans la console Neon avant l'étape 4**. Aucune valeur de connexion n'est écrite dans le dépôt. **Relevé du 18 novembre** (console, page du projet) : projet **`amame-site`**, créé le 22 septembre 2026 ; **PostgreSQL 18** (17 prévu : E59) ; plan **Launch** (Free prévu : E60) ; une seule branche, **`production`**, branche par défaut (le plan disait `main`) ; calcul par défaut **0,25 ↔ 8 CU** ; rétention de l'historique **6 heures** ; aucune restriction d'adresse IP ; aucune consommation depuis le 17 novembre (0 CU-h, 0 kB). **Version exacte : 18.7** (`SHOW server_version` : `18.7 (84da7d8)`, le suffixe est la révision de Neon), la même que `ops-v1.3` : aucune reconstruction (C16). Réglages recommandés (E60 : 0,25 ↔ 1 CU, veille à 5 minutes, historique de 7 jours) **déclarés faits par l'équipe** le 18 novembre. **Second relevé** (page du projet, même jour) : calcul par défaut **0,25 ↔ 1 CU**, conforme ; rétention de l'historique **1 jour** (7 recommandés ; choix de l'équipe, E62 ; toujours plus court que la rétention de la purge) ; veille non affichée sur cette page ; consommation depuis le 17 novembre : 0,08 CU-h, 39,42 Mo de stockage, 5,95 Mo d'historique | 13 novembre 2026, complété le 18 novembre |
| Portainer et son accès | Portainer **Community Edition 2.45.1 LTS**, ouvert par l'adresse du serveur et un port, en **HTTPS** ; Portainer et Nginx Proxy Manager **partagés avec les autres projets** du serveur ; l'équipe **n'a pas accès** au panneau client Contabo, donc pas à son pare-feu (E43) | 16 novembre 2026 (déclaré par l'équipe) |
| Accès au serveur | **pas d'accès SSH** : uniquement Portainer et les consoles des conteneurs. Toute commande `docker exec <conteneur> …` de ce suivi se lance dans la console Portainer de ce conteneur, sans le préfixe `docker exec <conteneur>` | 9 novembre 2026 (déclaré par l'équipe) |
| Proxy frontal | **Nginx Proxy Manager**, sur le même hôte : conteneur `npm`, image `jc21/nginx-proxy-manager:latest`. `amame.ml` répond avec `Server: openresty` (ports 80 et 443), le port 80 de l'hôte lui appartient. Le port 81 (administration de Nginx Proxy Manager par défaut) répond publiquement en HTTP. Les ports 3000, 8080 et 5432 ne sont pas joignables depuis Internet (pare-feu). **Cible du proxy, relevée le 14 novembre** : hôte `amame.ml` et `www.amame.ml` → `http://amame-frontend:80`, sur `common_net`, donc ni le port 3000 ni le 8080 de l'hôte. Réglages : *Force SSL*, *HTTP/2*, *Cache Assets* activé, *Block Common Exploits* et *Websockets* désactivés, HSTS désactivé ; *Custom locations* *à confirmer vide*. *Cache Assets* met en cache chez Nginx Proxy Manager les `.js`, `.css` et images, en ignorant le `Cache-Control` du site (voir les notes de l'étape 1) | 9 novembre 2026 (requêtes depuis l'extérieur, liste des conteneurs) |
| Point de restauration manuel avant l'étape 0 | `pg_dump -Fc` de `amame_db` : `/var/lib/postgresql/data/amame-avant-etape0.dump` (219 Ko), dans le volume de la base, qui survit à la mise à jour de la stack. À supprimer une fois l'étape 0 vérifiée. Uploads non copiés faute d'accès SSH : la première sauvegarde de `amame-ops` les couvrira, **avant** la mise à jour de l'application | 9 novembre 2026 |
| Nom du réseau Docker de la stack `amame` | `common_net`, externe (ligne « Réseau `common_net` ») ; `AMAME_NETWORK` de `amame-ops` vaut `common_net` par défaut dans le fichier de production | 9 novembre 2026 |
| Valeur effective de `COOKIE_DOMAIN` en production (étape 3.1) | `.amame.ml` jusqu'au 15 novembre (profil `prod` de l'ancienne stack). **Vide depuis** : variable définie vide dans la stack, cookies sans domaine (écart E50) | 9 novembre 2026, corrigé le 16 novembre |
| Proxy frontal devant le conteneur Nginx (TLS) : sur le même hôte ou ailleurs ? | même hôte, Nginx Proxy Manager en conteneur (ligne « Proxy frontal ») : son adresse est privée (172.16.0.0/12), déjà dans `set_real_ip_from` | 9 novembre 2026 |
| Le mot de passe de l'administrateur par défaut a-t-il été changé ? | *à vérifier* | — |
| La production définissait-elle `JWT_SECRET`, ou utilisait-elle la valeur par défaut du compose ? | *à vérifier dans les variables de la stack* | — |
| Comptes `SUPERADMIN`, `ADMIN` et `EDITOR` : tous connus ? | *à vérifier (action B.1)* | — |
| Poids des images de l'accueil, mesuré en production | *à mesurer ; estimation locale : 270 à 300 Ko pour la page entière* | — |
| Déploiement de l'étape 0 seule, ou avec l'étape 1 ? | **l'étape 0 seule d'abord** : la base n'a jamais connu le code des étapes 0 et 1 (E38, point 4) | 9 novembre 2026 (décision) |
| Le serveur ou Portainer récupèrent-ils le dépôt par `git pull` ? Les fichiers ont-ils été mis à l'abri avant (action A.1) ? | non : les stacks sont mises à jour à partir des images publiées sur Docker Hub (contenu du compose collé dans Portainer). A.1 ne concerne qu'un éventuel clone du dépôt sur le serveur | 8 novembre 2026 (déclaré par l'équipe) |
| Schéma de production comparé à `V1__baseline.sql` (action G.1) | *à faire avant de déployer l'étape 1* | — |
| Mémoire du conteneur `amame-backend` : avant l'étape 1, puis 24 heures et une semaine après | *à relever avec `docker stats` ; mesuré en local sous charge : 396 Mio sur 512* | — |
| Portainer accepte-t-il les valeurs par défaut imbriquées du compose (action I.3) ? | *à constater à la mise à jour de la stack* | — |
| Suite de tests complète (`./mvnw test`) avec les tests de l'étape 2 | `BUILD SUCCESS` : 70 tests, 0 échec, 8 min 07 (en local, Docker Desktop) | 8 novembre 2026 |
| Inventaire croisé avant l'étape 2 (action K.2) : compteurs de chaque catégorie | **`inventaire conforme`**. 31 lignes `file_entity`, 29 fichiers sur le disque, 26 cohérents. Bloquants : 0 référence cassée, 0 clé en double, 0 ligne partagée. **5 lignes orphelines** : 3 dans `utilisateur/` au fichier absent (id 1, 2, 4), une dans `partenaire/` (id 20) et une dans `concours/` (id 31), fichier présent. **1 fichier orphelin** : `uploads/actualite/fd838654-….pdf` (321 686 octets), sans ligne. 0 écart de taille, 0 clé hors format, 0 MIME ou taille manquants | 17 novembre 2026, 11:22 UTC |
| Empreintes et lignes orphelines après l'étape 2 (actions N.2 à N.4) | `backfill-sha256.sh --apply` : 28 lignes sur 31 ont une empreinte ; les 3 restantes sont les lignes orphelines au fichier absent (id 1, 2, 4). `delete-orphan-rows.sh` (simulation) : les 5 lignes orphelines de K.2, datées du 25 décembre 2025 au 7 juin 2026. `inventory.sh` : `inventaire conforme`, 0 référence cassée, 3 sans empreinte. Puis `delete-orphan-rows.sh --apply` (12:04) : 5 lignes supprimées, clés inscrites dans la file de purge. `inventory.sh` (12:04) : **26 lignes, toutes cohérentes et avec empreinte**, 0 ligne orpheline, 2 fichiers en attente de purge (lignes 20 et 31), 1 fichier orphelin (`actualite/fd838654-….pdf`, à traiter à l'étape 3), `inventaire conforme` | 17 novembre 2026, 11:54 à 12:04 UTC |

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
| E19 | Tests sur PostgreSQL | image `postgres:17` [N02 §4.6] ; H2 conservé | l'image du test suit la version de la base de production : **18 depuis la bascule du 19 novembre 2026** (15 auparavant ; 17 prévu, version du projet Neon, E59), comme `OPS_PG_MAJOR`. V2 et V3 s'exécuteront d'abord sur la base du VPS, en 15 : c'est cette version qu'il faut éprouver. L'autre s'essaie par `-Dtest.postgres.image=postgres:17-alpine` (fait le 5 octobre : V1 passe en 17). H2 et `data.sql` (dialecte H2, jamais exécuté) sont retirés : les migrations ne tournent pas sur H2 (DT4). Testcontainers est fixé à 1.21.4 : la version 1.20 que gère Spring Boot 3.4 ne dialogue pas avec Docker 29 |
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
| E38 | **La production réelle ne correspond pas à l'hypothèse du plan** | production supposée en `yayacode224/amame:*-v1.0`, sur le compose du dépôt | constaté le 9 novembre 2026 (voir « Stack de production réelle » dans les faits relevés). Conséquences : (1) le retour arrière de l'étape 0 est l'ancienne stack elle-même, et non les tags `v1.0` ; (2) le compose du dépôt publie le frontend sur le port 80 et crée son propre réseau, alors que la production publie `3000` et utilise le réseau externe `common_net` : il faut l'adapter à la façon dont le trafic arrive (proxy sur l'hôte ?) **avant** la mise à jour, sous peine de conflit de port ou de site coupé ; (3) la supervision n'a jamais existé en production et disparaît à l'étape 1 (E14) : elle n'est pas à déployer à l'étape 0, et `GRAFANA_ADMIN_PASSWORD` n'est pas à saisir ; (4) la base n'a jamais connu le code des étapes 0 et 1 : l'étape 0 se déploie seule d'abord, pour que `ddl-auto=update` mette le schéma au niveau du code avant la baseline Flyway de l'étape 1. Adaptation faite le 9 novembre, une fois le serveur relevé : écart E39 |
| E37 | Constat C8 corrigé à l'étape 2 | « sans rapport avec la migration », non retenu le 7 novembre | corrigé le 8 novembre à la demande de l'équipe, dans le même tag `backend-v1.3` : la partie JSON `filiere` est lue par `@RequestPart`, comme pour la modification et pour les autres contrôleurs. Un nom vide renvoie désormais 400 (validation `@Valid`, déjà présente mais jamais atteinte). La modification d'une filière n'est pas validée (`@Valid` absent) : comportement inchangé, hors du périmètre de C8 |
| E39 | **Fichiers de stack de production** | la stack Portainer reprend le `docker-compose.yml` du dépôt | décidé le 9 novembre 2026, à partir des relevés du serveur (E38). Le compose du dépôt reste celui du développement, **inchangé**. La production a ses propres fichiers, à coller dans Portainer : [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) et [deploy/portainer/amame-ops.yml](../deploy/portainer/amame-ops.yml). Leurs différences, chacune justifiée par le serveur : (1) aucune section `build`, les sources ne sont pas sur le serveur ; (2) réseau externe `common_net`, partagé avec Nginx Proxy Manager ; (3) frontend publié sur `3000`, comme avant, le port 80 appartenant à Nginx Proxy Manager ; backend non publié (à confirmer par la cible du proxy) ; (4) réglages mémoire de PostgreSQL de l'ancienne stack conservés ; (5) pas de pgAdmin, injoignable sans SSH ; (6) uploads par un chemin **absolu**, `UPLOADS_HOST_PATH`, la même variable que dans `amame-ops`, au lieu d'un chemin relatif résolu dans le dossier de travail de Portainer ; (7) `FRONTEND`, `COOKIE_DOMAIN` et `COOKIE_SECURE` ont leur valeur de production par défaut ; (8) `BACKEND_IMAGE_TAG` et `FRONTEND_IMAGE_TAG` n'ont **pas** de valeur par défaut : une image trop récente sur la base actuelle (baseline Flyway avant l'alignement de l'étape 0) l'abîmerait ; (9) limite mémoire du backend réglable (`BACKEND_MEMORY_LIMIT`, 512M par défaut) : 768M pendant l'étape 0, car `backend-v1.1` occupe 482 Mio sur 512 sous charge (E22). **Un seul fichier sert aux étapes 0, 1 et 2** : `backend-v1.1` lit `SPRING_DATASOURCE_PASSWORD` et ignore les variables `DATABASE_*`, `STORAGE_*` et `DB_POOL_*` ; les versions suivantes lisent `DATABASE_*`, et `SPRING_DATASOURCE_PASSWORD` y a la même valeur (E24). Le passage d'une étape à l'autre, comme le retour arrière, ne change que les tags. Dans `amame-ops`, la base est désignée par `amame-database`, nom de conteneur unique sur l'hôte, plutôt que par le nom de service `database`, que d'autres projets du réseau partagé pourraient porter. Les images se construisent par `docker build`, sans `.env` ; `.env` est exclu du contexte de construction du backend et du frontend : `frontend/.env`, non suivi par Git, existe sur le poste de développement et contient des identifiants. Vérifié : les deux fichiers passent `docker compose config` avec des valeurs factices (volume `amamestack_database_data`, chemin absolu, réseau externe, refus sans tag d'image) |
| E40 | **Nom de la zone Bunny de sauvegarde** | zone `amame-backups` (DT6, §3.3, ops/README) | constaté le 13 novembre 2026 : l'équipe a créé la zone sous le nom **`amamestoragezone`**, à Francfort. Aucun code n'écrit le nom en dur : les scripts lisent `BUNNY_BACKUP_ZONE`, qui prend cette valeur. Partout où ce rapport dit `amame-backups`, lire `amamestoragezone`. Le principe de DT6 ne change pas : cette zone ne reçoit que les sauvegardes, sa clé ne quitte pas `amame-ops`, et les fichiers du site iront dans deux autres zones à l'étape 3 (`amame-public`, `amame-private`). Le nom générique invite à s'en servir pour autre chose : ne pas le faire |
| E41 | **`common_net` est un réseau interne : un réseau de sortie par stack** | `common_net` supposé ordinaire (E39) | constaté le 14 novembre 2026 : `Internal: true`. Le DNS de Docker ne résout pas les noms extérieurs, et aucune route ne sort vers Internet. Conséquences : `amame-ops` ne joignait pas Bunny, et le site actuel n'envoie aucun e-mail. Décision : `common_net` reste le réseau qui relie les conteneurs entre eux et à Nginx Proxy Manager, et chaque stack ajoute un réseau ordinaire à elle, `sortie`, pour les seuls conteneurs qui doivent joindre Internet : `backup` et `scraper` dans `amame-ops`, `backend` dans `amamestack`. La base et le frontend n'y sont pas branchés. Au passage, le frontend ne publie plus `3000:80` : Nginx Proxy Manager joint `amame-frontend:80` par `common_net` (cible relevée le 14 novembre), et ce port ne servait pas. Sans changer `common_net`, qui appartient aussi à un autre projet (`sahel_academy_*`). Vérifié : `amame-ops`, mis à jour le 14 novembre, joint Bunny (`200`), sauvegarde et restauration réussies ; `amamestack.yml` passe `docker compose config` (réseau `amamestack_sortie`, volume `amamestack_database_data` inchangé). La sortie du backend se vérifie après la mise à jour, par l'envoi d'un e-mail (action E.10) |
| E42 | **Le nom `backend` est partagé avec un autre projet sur `common_net`** | noms de service de la stack uniques sur son réseau | constaté le 14 novembre 2026 : `nslookup backend` renvoie `amame-backend` **et** `sahel_academy_backend`. Le Nginx du frontend (`proxy_pass` vers `backend:8080`, résolu par le DNS de Docker) répartirait les appels à l'API, cookies de session compris, entre les deux. Le frontend actuel (`frontend-v7`) est sans doute déjà touché s'il vise le même nom. Décision : des **liens Docker** (`links`) dans [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml), sans toucher aux images publiées ni à l'autre projet. Le frontend a `links: [backend]` et le backend `links: [database]`. Un lien crée un alias propre au conteneur, que le DNS de Docker résout avant les noms du réseau. `database` est aujourd'hui unique : le second lien protège contre un service de ce nom ajouté plus tard. Vérifié en local, sur un réseau interne avec un « voisin » portant le même nom. Sans lien, 8 appels sur 20 partaient chez le voisin ; avec le lien, 20 sur 20 arrivent chez AMAME et une seule adresse est résolue. Même résultat pour `database`, depuis un backend branché sur deux réseaux. Les liens sont une fonction ancienne de Docker, toujours prise en charge (Docker 29). Si elle disparaissait, il faudrait viser le nom de conteneur `amame-backend` dans `frontend/nginx.conf` et `amame-database` dans `DATABASE_URL` |
| E43 | **Fermer Portainer et l'administration de Nginx Proxy Manager à Internet ne dépend pas de l'équipe** | critère de l'étape 0 : Portainer non joignable sans tunnel ou VPN (action E.1) | relevé le 16 novembre 2026 : Portainer s'ouvre par l'adresse du serveur et un port. Il est partagé avec les autres projets, comme Nginx Proxy Manager. L'équipe n'a ni SSH ni accès au panneau Contabo. Sans pare-feu de l'hébergeur, fermer un port demande de recréer le conteneur qui le publie : Portainer ne peut pas le faire pour lui-même sans risque, et toucher Nginx Proxy Manager coupe aussi les sites des autres projets. Le critère reste ouvert et passe par l'administrateur du serveur. En attendant, mesures à la portée de l'équipe : accès en HTTPS seulement, mot de passe fort et propre à chaque compte Portainer, comptes inutilisés supprimés |
| E44 | **Des données privées restent dans le navigateur après la déconnexion** | contrôle d'accès des fichiers privés et des profils côté serveur (E1, E2, E11) | constaté le 16 novembre 2026 : un compte `USER` a relu, depuis le cache HTTP du navigateur, quatre photos privées affichées plus tôt sous un compte Super Admin. Le serveur, lui, répond `403`. Deux causes dans le code, en production comme sur `main` : (1) les photos privées partent avec `Cache-Control: private, max-age=3600`, et le cache du navigateur ne distingue pas les comptes ; (2) le service worker garde 24 heures toutes les réponses `GET /api/*` authentifiées (profil, listes de l'administration) dans `api-cache`, sans tenir compte de `no-store`. Portée : un ordinateur ou un navigateur partagé, pas l'accès d'un tiers à distance. Correctif prévu : photos privées en `no-store` ; cache du service worker limité aux réponses publiques (`/api/visitor/**`) ; à la déconnexion, `Clear-Site-Data: "cache"` côté serveur et suppression d'`api-cache` côté frontend. **Confirmé en production le même jour** : `api-cache` d'un navigateur utilisé sous Super Admin contenait trois pages de `/api/admin/users`, `/api/auth/me` et `/api/user/39`, à côté des listes publiques. **Décision de l'équipe (16 novembre) : correctif `v1.1.1`**, construit sur `b14e7dd` (branche `correctif/v1.1.1`), puis reporté dans `main`. `Clear-Site-Data` abandonné : une fois les photos en `no-store` et l'API privée hors du service worker, le cache HTTP ne garde plus rien de privé, et vider tout le cache du site à chaque déconnexion n'apporterait rien de plus. En attendant le déploiement, sur un poste qui n'est pas personnel, l'administration ne s'ouvre qu'en fenêtre privée, fermée après usage. **Déployé et vérifié en production le 16 novembre** : plus d'`api-cache` dans le navigateur, photo privée en `no-store` (journal du jour). La consigne de la fenêtre privée est levée |
| E45 | **Les images de l'étape 1 portent le correctif E44** | images `v1.2` construites depuis le commit de l'étape 1 (`5c62c07`) seul (action H) | décidé le 16 novembre 2026 : le correctif `v1.1.1` est en production. Des images construites depuis `5c62c07` seul le retireraient : photos privées de nouveau gardées une heure, réponses privées de l'API de nouveau dans le cache du service worker. Les images `v1.2` sont donc construites depuis `5c62c07` plus `b548a4a`. Seul `frontend/vite.config.ts` était en conflit, résolu à l'identique de `main` (le frontend ne change pas entre les étapes 1 et 2). Les six fichiers du correctif sont identiques, octet pour octet, à ceux de `main`. La même règle vaudra pour `backend-v1.3` (étape 2) |
| E46 | **Comparaison du schéma de production par empreintes** | `pg_dump --schema-only` sur le serveur, puis `diff` avec `V1__baseline.sql` (action G.1) | décidé le 16 novembre 2026 : l'équipe n'a ni SSH ni moyen de sortir un fichier du serveur, et V1 compte 1 171 lignes. Une requête en une ligne, collée dans la console d'`amame-database`, calcule une empreinte par table : colonnes (nom, type, longueur, nullabilité, défaut, identité), contraintes, index, noms. Ces 25 lignes se comparent à l'empreinte de V1, calculée en local sur un PostgreSQL 15 neuf. Les contraintes `CHECK` des énumérations sont normalisées avant le calcul : PostgreSQL rend différemment la même liste selon qu'elle vient d'Hibernate (`ANY ((ARRAY[…])::text[])`) ou de V1 rejouée (`ANY (ARRAY[(…)::text, …])`). Vérifié en local : sans normalisation, 8 tables diffèrent pour cette seule raison ; avec, le schéma créé par `backend-v1.1.1` est identique à V1 sur les 25 tables. Une table qui diffère en production fera l'objet d'une requête de détail sur cette seule table |
| E47 | **V1 corrigée une fois, avant tout déploiement, et migration `V1_1`** | « ne jamais modifier `V1__baseline.sql` » ; V1 produite à partir des entités (E16) | relevé du 16 novembre 2026 : empreintes de production identiques à V1 pour 22 tables sur 25. Les trois écarts : (1) **`bourse`** a été créée par l'ancien scraper (`scraping_site_web_mina7.py`), non par Hibernate. Sa clé est tirée d'une séquence (`nextval('bourse_id_seq')`) et non d'une colonne d'identité. S'y ajoutent `DEFAULT CURRENT_TIMESTAMP` sur `date_scraping`, `DEFAULT 0` sur `nombres_vues`, la contrainte `bourse_url_source_key` (doublon de l'unicité d'Hibernate) et cinq index `idx_bourse_*` ; (2) **`users_role_check`** n'admet pas `VISITOR` ; (3) **`user_permission_permission_check`** n'admet pas `ADHESION_MANAGE`. Hibernate ne met jamais à jour une contrainte `CHECK` existante : en production, accorder ou retirer `ADHESION_MANAGE` est refusé par la base. Décision, conformément à l'action G.1 : V1 est corrigée pour décrire **exactement** la production. Elle n'a jamais été appliquée en production, et la baseline n'y exécutera pas V1 : la règle « ne jamais modifier V1 » vaut à partir de cette baseline ; la nouvelle migration [V1_1__enum_check_constraints.sql](../backend/src/main/resources/db/migration/V1_1__enum_check_constraints.sql) recrée les deux contraintes avec les listes du code. Elle tourne en production au premier démarrage de `backend-v1.2`, et sur toute base neuve juste après V1 (ordre de Flyway : 1 < 1.1 < 2). `bourse` reste telle quelle : une séquence vaut une colonne d'identité pour le backend, et l'ancien scraper compte sur ces valeurs par défaut. **Vérifié en local** : V1 corrigée, appliquée à un PostgreSQL 15 neuf, donne les **25 empreintes de la production à l'identique**. Après `V1_1`, `users` et `user_permission` retrouvent les empreintes du code, et `bourse` garde celles de la production. **Conséquence pour les postes de développement** : une base locale déjà passée par l'ancienne V1 refuse de démarrer (somme de contrôle de V1 changée, et `1.1` antérieure à la version courante). Il faut la recréer (`docker compose down -v`), ou lancer `flyway repair`. Toute nouvelle valeur d'une énumération stockée en base demande désormais une migration de ce type |
| E48 | **`backend-v1.2` déployé avec la limite de 768M, et non 512M** | action I.2 : supprimer `BACKEND_MEMORY_LIMIT`, retour à 512M | proposé le 16 novembre 2026. Relevé de production : `backend-v1.1.1` occupe 528 Mio de mémoire anonyme, environ 50 Mio de plus que `v1.1` dans l'essai local (482). `backend-v1.2` mesure 376 à 396 Mio en local ; en production, environ 440 à 450 Mio sont plausibles, sous 512 mais au-delà du seuil d'alerte de 460 avec peu de marge. Un dépassement tuerait le conteneur, qui redémarrerait aussitôt : coupure courte, mais répétée. Changer l'image et la limite dans la même mise à jour donnerait aussi deux causes possibles à un incident. Décision proposée : déployer `v1.2` en gardant 768M, mesurer `anon` (action J.4), puis passer à 512M par une mise à jour séparée. La mesure à 768M majore celle à 512M, puisque le tas maximal est de 30 % de la limite : sous 420 Mio à 768M, la version tient à 512M |
| E49 | **La stack de production n'est pas [amamestack.yml](../deploy/portainer/amamestack.yml)** | « Un seul fichier pour les étapes 0, 1 et 2 : seules les variables `BACKEND_IMAGE_TAG` et `FRONTEND_IMAGE_TAG` changent » | constaté le 16 novembre 2026, au premier démarrage de `backend-v1.2` en production. La version de l'équipe (15 novembre) remplace les valeurs par défaut `${VAR:-…}` par `${VAR}`. Une variable non définie dans Portainer arrive vide, et Spring ne remplace pas une valeur vide par sa valeur par défaut : `DB_POOL_MIN_IDLE` vide a empêché le démarrage. Retour aux tags `v1.1.1` fait, base inchangée (`flyway_schema_history` absente). Relevé des variables : `DB_POOL_MIN_IDLE`, `DATABASE_PASSWORD`, `COOKIE_DOMAIN` et `MAIL_DEBUG` vides. Correction : les deux premières dans les variables de la stack, vérifiées sous `v1.1.1` avant de repasser en `v1.2` (journal du 16 novembre). Proposé le 17 novembre : recoller le fichier du dépôt, par une mise à jour séparée et avant l'étape 2 (action K.4). Avec les variables de la production, seules `MAIL_DEBUG` et `STORAGE_PURGE_ENABLED` changent (de vide à `false`), et aucune des deux n'est lue par `v1.2`. À chaque étape, de nouvelles variables apparaissent : le fichier réellement en production doit être relevé avant chaque déploiement |
| E50 | **Cookies sans domaine en production depuis le 15 novembre 2026** | `COOKIE_DOMAIN=.amame.ml` en production (CLAUDE.md, action 3.1) | constaté le 16 novembre 2026 par le relevé des variables : `COOKIE_DOMAIN` est définie vide dans la stack, sans doute reprise de `.env.example`, où la valeur vide est celle du développement local. Une variable d'environnement l'emporte sur `cookie.domain=.amame.ml` du profil `prod`. Gardé tel quel au déploiement de `v1.2` : revenir à `.amame.ml` laisserait dans chaque navigateur connecté depuis le 15 novembre deux `refresh_token`, dont le backend ne lit que le premier. **Décidé le 17 novembre : cookies sans domaine, gardés.** Raisons : aucune transition ; aucun sous-domaine n'en a besoin ; avec `.amame.ml`, l'`access_token` partirait vers le CDN des médias (`media.amame.ml`, étape 3). Le profil `prod` et [amamestack.yml](../deploy/portainer/amamestack.yml) ont désormais une valeur vide par défaut. Le renouvellement lit tous les cookies `refresh_token` (dans `main`, livré avec `backend-v1.3`) : la session coupée venait d'un ancien cookie `.amame.ml` lu en premier, et ces cookies disparaissent seuls d'ici le 22 novembre (journal du 17 novembre) |
| E51 | **Une variable d'environnement vide est traitée comme absente** (`backend-v1.3` et suivants) | une valeur par défaut dans la stack pour chaque variable (`${VAR:-…}`, E49) | constaté le 17 novembre 2026 par l'essai de `v1.2` → `v1.3` avec la stack de production du même jour, qui n'a plus aucune valeur par défaut. `STORAGE_PURGE_ENABLED` arrive vide, et `backend-v1.3` refuse de démarrer (`Failed to bind properties under 'app.storage.purge.enabled'`) **après** avoir appliqué V2, V3 et V4. L'équipe garde sa version de la stack. Corrigé dans le code, une fois pour toutes les variables : [EmptyEnvironmentVariablesPostProcessor.java](../backend/src/main/java/com/example/siteamame/config/EmptyEnvironmentVariablesPostProcessor.java) retire de l'environnement de Spring toute variable vide ou faite d'espaces, ce qui applique la valeur par défaut de la configuration. Aucune variable lue par l'application ne donne à « vide » un autre sens qu'« absente ». Une variable sans valeur par défaut (`JWT_SECRET`, `DATABASE_*`) fait échouer le démarrage par un message explicite au lieu de passer vide. Les noms des variables ignorées sont écrits au démarrage. `backend-v1.2` n'a pas ce correctif : pour un retour arrière en `v1.2`, les variables qu'il lit doivent rester définies dans Portainer |
| E52 | **Réconciliation : un script d'exploitation, en mode rapport** | DT8 : tâche du backend, verrou consultatif, modes `off`, `report` et `enforce`, chaque dimanche | 17 novembre 2026 : [reconcile-bunny.sh](../ops/backup/reconcile-bunny.sh) dans `ops-v1.2`, lancé à la main avant la bascule (3.4). Raisons : il doit tourner avant la bascule, quand le backend est encore en stockage local et n'a pas les mots de passe des zones ; il reste hors du backend (limite de 512 Mo, aucun réveil de la base ajouté) ; il se contente des mots de passe en lecture seule. Bloquants : référence cassée, mauvaise zone, fichier privé en zone publique, écart de taille ou d'empreinte. Le mode `enforce` et la planification hebdomadaire sont reportés à 3.6, après plusieurs semaines de rapports |
| E53 | **Retour arrière de la bascule : un outil de rapatriement** | « Rapatrier sur le disque les objets des lignes créées depuis la bascule », sans outil | [copy-from-bunny.sh](../ops/backup/copy-from-bunny.sh) : pour chaque ligne dont le fichier manque sur le disque, lecture dans sa zone, contrôle de la taille et de l'empreinte, écriture sans jamais remplacer. Le service `backup` monte les uploads en lecture seule, sous un utilisateur sans droits : l'écriture se fait dans un conteneur ponctuel créé depuis Portainer (procédure dans [ops/README.md](../ops/README.md)). Sauvegarde après la bascule : `BACKUP_FILES_SOURCE=bunny` (DT9) |
| E54 | **Indicateur de santé de Bunny d'après le dernier appel** | « indicateur de santé Bunny placé hors de la sonde de vivacité » | `bunnyStorage` n'envoie aucune requête à Bunny pour répondre à une sonde : ni trafic ni latence ajoutés. État : inconnu avant le premier appel, `UP` après un succès (un objet absent est une réponse normale), `DOWN` après un échec. Hors de `/actuator/health/liveness` et `/readiness` |
| E55 | **Redirection de `/uploads/` commandée par `MEDIA_BASE_URL`** | redirection Nginx 301 vers le CDN (3.5) | `frontend-v1.3` : `40-runtime-config.sh` écrit au démarrage la règle de `location ^~ /uploads/` : disque si `MEDIA_BASE_URL` est vide, `return 301` vers lui sinon. `/uploads/utilisateur/` reste en 404. Aucune variable de plus, mais `MEDIA_BASE_URL` ne doit jamais désigner le site lui-même (redirection en boucle) : le critère de l'étape 1 qui proposait `https://amame.ml` est retiré. L'image porte aussi la nouvelle adresse de la page À propos |
| E56 | **V5 livrée avec l'étape 3** | une migration ultérieure valide les contraintes `NOT VALID` et rend l'empreinte obligatoire (E30) | [V5__file_metadata_required.sql](../backend/src/main/resources/db/migration/V5__file_metadata_required.sql) dans `backend-v1.4` : production à 100 % d'empreintes et sans ligne hors format le 17 novembre. La copie vers Bunny envoie l'empreinte de la base, qui doit donc exister pour chaque ligne. Conséquence : retour arrière au plus loin en `backend-v1.3` |
| E57 | **Étape 3 déployée sans attendre une semaine d'étape 2** | prérequis du §5 : étapes 0 à 2 en production depuis au moins une semaine (24 novembre) | décision de l'équipe, 17 novembre 2026 (« On le fait maintenant sans attendre le 24 »), utilisateurs prévenus. Risque accepté : un défaut de l'étape 2 encore inaperçu se mêlerait à ceux de l'étape 3. Ce qui le limite : la bascule reste séparée du déploiement (actions P, puis R, puis S), chacune avec son contrôle ; le retour arrière jusqu'à `backend-v1.3` est essayé (phase F). La zone de sauvegarde `amamestoragezone` ne sert **pas** de zone de l'application : deux zones neuves sont créées (action Q, DT6) |
| E58 | **Médias servis d'abord par `https://amamemedia.b-cdn.net`** | `MEDIA_BASE_URL=https://media.amame.ml` à la bascule (3.5) | 17 novembre 2026 : le DNS d'`amame.ml` est géré chez Jokers Hosting (serveurs `ns1` et `ns2.jokershosting.com`), auquel l'équipe n'a pas accès ; l'enregistrement `CNAME media → amamemedia.b-cdn.net` est demandé à son gestionnaire. Le plan prévoit ce repli (3.1). Sans effet sur les cookies (sans domaine, E50) ni sur les données (la base ne stocke que des clés). Passage à `media.amame.ml` plus tard par la seule variable `MEDIA_BASE_URL` ; les redirections 301 déjà mises en cache par les navigateurs pointent vers `amamemedia.b-cdn.net`, qui reste valable tant que la Pull Zone existe |
| E59 | **Neon en PostgreSQL 18** | PostgreSQL 17 ([N02 D4], §3.2, 4.1) | le projet Neon `amame-site`, créé par l'équipe le 22 septembre 2026, est en **18** (relevé du 18 novembre). La version d'un projet Neon ne se change pas : il faudrait recréer le projet. **18 retenue** après essai local le 18 novembre : suite de tests du backend sur `postgres:18-alpine` (115 tests, 0 échec, 18.7) ; essai n° 6 du transfert, identique à l'essai n° 5 en 17 (40 vérifications, 0 échec). 18 est aussi maintenue un an de plus que 17 (novembre 2030). Conséquences : `ops-v1.3` construite sur 18 (18.7) ; `db-compare.sh` ne compare plus les contraintes NOT NULL dans `pg_constraint`, où 18 les inscrit et 15 non (elles restent comparées par les colonnes) ; Flyway 10.20 (Spring Boot 3.4.5) avertit « PostgreSQL 18.7 is newer than this version of Flyway and support has not been tested », mais valide le schéma ; les migrations futures s'éprouvent en 18 (image du test de démarrage à passer en `postgres:18-alpine` après la bascule, E19) ; le retour arrière vers la base du VPS (15) passe par `psql`, sans `SET transaction_timeout` (essayé, phase G) |
| E60 | **Neon en plan Launch dès la mise en place** | plan Free au démarrage (décision du 2 octobre, §3.2, 4.1), passage à Launch selon les seuils du §6.3 | relevé du 18 novembre : le projet est en **Launch**, facturé à l'usage (aucune consommation depuis le 17 novembre). C'est le plan d'origine [N02 D2]. On applique donc dès maintenant le §6.1 « Free → Launch » : **rétention de l'historique à 7 jours** (relevé : 6 heures), toujours plus courte que la rétention de la purge (10 jours) ; **autoscaling 0,25 ↔ 1 CU** (relevé : 0,25 ↔ 8), comme [N02 §2], pour borner la facture d'un pic ; **mise en veille gardée** (5 minutes), avec le profil de pool « veille », déjà celui de la production : à revoir après la mesure du réveil à froid (4.2) et deux semaines de relevés (4.4). Les seuils du §6.3 ne décident plus d'un passage à Launch : ils servent au suivi de la consommation et du réveil à froid. Une branche de répétition consomme du calcul facturé, et non plus un quota partagé avec la production ; on la supprime toujours aussitôt. Le projet s'appelle `amame-site` et sa branche `production` (le plan disait `amame` et `main`) : aucun effet sur le code. Réglages faits par l'équipe le 18 novembre (action U) : calcul constaté ; historique à **1 jour**, voulu par l'équipe (E62) |
| E61 | **Bascule vers Neon sans attendre la semaine de stabilisation** | DT2 : au moins une semaine entre les deux bascules, soit pas avant le 25 novembre ; critères de l'étape 3 cochés avant la bascule (action W) | décision de l'équipe le 19 novembre (« on le fait dès que possible, pas besoin d'attendre le 25 » ; utilisateurs informés de la migration). La bascule (action W) suit la répétition (action V) dès qu'elle a réussi. Risque accepté : un incident survenu juste après serait plus difficile à attribuer à Bunny ou à Neon. Ce qui le limite : le transfert est vérifié par `db-compare.sh` (clés de fichiers et empreintes identiques), les deux retours arrière restent indépendants (étape 3 : une variable de stack ; étape 4 : l'ancienne base, gardée en lecture seule) et la vérification des 48 h sans 404 de l'étape 3 a lieu le 20 novembre comme prévu, quelle que soit la base. La purge (3.6) attend toujours ce dernier critère |
| E62 | **Temps de réponse à chaud : +31 ms au lieu de 20 ms au plus ; historique Neon à 1 jour** | critère du §5 (étape 4) : médiane au plus 20 ms au-dessus de la référence ; historique de 7 jours (E60, §6.1) | mesures du 19 novembre : 83,4 ms sur Neon contre 52,5 ms sur la base du VPS, aller-retour vers Neon de 5,5 ms : écart structurel (au moins trois allers-retours par appel de liste). **Décision de l'équipe** : compenser par le cache des listes publiques, `PUBLIC_LISTS_CACHE_TTL=10m` dans `amamestack` (listes servies depuis la mémoire, sans requête ni réveil de la base ; imports des scrapers et compteurs de vues visibles avec 10 minutes de retard au plus ; vidé à chaque modification d'un administrateur). Une valeur sans unité est lue en millisecondes (`10` → `PT0.01S`, vérifié sur Spring Boot 3.4.5) : toujours écrire l'unité. Actif en production le 19 novembre (`Cache des listes publiques : actif, durée PT10M`). Le critère reste non atteint pour les appels qui lisent la base ; écart accepté. **Historique Neon à 1 jour, voulu par l'équipe** : la restauration à un instant donné ne couvre que 24 heures ; au-delà, les dumps de `backup.sh` (02:30 et 14:30 UTC) limitent la perte à 12 heures au plus. Toujours plus court que la rétention de la purge (10 jours) |

**Constats hors du périmètre de l'étape 0**, à traiter ou à planifier :

| # | Constat | Gravité | Proposition |
| --- | --- | --- | --- |
| C1 | Prometheus ne peut pas lire `/actuator/prometheus` : tout `/actuator/**` exige une authentification, la collecte reçoit 401 | — | **sans objet depuis le 4 octobre** : la supervision est retirée (E14). À traiter le jour où elle revient |
| C2 | `npm run lint` plante au chargement d'une règle (ESLint 9.38 et `typescript-eslint` incompatibles) | 🟡 | aligner les versions ; aucun rapport avec la migration |
| C3 | `npx tsc --noEmit` signale 4 erreurs antérieures à ce travail (`LayoutMembre.tsx`, `LienUtileForm.tsx`, `MembreForm.tsx`, `PartenaireForm.tsx`). Le build ne lance pas `tsc`, donc il passe | 🟡 | à corriger ; les trois formulaires appellent `.find` sur une réponse paginée et ne peuvent pas fonctionner |
| C4 | `./mvnw test` exige une base PostgreSQL locale sur le port 5454 : le seul test d'intégration ne tourne pas ailleurs | — | **réglé à l'étape 1** : le test lance son propre PostgreSQL (Testcontainers). Seul Docker est nécessaire |
| C5 | `public/images/grid-image/` (6 fichiers, 2,4 Mo) n'est utilisé que par trois composants de gabarit jamais importés (`src/components/ui/images/`) | 🟡 | supprimer les composants et le dossier |
| C6 | La mise à jour du profil accepte un nouvel e-mail sans vérification, et ignore le mot de passe envoyé par le formulaire d'administration | 🟡 | à étudier séparément |
| C7 | **Un compte qui s'est déjà connecté ne peut pas être supprimé** : `DELETE /api/admin/user/{id}` échoue (500) sur la clé étrangère de `refresh_token`. Il en va sans doute de même pour un compte qui a une adhésion, une cotisation, un don ou un jeton de réinitialisation | 🟠 | **corrigé dans le dépôt le 7 novembre 2026** (migration V4, écart E28). **Constaté en production le 16 novembre 2026** (journal du backend, clé étrangère de `refresh_token`) : jusqu'au déploiement de l'étape 2, aucun compte qui s'est déjà connecté ne peut être supprimé depuis l'administration. Correction à constater en production après l'étape 2 (action N.5) |
| C8 | **La création d'une filière par l'API échoue toujours** (500) : `FiliereController.ajouterFiliere` lit la filière avec `@RequestParam` au lieu de `@RequestPart`. La modification fonctionne | 🟠 | **corrigé dans le dépôt le 8 novembre 2026** (écart E37) ; à constater en production (action N.6) |
| C9 | Toute adresse inconnue du backend renvoie 500 au lieu de 404 : le gestionnaire d'erreurs générique intercepte aussi « ressource introuvable » | 🟡 | **corrigé dans le dépôt le 7 novembre 2026** (écart E36) |
| C10 | `/actuator/health` ouvre une connexion SMTP à chaque appel et passe à `DOWN` si Gmail ne répond pas | 🟡 | n'interroger que `/actuator/health/liveness` et `/actuator/health/readiness`, qui n'en dépendent pas ; ou désactiver l'indicateur `mail` |
| C11 | Une requête mal formée renvoie `500` au lieu d'une erreur `4xx`, avec le message de l'exception dans la réponse. Exemples : partie `user` absente de l'inscription, JSON illisible, méthode non permise. `GlobalHandlerException.handleGlobalException` intercepte aussi les exceptions de Spring MVC, qui portent pourtant leur propre statut. Constaté en production le 16 novembre 2026 (inscription sans partie `user`). Même code dans `main`, où C9 n'a traité que `NoResourceFoundException` | 🟡 | dans le gestionnaire générique, reprendre le statut des exceptions qui implémentent `ErrorResponse` (400, 405, 415…) ; pour un vrai `500`, ne plus renvoyer `ex.getMessage()` au client, seulement le journaliser. À faire dans `main`, pas de correctif dédié |
| C12 | **Après chaque déploiement, une page ouverte avant la mise à jour peut ne plus charger une section.** Les sections (administration, espace membre…) sont des fichiers JavaScript chargés à la demande, dont le nom change à chaque construction. Un onglet resté ouvert demande l'ancien nom, et Nginx répond `404`. La section ne s'affiche qu'après un rechargement de la page. Constaté en production le 16 novembre 2026 (`LayoutAdmin-B8YmbZu6.js`, juste après le passage en `v1.1.1`). Même code dans `main` | 🟡 | intercepter l'événement `vite:preloadError` et recharger la page une seule fois (garde en `sessionStorage` contre une boucle). À faire dans `main` avant les déploiements des étapes 1 à 4 |
| C13 | **La modification d'un article envoyée sans `tags` répond `500` après avoir été enregistrée** (`failed to lazily initialize a collection … Article.tags … no Session`). Le mapper mettait dans la réponse la collection de l'entité, non chargée, que Jackson lit après la fermeture de la session (`open-in-view` désactivé depuis l'étape 1). Le formulaire d'administration envoie toujours `tags` : la production n'est pas touchée par l'interface. Constaté le 17 novembre 2026 par l'essai de l'étape 2, dans `v1.3` et dans `v1.2` | 🟡 | corrigé dans `main` pour `backend-v1.3` : `ArticleMapper.convertToDTO` copie les tags dans la transaction ; [ArticleMapperTest.java](../backend/src/test/java/com/example/siteamame/mapper/ArticleMapperTest.java) |
| C14 | **Dans un navigateur où le site est déjà installé, ouvrir directement une adresse `/uploads/…` affiche l'application, pas le fichier.** Le service worker répond à toute navigation par `index.html` (`NavigationRoute` sans liste d'exclusion, `frontend/dist/sw.js`). Les images affichées dans les pages ne sont pas concernées : ce ne sont pas des navigations. Antérieur à la migration (même chose en stockage local) ; après la bascule, ces navigateurs ne suivent pas la redirection 301 vers le CDN. Constaté le 17 novembre 2026 en préparant l'étape 3 | 🟡 | **corrigé dans `frontend-v1.3`** (17 novembre, avec l'accord de l'équipe) : `navigateFallbackDenylist: [/^\/uploads\//, /^\/api\//]` dans `vite.config.ts`. Concerne aussi un fichier privé ouvert dans un onglet (`/api/user/files/…`). Le nouveau service worker remplace l'ancien à la première visite qui suit le déploiement : constater la redirection (action T) en navigation privée ou avec `curl -I` |
| C15 | **Un échec d'envoi vers Bunny apparaît comme « Transaction silently rolled back because it has been marked as rollback-only »**, et sa cause n'est écrite nulle part. Les services d'upload sont en `@Transactional(rollbackFor = Exception.class)`, mais les méthodes des contrôleurs portent aussi `@Transactional`, sans `rollbackFor` : sur une `IOException`, le contrôleur tente de valider une transaction déjà marquée à annuler. `BunnyStorageClient` ne journalise pas un refus (`401`, `404`…), et `show-details=never` masque l'indicateur `bunnyStorage`. Le masquage est antérieur à l'étape 3 (même chose en stockage local) ; révélé le 18 novembre 2026 par l'incident des mots de passe en lecture seule | 🟡 | correctif `backend-v1.4.1`, avec l'accord de l'équipe : journaliser chaque échec d'appel à Bunny (opération, zone, clé, code HTTP, jamais le mot de passe) ; retirer `@Transactional` des méthodes de contrôleur qui délèguent à un service transactionnel, ou leur donner `rollbackFor = Exception.class` |
| C16 | **Les dumps de la base postérieurs au 16 novembre ne se restaurent pas tels quels.** Des colonnes de production portent une option `pg_attver=<nombre>` (`pg_attribute.attoptions`) : `file_entity.file_sha256`, toutes celles de `flyway_schema_history` et de `storage_purge_queue`. `pg_dump` la recopie, et un PostgreSQL 15 ordinaire la refuse (« unrecognized parameter "pg_attver" ») : `file_entity`, l'historique Flyway et la file de purge manquent à la restauration. Constaté le 18 novembre 2026 par `restore-test.sh`. **Cause** : PostgreSQL **15.20** (publiée le 12 novembre 2026) corrige CVE-2026-6460 par un « versionnement des attributs » (commit `c23382f0`, « Introduce attribute versioning to prevent unsafe deforming », rétroporté jusqu'à 14) : toute colonne créée ou modifiée reçoit `pg_attver` dans `attoptions`. La base de production est en 15.20 (image `postgres:15-alpine` retirée à une mise à jour de stack avec *Re-pull image*) ; l'image `ops-v1.2` est en **15.19** (`pg_dump`, `pg_restore` et serveur de test). Texte du commit : « Dumps of a server with this change, made by a pg_dump without it, contain ALTER COLUMN … SET (pg_attver = …), which servers without this change reject » ; sur un serveur qui a le correctif, ce `SET` est ignoré. Diagnostic du 18 novembre (lecture seule) : aucun déclencheur d'évènement, aucune bibliothèque préchargée, seule extension `plpgsql`, seul compte `postgres` ; 18 colonnes marquées, toutes créées depuis le passage en 15.20 | ✅ | **réglé le 18 novembre** : `restore-test.sh` réussi en production avec `ops-v1.2.1` (11:16 UTC). **Les dumps sont intacts** : ils se restaurent sur un serveur ≥ 15.20, donc aussi sur la production. Correctif : image `ops-v1.2.1` (même code, `postgres:15-alpine` en 15.20), **essayée en local le 18 novembre** (9 vérifications : un dump fait par 15.19 et un fait par 15.20, tous deux restaurés), **publiée le 18 novembre** (`a590e48`) ; reste `restore-test.sh` en production avec elle. Ensuite : ne jamais revenir à une version mineure de PostgreSQL antérieure à 15.20 (avertissement du commit) ; reconstruire l'image `ops` à chaque changement de version mineure de la base ; étape 4 : Neon et le `pg_dump` employé doivent porter le même correctif. Purge (3.6) suspendue jusqu'à une restauration complète constatée |
| C17 | **La ligne `SPRING_DATASOURCE_PASSWORD` de la stack ferait échouer la bascule vers Neon.** Elle ne servait qu'à `backend-v1.1`, mais Spring la fait passer avant `spring.datasource.password=${DATABASE_PASSWORD}` : le backend présente sa valeur, celle de l'ancienne base. Dans la version de la stack de l'équipe, elle vaut `${POSTGRES_PASSWORD}` : sur Neon, `amame_app` serait refusé (« password authentication failed »), alors que Flyway, qui lit `DATABASE_MIGRATION_*`, passe. Constaté le 18 novembre 2026 par l'essai local de l'étape 4 | 🟡 | retirée de [amamestack.yml](../deploy/portainer/amamestack.yml) le 18 novembre (le retour en `v1.1` est impossible depuis V5) ; à retirer de la stack de l'équipe **après avoir vérifié que `DATABASE_PASSWORD` y est définie**, au plus tard à la bascule (action W.5) |
| C18 | **Avec `sslrootcert=system`, les scrapers ne pourraient pas se connecter à Neon.** La bibliothèque `libpq` 17.9 que `psycopg2-binary` 2.9.12 embarque dans `scraper-v1.1` ne trouve pas les certificats du système : « SSL error: certificate verify failed ». L'image `ops-v1.3` (libpq d'Alpine) les trouve. Constaté le 18 novembre 2026 en local, par une connexion au proxy de Neon avec un point d'accès et un compte fictifs : quand la vérification TLS passe, Neon ne refuse que le mot de passe | 🟡 | suffixe `?sslmode=verify-full&sslrootcert=/etc/ssl/certs/ca-certificates.crt` pour toutes les URL `postgresql://` (scrapers et sauvegardes), vérifié pour les deux images ; aucune image à reconstruire. Même essai pour le backend : `sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory` vérifie le certificat (sans `sslfactory` : « Could not open SSL root certificate file »). Les deux clients refusent un nom d'hôte qui ne correspond pas au certificat (connexion par l'adresse IP du proxy). Documenté dans [.env.example](../.env.example), [ops/README.md](../ops/README.md) et les actions V et W |

### Notes pour les étapes suivantes

Ce qui a été anticipé, et ce qu'il ne faudra pas oublier.

- **Étape 1 (relevé du 14 novembre).** Nginx Proxy Manager a *Cache Assets* activé sur `amame.ml`. Avec cette option, il met en cache, pendant 30 minutes, tout ce qui finit par `.js`, `.css` ou une extension d'image. Il ignore et retire le `Cache-Control` du site, et pose sa propre date d'expiration.
  - Les fichiers de l'application portent une empreinte dans leur nom : aucun effet.
  - Pour `/config.js` (servi en `no-store`, action J) et `/sw.js`, en revanche, un changement de `MEDIA_BASE_URL` ou une nouvelle version mettraient du temps à arriver chez les visiteurs.
  - À vérifier au déploiement de l'étape 1 : relire les en-têtes de `/config.js` à travers `https://amame.ml`. S'ils ne sont pas `no-store`, désactiver *Cache Assets*, ou exclure ces deux fichiers par une *Custom location*.
- **Toutes les étapes (relevé du 14 novembre).** `common_net` est interne : un conteneur qui doit joindre Internet (Gmail, Bunny, sites des scrapers, et Neon à l'étape 4) doit aussi être branché sur un réseau ordinaire de sa stack (E41). À l'étape 3, le backend écrira dans Bunny par ce réseau `sortie`, déjà en place.

- **Étape 2, livrée dans le dépôt le 7 novembre 2026.** [SiteAmameApplicationTests.java](../backend/src/test/java/com/example/siteamame/SiteAmameApplicationTests.java) attend désormais « version 4, 26 tables ». Toute nouvelle migration change ces deux nombres.
- **Avant l'étape 3 : migration V5** (E30). Une fois `backfill-sha256.sh` passé en production avec 0 ligne sans empreinte et l'inventaire conforme : `VALIDATE CONSTRAINT` des trois contraintes `NOT VALID` de V2, puis `file_sha256` en `NOT NULL`. Elle échoue si une ligne ne respecte pas une contrainte : la faire précéder d'un nouvel `inventory.sh`.
- **Étape 3.** L'implémentation Bunny de `FileStorageService` doit : appeler `UploadCompensation.deleteOnRollback(key, this)` juste après l'envoi ; envoyer l'en-tête `Checksum` avec `ValidatedFile.sha256()` en majuscules (comme `bunny_put` dans [lib.sh](../ops/backup/lib.sh)) ; rendre `delete(key)` idempotent (404 = succès) ; refuser toute clé hors de `uploads/`. La tâche de purge n'a rien à changer : elle appelle `delete(key)`. L'activer (`STORAGE_PURGE_ENABLED=true`) à l'étape 3.6 seulement.
- **Étape 3.** `inventory.sh` compare la base au dossier monté ; à l'étape 3, il devra comparer la base aux zones Bunny (même logique, listing par l'API, mots de passe en lecture seule). La catégorie « fichier en attente de purge » vient de `storage_purge_queue`.
- **Étape 6.** Le retrait des objets privés de la sauvegarde, 30 jours après leur purge (DT9), lit `storage_purge_queue` : `purged_at`, conservé 60 jours.
- **Étape 3.** Ajouter `bunny` aux fournisseurs connus de [StorageConfig.java](../backend/src/main/java/com/example/siteamame/config/StorageConfig.java) : toute autre valeur de `STORAGE_PROVIDER` arrête déjà le démarrage avec un message. Le service de fichiers de Spring (`/uploads/**`) se désactive seul hors du mode local. La copie des fichiers de `backup.sh` lit aujourd'hui le dossier monté : elle devra lire les zones Bunny avec leurs mots de passe en lecture seule. Corriger C9 avant de surveiller les 404.
- **Étape 3.** Mémoire : le client HTTP de Bunny et l'envoi de fichiers de 10 Mo demandent une nouvelle mesure, **sur le conteneur** (`docker stats`, `memory.stat`), pas sur les chiffres de la JVM (E22). Envoyer et lire par blocs, comme `StorageIo`.
- **Étape 4.** Le projet Neon existe depuis le 13 novembre, avec des noms et un point d'accès qui diffèrent du plan (faits relevés, « Projet Neon ») : réinitialiser d'abord le mot de passe exposé, créer la base `amame_db` et les quatre rôles prévus, utiliser le point d'accès direct (sans `-pooler`) pour Flyway et les sauvegardes, et relever la version de PostgreSQL avant de fixer `OPS_PG_MAJOR`.
- **Étape 4.** Reconstruire l'image d'exploitation avec `OPS_PG_MAJOR=18` (la version du projet Neon, E59 ; 17 était prévu) : `pg_dump` refuse une base plus récente que lui. Passer l'image du test de démarrage à `postgres:18-alpine` (E19). Renseigner les cinq variables `DATABASE_*` ; les valeurs par défaut du compose, liées à `POSTGRES_PASSWORD`, disparaissent avec la base locale à l'étape 6. Le profil de pool « veille » est déjà celui de la production depuis l'étape 1.
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

**Fait.** À la demande de l'équipe, la création d'une filière est corrigée (écart E37), dans le code de l'étape 2, alors non commité. Fichiers : [FiliereController.java](../backend/src/main/java/com/example/siteamame/controller/FiliereController.java) (`@RequestParam` remplacé par `@RequestPart` sur la partie `filiere`), [FiliereControllerTest.java](../backend/src/test/java/com/example/siteamame/controller/FiliereControllerTest.java) (nouveau). Le frontend envoie déjà la filière en partie JSON (`orientationService.ts`) : il ne change pas.

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

**Git (action A.2), à la demande de l'équipe.** Vérifié d'abord : `origin/main` toujours sur `f5252df` après `git fetch`, rien d'indexé, `main` ancêtre de `sauvegarde/etape-1`. Le contenu du futur commit a été prévisualisé par un index temporaire (56 fichiers, aucun `.env`, aucun upload), et les lignes ajoutées ont été parcourues à la recherche d'un secret écrit en dur : aucun. Puis `git reset sauvegarde/etape-1` (avance de `main`, sans toucher au disque), `git add -A` et commit `7466a23`. Arbre de travail propre ensuite ; `backend/uploads/` toujours présent sur le disque et hors du suivi. Ensuite, une fois confirmé par l'équipe que la production se déploie par Docker Hub et non par Git : `git push` (`f5252df..ba50a0a`, avance simple) et suppression des branches `sauvegarde/etape-0` et `sauvegarde/etape-1`.

#### 9 novembre 2026 — production relevée, fichiers de stack de production

**Constaté.** La stack de production n'est pas celle que supposait le plan (E38). Faits transmis par l'équipe ou relevés de l'extérieur : stack `amamestack` (n° 64), réseau externe partagé `common_net`, Nginx Proxy Manager en conteneur sur le même hôte, uploads dans `/data/compose/64/backend/uploads`, volume `amamestack_database_data`, aucun accès SSH. Point de restauration manuel de la base : `pg_dump -Fc` (219 Ko) dans le volume de la base. Détail dans les faits relevés.

**Fait.**

- [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) et [deploy/portainer/amame-ops.yml](../deploy/portainer/amame-ops.yml), nouveaux : les stacks à coller dans Portainer (E39).
- `backend/.dockerignore` et `frontend/.dockerignore` : `.env` et `.env.*` exclus du contexte de construction.
- [.env.example](../.env.example) : variables propres à la production (`UPLOADS_HOST_PATH` dans les deux stacks, `BACKEND_MEMORY_LIMIT`), base désignée par `amame-database`.
- [ops/README.md](../ops/README.md) : construction par `docker build`, stack collée depuis le fichier de production, valeurs du serveur.
- Ce suivi : actions D, E, F, H, I, K, L, M et retours arrière des étapes 0 et 1, réécrits pour le serveur réel ; l'ordre de E place la première sauvegarde de `amame-ops` avant la mise à jour de l'application, et la rotation des secrets au moment de cette mise à jour.

Le `docker-compose.yml` de développement et `ops/docker-compose.yml` ne changent pas.

**Vérifié en local.** `docker compose config` sur les deux fichiers, avec des valeurs factices : interpolation acceptée, valeurs par défaut imbriquées comprises ; volume nommé `amamestack_database_data` ; uploads montés depuis le chemin absolu dans le backend et le frontend ; réseau `common_net` externe ; limite mémoire de 768M prise en compte ; refus explicite sans `BACKEND_IMAGE_TAG`. Variables lues par `backend-v1.1` contrôlées dans son `application-prod.properties` : URL et compte de la base écrits en dur (`database`, `postgres`), mot de passe par `SPRING_DATASOURCE_PASSWORD`, `ddl-auto=update`.

**Non vérifié.** Rien n'a tourné sur le serveur. La version de Compose de Portainer (valeurs par défaut imbriquées) n'est pas connue : la parade est décrite à l'action E.8. La cible de Nginx Proxy Manager et la liste complète des conteneurs de `common_net` restent à relever. Aucune image n'est construite : Docker Desktop n'était pas démarré.

#### 13 novembre 2026 — zone de sauvegarde créée, images de l'étape 0 publiées, stack `amame-ops` créée

**Constaté.** L'équipe a créé la zone Bunny de sauvegarde sous le nom `amamestoragezone`, à Francfort (écart E40), et le projet Neon (faits relevés, ligne « Projet Neon » ; rien à en faire avant l'étape 4).

**Fait.**

- Action C.1 close : nom de la zone reporté dans ce suivi (C.1, E.3, faits relevés, tableau de l'étape 0) et dans [ops/README.md](../ops/README.md) ; écart E40.
- Action D : les quatre images construites par `docker build`, puis publiées sur Docker Hub (empreintes à l'action D).
  - `backend-v1.1` et `frontend-v1.1` viennent d'un dossier de travail Git propre au commit `b14e7dd`, créé dans un dossier temporaire puis supprimé.
  - `ops-v1.1` (`PG_MAJOR=15`) et `scraper-v1.1` viennent de `main` (`ba50a0a`). Leurs Dockerfiles ne copient que des fichiers nommés, tous suivis par Git et sans modification locale.
  - Chaque image porte son commit dans l'étiquette `org.opencontainers.image.revision`.
  - La première construction du backend a échoué sur une coupure réseau pendant le téléchargement d'un plugin Maven ; la deuxième a réussi.
- Aucun fichier du code n'a changé.
- Action E.2 faite par l'équipe, puis E.3 commencée : stack `amame-ops` créée, planificateur démarré.
- Premier `backup.sh` en échec : le conteneur ne résout pas `storage.bunnycdn.com`. Rien n'a été envoyé ; l'échec est survenu avant le dump.
  - Cause : le DNS par défaut des conteneurs ne fonctionne pas sur ce serveur. Le backend contourne ce problème depuis juin avec des serveurs DNS explicites, et je n'avais pas reporté ce réglage dans `amame-ops`.
  - Correction : `dns: [8.8.8.8, 1.1.1.1]` sur les services `backup` et `scraper`, dans [deploy/portainer/amame-ops.yml](../deploy/portainer/amame-ops.yml) et [ops/docker-compose.yml](../ops/docker-compose.yml).
  - **14 novembre** : même échec avec cette correction. Le diagnostic, lancé par l'équipe dans la console, a montré que la cause n'était pas le DNS : `common_net` n'a pas de route vers Internet (faits relevés). Les serveurs DNS explicites restent, sans dommage.
  - Les services `backup` et `scraper` sont désormais branchés aussi sur un réseau ordinaire propre à la stack, `sortie` (`amame-ops_sortie`), dans les deux mêmes fichiers. `common_net` sert toujours à joindre `amame-database`.
  - [ops/README.md](../ops/README.md) explique ce réseau.

**Vérifié en local, avant la publication.**

- Aucun des quatre tags n'existait sur Docker Hub : rien n'a été écrasé.
- Les quatre images sont en `linux/amd64`. Elles ne contiennent aucun fichier `.env`, aucune clé ni aucun upload ; les seuls `.pem` sont les certificats publics du système.
- Le jar du backend ne contient que les trois `application*.properties` du commit. Son profil `prod` lit les secrets dans l'environnement : URL `database`, compte `postgres`, `ddl-auto=update`, cookies `.amame.ml`.
- La configuration Nginx du frontend est valide (`nginx -t`) et renvoie 404 sur `/uploads/utilisateur/` et `/amame-uploads/utilisateur/`.
- L'image d'exploitation embarque `pg_dump` 15.19, ses 9 scripts sans fin de ligne Windows, et tourne sans root (`postgres`).
- Après la publication, les quatre empreintes ont été relues sur Docker Hub.
- Correction DNS : les deux fichiers d'`amame-ops` passent `docker compose config`.
- Essai sur un réseau Docker jetable, avec l'image `ops-v1.1` et les mêmes serveurs DNS :
  - le DNS interne reste en place (`127.0.0.11`) ;
  - un conteneur voisin est trouvé par son nom ;
  - `storage.bunnycdn.com` est résolu et répond en HTTPS (200).

  Cet essai ne reproduisait pas le serveur : le réseau local n'est pas interne. Le second réseau, lui, est seulement validé par `docker compose config` (réseau `amame-ops_sortie` créé, deux services branchés sur les deux réseaux). La route par défaut qu'il doit apporter n'a pas pu être essayée en local, Docker Desktop étant arrêté : elle se vérifie sur le serveur, par `backup.sh`.

**Non vérifié.** Aucune image n'a démarré : le backend `b14e7dd` avait été vérifié en local le 3 octobre, et la construction repart du même commit. Rien n'a tourné sur le serveur. Restent à relever : la cible de Nginx Proxy Manager, les autres conteneurs de `common_net`, la copie de la stack actuelle.

#### 14 novembre 2026 — première sauvegarde et restauration réussies, `common_net` interne

**Constaté.**

- Dans la console de `amame-ops-backup`, `common_net` ne sort pas vers Internet : `Network unreachable`.
- Portainer confirme `Internal: true` pour ce réseau.
- Le backend actuel ne résout pas `smtp.gmail.com` : le site n'envoie aucun e-mail.
- Nginx Proxy Manager envoie `amame.ml` vers `amame-frontend:80`.
- Le réseau compte aussi deux conteneurs d'un autre projet, `sahel_academy_*`.
- La phrase de chiffrement est rangée hors du serveur.
- L'équipe a transmis le contenu de la stack actuelle, sans ses secrets.

Détail dans les faits relevés.

**Fait.**

- `amame-ops` : second réseau `sortie`. Stack mise à jour par l'équipe, puis `backup.sh` (29 fichiers, dump de 224 Ko) et `restore-test.sh` réussis.
- Deux critères de sortie de l'étape 0 cochés.
- [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) : réseau `sortie` pour le backend ; port `3000:80` du frontend retiré (E41).
- [ops/README.md](../ops/README.md) : note sur le réseau de sortie.

- Ensuite, dans la console de `amame-ops-backup` : le port 587 sort vers Gmail (`220 smtp.gmail.com ESMTP`) ; `database` désigne un seul conteneur, mais **`backend` en désigne deux**, dont celui de l'autre projet. Les liens Docker sont ajoutés à `amamestack.yml` (E42). *Custom locations* de Nginx Proxy Manager : vide.
- Action F : deux vérifications ajoutées après la mise à jour (`nslookup backend` depuis le frontend, `getent hosts smtp.gmail.com` depuis le backend).
- [deploy/portainer/amamestack.env.example](../deploy/portainer/amamestack.env.example) et [deploy/portainer/amame-ops.env.example](../deploy/portainer/amame-ops.env.example), nouveaux : variables de chaque stack, sans secret, prêtes à remplir. Le `.env.example` de la racine avertit qu'il ne se charge pas dans Portainer.

**Vérifié en local.**

- `docker compose config` des trois fichiers de stack : réseaux, liens, volume `amamestack_database_data` inchangé, refus sans tag d'image.
- Essais sur un réseau Docker **interne** jetable, avec l'image `frontend-v1.1` publiée et un « voisin » portant les mêmes noms :
  - sans lien, 8 appels `/api/` sur 20 passent par le Nginx du frontend chez le voisin ; avec `links: [backend]`, 20 sur 20 arrivent chez AMAME ;
  - le lien `database` d'un backend branché sur deux réseaux ne résout que la base d'AMAME, alors qu'un conteneur sans lien voit les deux ;
  - un conteneur branché sur le réseau interne et sur un réseau ordinaire joint `smtp.gmail.com:587` ; branché sur le réseau interne seul, il n'a pas de route.

**Non vérifié.** Rien n'a encore tourné sur le serveur avec `amamestack.yml` : les vérifications de l'action F le constateront.

#### 15 novembre 2026 — mise à jour d'`amamestack` refusée par Portainer (YAML)

**Constaté.**

- Portainer refuse le contenu collé : `YAMLSyntaxError: Document contains trailing content not separated by a ... or --- line`. Un refus de ce type ne change aucun conteneur.
- La version transmise par l'équipe différait du fichier du dépôt :
  - en-tête de commentaires retiré ;
  - la plupart des valeurs par défaut `${VAR:-…}` remplacées par `${VAR}`, entre autres `FRONTEND`, `COOKIE_*`, `JWT_EXPIRATION`, `MAIL_HOST`, `POSTGRES_USER` et `POSTGRES_DB` ;
  - plus de refus explicite sans tag d'image.

**Vérifié en local.**

- Le fichier du dépôt et la version transmise sont tous deux du YAML valide pour `yaml` 1.10.2, `yaml` 2.6.0 et `js-yaml` 4.1.0.
- Parmi douze défauts de collage essayés, seule une ligne de texte placée **avant** `services:` produit exactement ce message. Une ligne de trop à la fin, un contenu en double ou une clôture Markdown donnent d'autres messages.
- En local, ce message vient d'une ligne présente au-dessus de `services:`, par exemple les 9 lignes de `amamestack.env.example` placées avant le YAML. L'action E.8 précise où saisir les variables.

**Constaté ensuite.**

- Cause donnée par l'équipe : un doublon dans le fichier `.env` des variables. Une fois le doublon retiré, l'erreur YAML a disparu. Cela corrige une lecture précédente de ce suivi, qui attribuait l'erreur à des variables collées dans l'éditeur.
- Nouveau clic sur *Update the stack* : `Failure` — `Network Error`. Le navigateur n'a pas reçu la réponse de Portainer.

- Précisé par l'équipe : le message apparaît **aussitôt** après le clic, et aucun conteneur n'est créé. La production n'a donc pas changé. La requête de mise à jour n'aboutit pas : soit quelque chose entre le navigateur et Portainer la coupe, soit Portainer échoue en la traitant. La mise à jour d'`amame-ops`, le 14 novembre, était passée par le même bouton.
- Conséquence : l'action E.7 (mot de passe de la base) attend que la mise à jour passe.

**Non vérifié.** Diagnostic demandé à l'équipe :

- statut de la requête en échec dans l'onglet *Network* des outils du navigateur (F12), sans ouvrir son contenu, qui porte les secrets ;
- heure de démarrage et journal du conteneur Portainer au moment du clic ;
- adresse d'accès à Portainer (adresse et port, ou nom passant par Nginx Proxy Manager) et version de Portainer ;
- mot de passe de la base déjà changé ou non.

**Constaté ensuite par l'équipe.**

- La mise à jour d'`amamestack` est passée. Les conteneurs ont été recréés, le site est accessible et les données sont présentes.
- `Network Error` : il a suffi de recharger la page de Portainer dans le navigateur.
- Le mot de passe de la base **n'a pas été changé** (action E.7) : la stack tourne avec le mot de passe actuel, et `amame-ops` reste valable sans l'action E.9. Le critère « Secrets changés » attend ce changement.
- Vérifications de l'action F faites (détail dans l'action F). Le test des fichiers privés avec un nom inventé ne prouve rien : refait avec un fichier réel (action F).
- `JWT_SECRET` et `MAIL_PASSWORD` sont des valeurs neuves (déclaré par l'équipe).
- Fichiers privés retestés avec un fichier réel, en fenêtre privée : 404 par `/uploads/` et par `/amame-uploads/`. Critère coché.
- Mot de passe de la base changé (actions E.7 puis E.9, stack `amamestack` remise à jour avec lui) ; `backup.sh` réussi ensuite.
- E-mail « mot de passe oublié » reçu, et réinitialisation réussie : l'envoi SMTP par le réseau `sortie` fonctionne (E41). L'inscription fonctionne aussi. Ancien mot de passe d'application Gmail révoqué ensuite (action E.10 faite).
- Critères « Secrets changés » et « inscription avec `role=SUPERADMIN` » constatés et cochés.
- Critère « profil et fichiers d'un autre » : d'abord déclaré réussi. La sortie de la console, transmise ensuite, montre `401` sur `/api/auth/me` puis sur chaque appel : le navigateur n'était pas connecté (pas de session, ou jeton d'accès de 15 minutes expiré, que `fetch` ne renouvelle pas, contrairement au site). Critère non coché ; essai à refaire avec un script qui renouvelle la session et s'arrête s'il n'est pas connecté en `USER`. L'étape 0 en est à 5 critères sur 8.
- Limite de débit à l'inscription : 10 requêtes vides rapprochées donnent 6 × `400` (formulaire refusé, aucun compte créé), puis `429`. Conforme à `rate=5r/m burst=5`. L'adresse enregistrée dans le journal d'`amame-frontend` reste à relever (relevée le 16 novembre : celle du visiteur, voir le journal de ce jour).
- Restent, pour l'étape 0 : l'adresse du journal (action F) ; l'essai d'accès, à refaire ; le poids de l'accueil ; Portainer et l'administration de Nginx Proxy Manager non joignables depuis Internet (action E.1).
- Leçon : cocher un critère sur la sortie transmise, pas sur un « oui ».

#### 16 novembre 2026 — essai d'accès aux données d'un autre utilisateur, refait connecté

**Constaté** (sortie de la console transmise par l'équipe).

- Le script a vérifié la session avant de commencer : connecté en compte `39`, rôle `USER`.
- Profils : `GET /api/user/{id}` pour les identifiants 1 à 200 donne `403` partout, sauf pour le profil `39`. Conforme.
- Fichiers : `GET /api/user/files/{id}` donne `403` ou `404`, sauf pour **quatre fichiers lisibles : 5, 7, 12 et 13**.

**Lecture du code** (`backend-v1.1`, `PrivateFileController`). Un fichier privé n'est rendu qu'à son propriétaire, d'après la table `users_files`, ou à un titulaire de `USER_READ_ALL`. Le compte 39 n'a pas `USER_READ_ALL` : sinon, les autres profils lui seraient lisibles. Ces quatre fichiers sont donc rattachés au compte 39 dans `users_files`, où chaque fichier n'a qu'un seul propriétaire (`UNIQUE (files_id)`).

**Non vérifié.** On ne sait pas encore si le compte 39 est le compte de test, créé sans fichier, ou un compte réel qui possède ces fichiers. Requêtes demandées à l'équipe dans la console d'`amame-database`, sans donnée personnelle en sortie : fichiers rattachés au compte 39, et propriétaire des fichiers 5, 7, 12 et 13. Le critère reste décoché jusqu'à ce résultat. Si les quatre fichiers ne sont pas ceux du compte 39, c'est une fuite, à traiter avant toute autre action.

**Constaté ensuite** (requêtes transmises).

- Le compte 39 est bien le compte de test, et il ne possède **aucun** fichier (`{NULL}`).
- Les fichiers 5, 7, 12 et 13 appartiennent aux comptes 1, 2, 12 et 13.
- Un compte `USER` a donc obtenu `200` sur les fichiers de quatre autres comptes.

**Hypothèse, non vérifiée** : le cache HTTP du navigateur, et non le serveur.

- Le code refuse ces fichiers au compte 39, puisque `existsByIdAndFiles_Id(39, …)` est faux. Aucune autre route ne répond sur `/api/user/files/`, et le service worker n'y touche pas (`NetworkOnly`).
- Mais une **photo** privée part avec `Cache-Control: private, max-age=3600` (`PrivateFileController`, même code sur `main`). Le navigateur la garde une heure sous son URL, quel que soit le compte connecté.
- Si ce navigateur avait affiché ces photos plus tôt, sous un compte administrateur, un `fetch` les ressert depuis son cache sans interroger le serveur.

**Vérification demandée** : relancer la lecture de ces quatre fichiers avec et sans cache (`cache: 'no-store'`), et relever le type de ces fichiers dans `file_entity`. Si les réponses sans cache sont `403`, le serveur est sain. Reste alors un défaut de moindre portée, à corriger dans le code : sur un ordinateur partagé, une photo privée vue par un compte reste lisible par le compte suivant, pendant une heure, dans le même navigateur. Correctif envisagé : `no-store` ou `private, no-cache` pour les photos privées, et `Clear-Site-Data: "cache"` à la déconnexion. Si une réponse sans cache est `200`, la fuite vient du serveur : à traiter avant toute autre action.

**Constaté ensuite** (sortie transmise) : connecté en `39 USER`, pour les fichiers 5, 7, 12 et 13, `normal 200 / sans cache 403` à chaque fois. Les quatre sont de type `IMAGE`. Le navigateur avait servi plus tôt sous le compte Super Admin. **Hypothèse confirmée : le serveur refuse, les `200` venaient du cache HTTP du navigateur.** Critère coché côté serveur.

**Vérifié dans le code** (`backend-v1.1` et `main`), un second point du même ordre. Le service worker garde dans son cache `api-cache` toutes les réponses `GET /api/*`, sauf les fichiers privés : profil connecté (`/api/auth/me`), listes de l'administration, adhésions… Il les garde 24 heures (50 entrées, règle `NetworkFirst` de [frontend/vite.config.ts](../frontend/vite.config.ts)). Workbox ne tient pas compte du `Cache-Control: no-store` posé par Nginx sur `/api/`. Après une déconnexion, ces réponses restent lisibles dans le navigateur (outils de développement → *Application* → *Cache storage*), et le service worker les ressert hors ligne. Voir E44.

**Constaté ensuite.**

- Dans le navigateur utilisé sous Super Admin, `api-cache` contient `/api/admin/users` (pages 1 à 3), `/api/auth/me`, `/api/user/39` et les listes publiques `/api/visitor/…`. Second point confirmé en production.
- Accès à Portainer en HTTPS (déclaré par l'équipe).
- Décision de l'équipe : correctif `v1.1.1` (option A).

#### 16 novembre 2026 — correctif `v1.1.1` : rien de privé dans le cache du navigateur (E44)

**Fait.**

- Branche locale `correctif/v1.1.1`, partie de `b14e7dd` (le code en production), dans une copie de travail séparée. **Commit `b548a4a`**, autorisé par l'équipe après l'essai local. La branche n'est pas poussée sur GitHub.
- Mêmes changements reportés dans `main`, non commités. Ils ne diffèrent de la branche que par les fins de ligne.
- Images `backend-v1.1.1` et `frontend-v1.1.1` construites, essayées puis **publiées** (empreintes à l'action D). Après le commit, elles ont été reconstruites pour porter la révision `b548a4a`. Leurs couches sont identiques, une à une, à celles de l'image essayée : seule l'étiquette change.
- [deploy/portainer/amamestack.env.example](../deploy/portainer/amamestack.env.example) passe aux tags `v1.1.1`.
- Fichiers :
  - `PrivateFileController` : `Cache-Control: no-store` pour tout fichier privé, photo comprise (au lieu de `private, max-age=3600` pour une photo) ;
  - `PrivateFileControllerTest` : le test de la photo attend `no-store` ;
  - `frontend/vite.config.ts` : le service worker ne garde plus que `/api/visitor/` (cache `api-public`), et tout autre `/api/` est en `NetworkOnly` ;
  - `frontend/src/utils/privateCaches.ts` (nouveau) : supprime l'ancien `api-cache` ;
  - appel de cette purge au démarrage, dans `frontend/src/main.tsx`, et à la déconnexion, dans `frontend/src/service/userService.ts`, même si l'appel de déconnexion échoue.

**Vérifié en local**, sur la branche comme sur `main` :

- `PrivateFileControllerTest` : 8 tests, aucun échec ;
- `npx tsc --noEmit` sans erreur ;
- `npm run build` réussi ;
- `dist/sw.js` déclare, dans cet ordre : `/api/user/files/` `NetworkOnly`, `/api/visitor/` `NetworkFirst` (`api-public`), `/api/` `NetworkOnly`.

**Non vérifié.**

- ESLint ne tourne pas sur `b14e7dd`. Il plante au chargement de la règle `@typescript-eslint/no-unused-expressions`, sur un fichier non modifié (`App.tsx`) comme sur les fichiers changés. C'est un défaut d'outillage antérieur au correctif.
- Comportement dans un vrai navigateur (purge d'`api-cache`, contenu de *Cache storage*) : à constater en production (point 3 ci-dessous).

**Vérifié ensuite par un essai de bout en bout**, avec les images construites, sur une stack jetable `amame-e1-v111` (PostgreSQL 15, backend en profil `prod`, frontend). 16 vérifications sur 16 :

- deux comptes inscrits : A avec une photo, B sans fichier ;
- A lit sa photo : `200`, `Cache-Control: no-store`, contenu identique ;
- B reçoit `403` sur la photo de A, un anonyme `401` ;
- le `sw.js` servi par l'image déclare `api-public` et deux règles `NetworkOnly`, sans plus aucun `api-cache` ;
- le code de l'application contient la purge d'`api-cache` ;
- l'accueil et la liste publique des bourses répondent `200`, et la déconnexion aussi.

La stack jetable est supprimée ensuite (`down -v`).

**Déploiement** (action de l'équipe) :

1. Recharger la page de Portainer.
2. Dans Stacks → `amamestack`, variables `BACKEND_IMAGE_TAG=backend-v1.1.1` et `FRONTEND_IMAGE_TAG=frontend-v1.1.1`, puis *Update the stack*. *Re-pull image* n'est pas nécessaire : les tags sont neufs.
3. Vérifier :
   - les trois conteneurs sont *running*, et le journal du backend se termine par `Started SiteAmameApplication` ;
   - le site s'affiche ;
   - connecté en administrateur dans une fenêtre normale, après avoir ouvert Utilisateurs : F12 → *Application* → *Cache storage* ne contient plus `api-cache`, et `api-public` ne contient que des adresses `/api/visitor/…` ;
   - dans *Network*, la réponse d'une photo `/api/user/files/<id>` porte `Cache-Control: no-store` ;
   - après déconnexion, toujours pas d'`api-cache`.
4. Retour arrière : remettre les tags `backend-v1.1` et `frontend-v1.1`, puis *Update the stack*.

**Déployé le 16 novembre 2026** par l'équipe (stack mise à jour en `v1.1.1`, selon l'équipe). Le journal transmis montre `Started SiteAmameApplication in 71.171 seconds` à 12:00:55 UTC. **Constaté dans le navigateur le 16 novembre** (sortie transmise par l'équipe, connecté en administrateur, page Utilisateurs) :

- caches : `workbox-precache-v2-https://amame.ml/` et `amame-images-cache`. **Plus d'`api-cache`** ;
- photo `/api/user/files/5` : `200`, **`Cache-Control: no-store`**.

E44 est donc corrigé en production : ni le cache HTTP ni le service worker ne gardent de données privées. Deux contrôles prévus n'ont pas été faits, et ne changent pas la conclusion :

- **Pas d'`api-public` dans la liste** : aucune réponse `/api/visitor/…` n'est passée par le service worker pendant cette visite. Ce cache ne contient de toute façon que des données publiques.
- **Le contrôle après déconnexion** : il n'apporte rien quand `api-cache` est déjà absent pendant la session. La purge à la déconnexion ne sert qu'à effacer l'ancien cache, et ce cache n'existe plus.

#### 16 novembre 2026 — suppression du compte de test depuis l'administration

**Signalé par l'équipe** : la suppression du compte de test (39) pose problème.

**Cause confirmée par le journal du backend**, après le passage en `v1.1.1` (12:02:21 UTC) : `delete from users where id=39` refusé, `violates foreign key constraint "fkjtx87i0jvq2svedphegvdwcuy" on table "refresh_token"`, `Key (id)=(39) is still referenced from table "refresh_token"`. C'est le constat C7, désormais vu en production. Le correctif `v1.1.1` ne pouvait pas le corriger : il ne touche que le cache (E44), et le code en production n'a pas encore de migrations Flyway (elles arrivent avec l'étape 1, V4 avec l'étape 2).

**Pas de second correctif** : la suppression d'un compte reste rare. Le compte de test est supprimé à la main ci-dessous. Un vrai compte attend l'étape 2, dont la règle (E28) conserve l'historique détaché du compte. Le refaire à la main, compte par compte, serait sujet à erreur.

**Lecture du code** :

- En production (`b14e7dd`), `UserService.deleteUser` appelle `deleteById` seul.
- Or `refresh_token` et `password_reset_tokens` référencent `users(id)` sans `ON DELETE CASCADE`. Hibernate ne supprime pas ces jetons, qui ne sont pas des collections de `User`.
- Tout compte qui s'est déjà connecté ne peut donc pas être supprimé : la base refuse au nom de la clé étrangère.
- C'est corrigé dans `main` par la migration V4 (étape 2 : jetons supprimés en cascade, adhésions, cotisations et dons détachés). L'étape 2 n'est pas déployée.

**Contournement proposé**, pour le seul compte de test :

1. Compter dans la console d'`amame-database` les lignes qui le référencent.
2. Si seuls des jetons apparaissent, les supprimer dans une transaction gardée par l'adresse du compte.
3. Supprimer ensuite le compte depuis l'administration.

**Fait le 16 novembre 2026** (sorties transmises par l'équipe) :

- comptage : `refresh_token` 1, toutes les autres tables 0 (`password_reset_tokens`, `adhesions`, `cotisations`, `dons`, `user_permission`, `file_entity`) ;
- transaction : `BEGIN`, `DELETE 1` (le jeton), `DELETE 0`, `COMMIT` ;
- le compte 39 a ensuite été supprimé depuis l'administration, selon l'équipe.

Cela confirme que le seul obstacle était le jeton de session, comme l'annonçait C7. Le compte de test n'existe plus en production.

#### 16 novembre 2026 — limite de débit de l'inscription, nouvel essai sous `v1.1.1`

Les journaux du 15 novembre ont disparu avec la recréation des conteneurs : l'adresse enregistrée lors d'un refus `429` devait être relevée sur un nouvel essai.

**Constaté par l'équipe** (sortie de la console, 12:25:22 UTC, fenêtre privée, sans connexion) : 10 envois rapprochés donnent `500 500 429 429 500 429 429 429 429 429`.

- **Les `500`** viennent du script, pas du correctif. Il envoyait un formulaire vide, sans la partie `user`, alors que celui du 15 novembre envoyait `user` = `{}` (réponse `400`). L'absence de cette partie lève `MissingServletRequestPartException`, que le gestionnaire générique transforme en `500` (constat C11). Aucun compte n'est créé.
- **Seuls 3 envois sont passés au lieu de 6** : le quota de cette adresse était déjà à moitié consommé avant l'essai. Le 3ᵉ envoi est refusé et le 5ᵉ passe, ce qui correspond à une place libérée toutes les 12 s (`rate=5r/m`). Deux explications sont possibles : un essai lancé juste avant depuis la même connexion, ou un quota partagé par tous les visiteurs, si l'adresse retenue est celle du proxy. Le journal d'`amame-frontend` permet de trancher.

**Constaté dans le journal d'`amame-frontend`** transmis par l'équipe (12:01 à 12:54 UTC) :

- **L'adresse enregistrée est celle du visiteur.** Les lignes `limiting requests … client:` portent l'adresse publique du poste de test, la même que dans le champ `X-Forwarded-For` et que dans toutes les actions de l'administrateur faites depuis ce poste. Deux robots du même intervalle ont chacun leur propre adresse (`POST /xmlrpc.php` → `405`, `GET /api/session/properties` → `401`). Le quota est donc individuel, et `set_real_ip_from` n'a pas à changer.
- **Le script a été lancé deux fois** (confirmé par l'équipe). Premier lancement, 12:24:45-46 : 6 envois passent (`500`), puis 4 refus `429`, exactement `rate=5r/m burst=5`. Second lancement, 35 s plus tard : le quota n'avait regagné que 3 places environ, d'où le résultat partiel. Rien d'anormal.

La vérification « limitation de débit par visiteur » de l'étape 0 est donc faite en entier.

**Autres constats du même journal :**

- **Avatar de la Navbar** : `GET /a-propos/uploads/utilisateur/<uuid>.jpg` et `/orientation/uploads/…` reçoivent `200` de 1 766 octets. C'est `index.html` (même taille que `GET /`), pas la photo. La Navbar de `v1.1` construit l'adresse depuis `imagePath`, une adresse relative à la page courante, et l'avatar est cassé. C'est le constat B01 F1, corrigé dans `main` (étape 1, la Navbar lit `imageUrl`). Pas de fuite : `/uploads/utilisateur/…` répond `404`.
- **Ancien fichier JavaScript demandé après le déploiement** (constat C12) : à 12:01:55, `open() "/usr/share/nginx/html/assets/LayoutAdmin-B8YmbZu6.js" failed`.
- **Session administrateur coupée au bout de 15 minutes** (à confirmer) : à 12:23:52, 22 minutes après la connexion de 12:01:52, `GET /api/admin/users` → `401`, puis `POST /api/auth/refresh` → `401`. Aucune déconnexion n'est passée entre-temps. Le même cas s'est produit à 12:01:41 pour la session ouverte avant le déploiement.
  - Le corps de ces `401` fait 164 octets, contre 162 pour le `401` d'une fenêtre privée sans cookie (« Refresh token absent »). Les deux viennent du même gestionnaire : un message plus long de 2 octets, répété deux fois dans la réponse, correspond à « Refresh token expiré ». « invalide » donnerait +4, « révoqué » +6.
  - Or la durée par défaut est de 7 jours (`JWT_REFRESH_EXPIRATION=604800000`, en millisecondes). Hypothèse : une valeur plus courte est définie dans les variables de la stack `amamestack`, par exemple `604800` (des secondes lues comme des millisecondes, soit 10 minutes). Un fuseau horaire décalé ne suffirait pas à expliquer l'écart : il serait au plus de 14 heures.
  - Vérification demandée à l'équipe : `printenv JWT_REFRESH_EXPIRATION` dans la console d'`amame-backend`, et la durée réelle des derniers jetons dans `refresh_token` (`expiry_date - created_at`, sans la colonne `token`).
  - **Hypothèse de la variable réfutée le même jour** (sorties transmises par l'équipe). `JWT_REFRESH_EXPIRATION=604800000` et `JWT_EXPIRATION=900000`. Les trois derniers jetons (09:03:51, 12:01:52, 13:10:14) durent `6 days 23:59:59.99…` et ne sont pas révoqués.
  - Le jeton de 12:01:52 n'a jamais été renouvelé : sinon il serait révoqué, et un nouveau jeton serait apparu à 12:23. Le jeton de 13:10:14 correspond à une nouvelle connexion, après la coupure de 12:54.
  - **Nouvelle hypothèse** : le navigateur envoie un **ancien** cookie `refresh_token`, dont le jeton existe encore en base mais a expiré. Il le ferait parce qu'il garde deux cookies de ce nom avec un domaine ou un chemin différents, et que `extractRefreshTokenFromCookies` prend le premier. Cela suppose aussi que le nettoyage des jetons expirés (`cleanupExpiredTokens`, au démarrage puis toutes les 24 h) n'a pas effacé ce jeton.
  - Vérifications demandées : la liste des cookies du site dans le navigateur de l'administrateur (nom, domaine, chemin, expiration, **jamais la valeur**), et les jetons expirés encore présents dans `refresh_token`.
  - **Cookies relevés vers 13:35** (transmis par l'équipe, sans les valeurs) : un seul `access_token` (domaine `amame.ml`, chemin `/`, expire à 13:46:39) et un seul `refresh_token` (domaine `amame.ml`, chemin `/api/auth`, expire le 23 novembre à 13:31:39). Il n'y a donc plus de doublon au moment du relevé, et les deux cookies datent de 13:31:39.
  - **Indice** : le domaine s'affiche `amame.ml`, sans point. Chrome affiche `.amame.ml` quand le serveur fixe le domaine. Le backend ne le fixe donc plus, alors que l'ancienne production le fixait à `.amame.ml` (relevé du 9 novembre).
  - **Hypothèse retenue, à confirmer** : le domaine des cookies a changé avec `v1.1`, le 15 novembre. Un navigateur connecté avant cette date garde l'ancien cookie `.amame.ml`, que la nouvelle version ne peut ni remplacer ni effacer, puisque ce n'est pas le même cookie pour le navigateur. À chaque renouvellement, le navigateur l'envoie en premier (même chemin, cookie plus ancien), et le serveur le refuse. Ce cookie disparaît seul, 7 jours après avoir été posé. Posé le 9 novembre, il aurait expiré aujourd'hui, entre 12:54 et le relevé de 13:35.
  - Vérifications demandées : `printenv COOKIE_DOMAIN` dans la console d'`amame-backend`, puis un renouvellement observé dans l'onglet *Network*, après l'expiration de l'`access_token` (statut, et en cas de `401` le champ `message` de la réponse).

**Vérifié en local.** `git ls-files` ne suit aucun `.env` (seulement `.env.example`) et rien sous `backend/uploads/`. Le `.gitignore` ignore aussi `*.env`, pour qu'une copie remplie d'un modèle de `deploy/portainer/` ne soit jamais commitée par erreur. Les modèles `*.env.example` restent suivis.

#### 16 novembre 2026 — étape 1 : images `v1.2` avec le correctif E44, passage `v1.1.1` → `v1.2` essayé en local

À la demande de l'équipe (« passons à l'étape suivante »), l'étape 1 commence. La session coupée au bout de 15 minutes et E43 restent ouverts, à reprendre ensuite.

**Fait :**

- Dossier de travail séparé, détaché sur `5c62c07`. Le correctif `b548a4a` y est appliqué **sans commit** (`git cherry-pick --no-commit`). Seul conflit : `frontend/vite.config.ts`, résolu à l'identique de `main` (écart E45).
- Images `backend-v1.2` et `frontend-v1.2` construites, avec l'étiquette `org.opencontainers.image.revision=5c62c07+correctif-E44-non-commité`. **Ni commitées ni publiées** : il faut l'autorisation de l'équipe.
- Action G.1 remplacée par une requête d'empreintes (écart E46). Empreintes de V1 calculées en local, puis commande envoyée à l'équipe.

**Vérifié en local :**

- `PrivateFileControllerTest` sur le code de l'étape 1 corrigé : 8 tests, aucun échec.
- **Essai de bout en bout**, stack jetable `amame-e1-v12`, mêmes variables que [deploy/portainer/amamestack.yml](../deploy/portainer/amamestack.yml) : **38 vérifications, 0 échec**.
  - **Phase A** : `backend-v1.1.1` et `frontend-v1.1.1` créent le schéma (Hibernate, comme la production actuelle). Puis deux comptes, l'un avec photo, et un administrateur de départ.
  - **Phase B** : passage en `v1.2` sur la même base et les mêmes fichiers.
  - Flyway : `Successfully baselined schema with version: 1`, puis `Schema "public" is up to date`, sans erreur `Schema-validation`. Le premier administrateur n'est pas recréé.
  - Frontend : `config.js` écrit au démarrage (`mediaBaseUrl` vide), servi en `no-store`, et hors précache.
  - Comptes créés sous `v1.1.1` : connexion possible. La photo d'avant le passage est relue à l'identique, en `no-store`. Un autre compte reçoit `403`, un anonyme est refusé.
  - Renouvellement de session (`POST /api/auth/refresh` avec le cookie de connexion) : `200`, avec un nouvel `access_token`.
  - Service worker : `api-public`, deux règles `NetworkOnly`, plus d'`api-cache`. La purge d'`api-cache` est présente dans l'application.
  - Accueil et 7 listes publiques : `200`. Administrateur : liste des utilisateurs `200`. Un concours créé sans fichier apparaît dans la liste publique, et sa page répond `200`.
  - Mémoire du backend : 376 Mio sur 512 en fin d'essai.
- Empreintes : le schéma créé par `backend-v1.1.1` est identique à V1 sur les 25 tables, une fois les `CHECK` normalisées. Sans normalisation, 8 tables diffèrent par la seule écriture de ces contraintes.
- Les stacks jetables sont supprimées ensuite (`amame-e1-*` seulement).

**Non vérifié :**

- le schéma réel de la production (empreintes demandées à l'équipe) ;
- le comportement dans un vrai navigateur. L'essai passe par `curl` et lit `sw.js` : le service worker n'est pas exécuté ;
- la suite de tests complète (`./mvnw test`) sur ce code corrigé. Seul le test du contrôleur modifié a tourné, et le code de l'étape 1 n'a pas changé ailleurs depuis la suite complète du 8 novembre.

**Relevés de l'équipe, même jour :**

- **Empreintes du schéma de production** (action G.1, écart E46) : **22 tables sur 25 identiques à V1**. Trois diffèrent :
  - `bourse` : colonnes, contraintes, index et noms. La structure diffère ;
  - `users` et `user_permission` : contraintes seulement, avec les mêmes noms. Probablement une liste `CHECK` de valeurs plus ancienne.

  Détail transmis le même jour : voir l'écart E47 (`bourse` créée par l'ancien scraper ; `VISITOR` et `ADHESION_MANAGE` absents des deux listes `CHECK`).
- **Mémoire d'`amame-backend`** (`v1.1.1`, démarré à 12:00:55, relevé vers 14:00) : `memory.current` 534 Mio pour une limite de 768 Mio ; `memory.stat` : `anon` 554 020 864 octets (**528 Mio**), `file` 2,5 Mio. Le chiffre comparable à `docker stats` est donc d'environ **532 Mio**, contre 482 mesurés en local pour `v1.1` sous charge : la production consomme environ 50 Mio de plus que l'essai. Voir l'écart E48 pour la limite de `backend-v1.2`.

**Suite, même jour (écart E47)** :

- [V1__baseline.sql](../backend/src/main/resources/db/migration/V1__baseline.sql) corrigée et [V1_1__enum_check_constraints.sql](../backend/src/main/resources/db/migration/V1_1__enum_check_constraints.sql) ajoutée, dans `main` et dans le dossier de travail `v1.2` (fichiers identiques). [CLAUDE.md](../CLAUDE.md) précise la règle de V1 et celle des énumérations.
- [SiteAmameApplicationTests.java](../backend/src/test/java/com/example/siteamame/SiteAmameApplicationTests.java), dans les deux copies : nouveau test `enumCheckConstraintsListEveryValueOfTheCode`. Il vérifie que les deux contraintes listent toutes les valeurs de `RoleType` et de `Permission`. Dans la copie `v1.2`, la version attendue passe de `1` à `1.1`.
- Image `backend-v1.2` reconstruite (révision `5c62c07+correctif-E44+E47-non-commité`). `frontend-v1.2` ne change pas.

**Vérifié en local :**

- V1 corrigée sur une base neuve : les 25 empreintes de la production à l'identique.
- Tests Testcontainers :
  - `main` : `SiteAmameApplicationTests` et `FileLifecycleIntegrationTest`, 6 tests, puis `SiteAmameApplicationTests` seul, 3 tests, avec le nouveau test. Chaîne complète V1 → V1_1 → V2 → V3 → V4 ;
  - copie `v1.2` : `SiteAmameApplicationTests`, 3 tests.
  - Aucun échec. Le premier essai de la copie `v1.2` échouait comme attendu, sur la version `1` au lieu de `1.1`.
- **Essai de bout en bout n° 2** : **47 vérifications, 0 échec**.
  - **Phase A** : la base est créée par V1 corrigée, donc à la structure de la production (empreintes vérifiées), puis `v1.1.1` (`ddl-auto=update`) n'y change rien. Sous `v1.1.1`, l'octroi d'`ARTICLE_CREATE` répond `200`. L'octroi d'`ADHESION_MANAGE` répond `500` (`violates check constraint "user_permission_permission_check"`) : le défaut de production est reproduit.
  - **Phase B** : `v1.2` pose la baseline en V1, applique `1.1 - enum check constraints` (« Successfully applied 1 migration … now at version v1.1 »), et valide le schéma. Historique Flyway : `1 BASELINE`, `1.1 SQL`. Schéma final identique à V1 corrigée + V1_1 sur une base neuve.
  - L'octroi d'`ADHESION_MANAGE` répond `200` et la permission est enregistrée. Une bourse créée par l'administration reçoit sa clé de la séquence.
  - Les 38 vérifications du premier essai repassent (fichiers, cache, session, listes, concours sans fichier). Mémoire du backend : 378 Mio sur 512.
- Séquences de V1 + V1_1 (`pg_sequences`) : 19, toutes `bigint`, pas de 1.

**Non vérifié :**

- le type de `bourse_id_seq` en production (`SERIAL` donnerait `integer`), demandé à l'équipe : les empreintes ne couvrent pas les séquences ;
- le comportement dans un vrai navigateur ;
- la suite de tests complète sur la copie `v1.2` : seuls `SiteAmameApplicationTests` et `PrivateFileControllerTest` y ont tourné.

**Commit et publication, même jour, avec l'autorisation de l'équipe** :

- Branche locale `deploiement/v1.2` : `0d39229` (correctif E44 repris de `b548a4a`), puis `3baba45` (E47). Non poussée sur GitHub.
- Images reconstruites avec la révision `3baba45`. Leurs couches sont identiques à celles des images essayées. Publiées (empreintes à l'action D).
- [deploy/portainer/amamestack.env.example](../deploy/portainer/amamestack.env.example) passe aux tags `v1.2`. Le commentaire de la limite mémoire d'[amamestack.yml](../deploy/portainer/amamestack.yml) cite E48 ; ce n'est qu'un commentaire, rien à recoller dans Portainer.

**Retour arrière essayé en local** : `backend-v1.1.1` démarre sur une base passée par V1 corrigée et `V1_1`, avec l'historique Flyway en `1.1`. L'inscription (`201`) et la liste des bourses (`200`) fonctionnent, et l'empreinte du schéma ne change pas. Les listes `CHECK` élargies restent en place, sans effet sur l'ancienne version.

**Empreintes attendues en production après le déploiement** :

- `users` : `a4a455db | 08cec326 | d898bdd8 | 39625f50` ;
- `user_permission` : `231a0848 | 25a11ac3 | 8cfabd61 | 91b915f6` ;
- les 23 autres tables inchangées, dont `bourse` : `321922c9 | 061a29b2 | 0d1c31dd | 81624f77`.

#### 16 novembre 2026 — déploiement de `v1.2` : le backend refuse de démarrer

**Constaté** (journal d'`amame-backend`, 17:25 UTC) :

- `APPLICATION FAILED TO START` sur `spring.datasource.hikari.minimum-idle`, valeur `${DB_POOL_MIN_IDLE:0}` : « A null value cannot be assigned to a primitive type ».
- L'échec survient à la lecture des réglages du pool, avant toute connexion à la base. Flyway n'a donc pas tourné et la base n'a pas changé (vérification demandée).

**Cause** (écart E49) :

- La stack en production n'est pas [amamestack.yml](../deploy/portainer/amamestack.yml). C'est la version de l'équipe, relevée le 15 novembre, où les valeurs par défaut `${VAR:-…}` sont remplacées par `${VAR}`. Une variable que Portainer ne définit pas arrive donc **vide** dans le conteneur.
- Pour Spring, une variable vide n'est pas une variable absente. La valeur par défaut de `${DB_POOL_MIN_IDLE:0}` ne s'applique pas, et une chaîne vide ne se convertit pas en nombre.
- `backend-v1.1.1` ne lit pas les variables apparues à l'étape 1 : leur valeur vide ne se voyait pas.
- Défaut de vérification de ma part :
  - l'essai n° 2 passait les valeurs en clair, sans le fichier de production ni la version de l'équipe ;
  - la procédure disait de ne pas toucher au fichier de la stack, sans tenir compte du relevé du 15 novembre.

**Variables lues par `backend-v1.2` qu'une valeur vide empêche de démarrer** (lecture du code) :

- les quatre `DB_POOL_*` ;
- `STORAGE_PROVIDER` : plus aucun stockage de fichiers n'est créé ;
- `PUBLIC_LISTS_CACHE_TTL` : durée nulle à la création du cache ;
- `AUTH_TOKEN_CLEANUP_SCHEDULE` : tâche planifiée sans horaire ;
- les cinq `DATABASE_*`.

**Lien probable avec la session coupée.** Une variable d'environnement l'emporte sur les fichiers de propriétés. Un `COOKIE_DOMAIN` vide remplace donc `cookie.domain=.amame.ml` du profil `prod`, et les cookies sont posés sans domaine : ce sont ceux relevés le 16 novembre. À confirmer par le relevé ci-dessous.

**Demandé à l'équipe** :

- remettre les tags `v1.1.1` ;
- constater que la base n'a pas changé : pas de table `flyway_schema_history` ;
- relever, dans la console d'`amame-backend` revenu en `v1.1.1`, les variables qu'il reçoit. Les secrets sont masqués : seul « DEFINIE », « VIDE » ou « ABSENTE » s'affiche. La commande, essayée dans l'image `backend-v1.1.1`, est dans `scratchpad/etape1/commande-variables.txt`.

**Non vérifié.** Les valeurs effectives en production. La correction attend ce relevé : recoller le fichier du dépôt, ou compléter les variables de la stack.

**Constaté ensuite par l'équipe.**

- Base inchangée : `flyway_schema_history` est absente.
- Le relevé des variables a tourné dans la console d'`amame-database`, et non dans celle d'`amame-backend` : même invite que la commande `psql`. Tout y est « ABSENTE », `JWT_SECRET` compris, ce qu'aucun backend en marche ne peut avoir. Relevé à refaire dans la console d'`amame-backend`.

**Relevé des variables d'`amame-backend`** (`v1.1.1`, même jour, secrets masqués).

- Seules quatre valeurs sont vides, alors que le fichier du dépôt leur donne une valeur par défaut :
  - `DB_POOL_MIN_IDLE`, cause de l'échec ;
  - `DATABASE_PASSWORD`, qui ferait échouer la connexion de l'application après la migration (Flyway, lui, utilise `DATABASE_MIGRATION_PASSWORD`, définie) ;
  - `COOKIE_DOMAIN` ;
  - `MAIL_DEBUG`, sans effet : `spring.mail.debug` n'est pas une propriété que Spring Boot lit, en `v1.1.1` comme en `v1.2`.
- Les autres variables lues par `v1.2` ont la valeur du fichier du dépôt : `DATABASE_URL` vaut `jdbc:postgresql://database:5432/amame_db`, `DATABASE_USERNAME` et `DATABASE_MIGRATION_USERNAME` valent `postgres`, et les trois autres `DB_POOL_*`, `STORAGE_PROVIDER`, `PUBLIC_LISTS_CACHE_TTL`, `AUTH_TOKEN_CLEANUP_SCHEDULE`, `JWT_*`, `FRONTEND`, `COOKIE_SECURE`, `MAIL_HOST` et `MAIL_PORT` sont conformes.
- `MEDIA_BASE_URL` et `BOOTSTRAP_ADMIN_*` sont vides, comme prévu.

**`COOKIE_DOMAIN` vide** (écart E50) :

- Une variable d'environnement l'emporte sur les fichiers de propriétés. La valeur vide remplace donc `cookie.domain=.amame.ml` du profil `prod` : les cookies sont posés sans domaine depuis la mise à jour du 15 novembre. C'est ce qu'a montré le relevé des cookies du 16 novembre.
- `.env.example` porte `COOKIE_DOMAIN=` vide, la valeur du développement local : c'est l'origine probable.
- Cela n'explique pas, à lui seul, la session coupée : le navigateur relevé n'avait aucun cookie restant de l'ancien domaine.

**Décision proposée.**

- Corriger seulement `DB_POOL_MIN_IDLE=0` et `DATABASE_PASSWORD`, qui doit valoir le mot de passe actuel de la base, dans les variables de la stack. La version de l'équipe reste en place : une seule modification à la fois.
- Ne pas toucher `COOKIE_DOMAIN` dans ce déploiement. Revenir à `.amame.ml` changerait le domaine de tous les cookies posés depuis le 15 novembre. Un navigateur garderait alors deux `refresh_token`, et le backend ne lit que le premier, qui peut être le périmé. À décider avec l'enquête sur la session, et le correctif du code qui lit tous les cookies.
- Procéder en deux mises à jour :
  - d'abord les variables seules, tags toujours en `v1.1.1`, qui ne lit aucune des deux. Puis vérifier dans la console, sans afficher les secrets, que plus aucune variable de `v1.2` n'est vide et que les deux mots de passe égalent celui avec lequel `v1.1.1` se connecte (`SPRING_DATASOURCE_PASSWORD`) ;
  - ensuite seulement les tags `v1.2`.

**Variables corrigées, constaté par l'équipe** (console d'`amame-backend`, `v1.1.1`, même jour) :

- aucune des douze variables critiques de `v1.2` n'est vide ;
- `DB_POOL_MIN_IDLE=[0]` ;
- `DATABASE_PASSWORD` et `DATABASE_MIGRATION_PASSWORD` sont identiques au mot de passe avec lequel `v1.1.1` se connecte.

Les deux autres variables vides, `COOKIE_DOMAIN` et `MAIL_DEBUG`, sont laissées telles quelles. Prochaine action : `backup.sh`, puis les tags `v1.2`.

#### 16 novembre 2026 — `v1.2` en production, deuxième tentative

**Constaté** (journal d'`amame-backend`, collé par l'équipe) :

- `Successfully baselined schema with version: 1` ;
- à 20:05:32, `Current version of schema "public": 1`, `Migrating schema "public" to version "1.1 - enum check constraints"`, puis `Successfully applied 1 migration to schema "public", now at version v1.1` (67 ms) ;
- `HikariPool-1 - Start completed`, puis `Initialized JPA EntityManagerFactory` : la validation du schéma par Hibernate est passée sans erreur ;
- `Cache des listes publiques : désactivé` et `Stockage local des fichiers : /app/uploads` ;
- le collage s'arrête à 20:05:58, sur `Exposing 3 endpoints`, juste avant la ligne `Started SiteAmameApplication`.

L'équipe juge le déploiement réussi et **ne fait pas les autres vérifications**.

**Non vérifié** :

- la ligne `Started SiteAmameApplication` ;
- la ligne `40-runtime-config.sh` du frontend ;
- `flyway_schema_history` et l'empreinte du schéma après la migration ;
- l'octroi d'`ADHESION_MANAGE` en production ;
- la recette (critères de l'action J.3 autres que la baseline) ;
- la mémoire (action J.4). Ce relevé reste nécessaire pour passer de 768M à 512M (E48).

#### 17 novembre 2026 — session coupée et domaine des cookies (E50), fichier de la stack (E49)

**Session coupée : cause.**

- L'ancienne production posait les mêmes cookies, `access_token` pour 15 minutes et `refresh_token` pour 7 jours, mais avec le domaine `.amame.ml` (code d'avant l'étape 0, commit `f5252df`). Depuis le 15 novembre, la valeur vide de `COOKIE_DOMAIN` donne des cookies sans domaine : pour le navigateur, ce sont d'autres cookies.
- Un navigateur connecté avant le 15 novembre garde donc l'ancien `refresh_token` `.amame.ml`, que la nouvelle version ne remplace ni n'efface. Il l'envoie en premier : même chemin, cookie plus ancien. `extractRefreshTokenFromCookies` ne lisait que le premier : `401` à chaque renouvellement. C'est la coupure du 16 novembre, dont la réponse avait la longueur du message « Refresh token expiré ».
- Ces anciens cookies ont tous été posés avant le 15 novembre. Ils auront tous disparu le **22 novembre au plus tard**. D'ici là, un compte touché s'en sort en effaçant une fois les cookies du site dans son navigateur.

**Décision : cookies sans domaine** (E50).

- C'est la valeur effective depuis le 15 novembre : aucune transition, aucune session coupée.
- Aucun sous-domaine n'a besoin des cookies : l'API est servie par le même hôte que le site, sous `/api`.
- À l'étape 3, `media.amame.ml` sera servi par Bunny. Avec `.amame.ml`, le navigateur enverrait l'`access_token` (chemin `/`) avec chaque image demandée au CDN.

**Code, dans `main`, pour `backend-v1.3`** :

- Le renouvellement essaie chaque cookie `refresh_token` reçu, dans l'ordre, et garde le premier jeton utilisable (`RefreshTokenService.validateFirstUsable`). Le refus d'un jeton est rattrapé par un appel interne : il ne marque pas pour annulation la transaction du renouvellement.
- La déconnexion révoque tous les jetons reçus. Elle efface le cookie sans domaine et, si un domaine est configuré, celui de ce domaine.
- `cookie.domain=${COOKIE_DOMAIN:}` dans le profil `prod`, qui valait `.amame.ml` en dur ; `COOKIE_DOMAIN=${COOKIE_DOMAIN:-}` dans [amamestack.yml](../deploy/portainer/amamestack.yml). [CLAUDE.md](../CLAUDE.md) et [.env.example](../.env.example) sont à jour.
- Un changement de `COOKIE_DOMAIN` ne coupera plus les sessions ouvertes.

**Vérifié en local** :

- `RefreshTokenServiceTest` (5 tests) et `AuthentificationServiceCookieTest` (6) ;
- la suite complète, `./mvnw test` avec Docker Desktop : `BUILD SUCCESS`, 83 tests, 0 échec, 3 min 46. Elle comprend :
  - `AuthRefreshIntegrationTest`, qui couvre la transaction réelle : connexion, renouvellement, puis renouvellement avec l'ancien cookie révoqué envoyé en premier (`200`), et déconnexion qui révoque tout ;
  - `SiteAmameApplicationTests` (migrations sur une base vide, `validate` sans erreur) et `FileLifecycleIntegrationTest`.

L'action K.5 est faite. **Non vérifié** : rien n'a tourné sur le serveur ; `backend-v1.3` n'est pas construite.

**Fichier de la stack : décision proposée** (E49).

- Recoller [amamestack.yml](../deploy/portainer/amamestack.yml) dans Portainer, à la place de la version de l'équipe. Ses valeurs par défaut et ses refus explicites évitent qu'une variable vide arrive dans le conteneur. Les variables déjà définies dans Portainer l'emportent toujours.
- Comparaison faite en local (`docker compose config`, sans moteur Docker) : les deux fichiers, avec des variables de la forme relevée en production le 16 novembre, donnent la même configuration à deux valeurs près, `MAIL_DEBUG` et `STORAGE_PURGE_ENABLED`, qui passent de vide à `false`. `v1.2` ne lit ni l'une ni l'autre. Seul le backend serait recréé. La base et le frontend sont identiques, si `POSTGRES_DB` et `POSTGRES_USER` valent `amame_db` et `postgres` en production : à vérifier avant de recoller.
- Comparaison faite avec la version transmise le 15 novembre. La version actuellement dans Portainer a pu changer depuis : le relevé des variables après la mise à jour fait foi.

**Fichier de la stack : version de production du 17 novembre.**

- L'équipe a transmis la version en place. Depuis le 15 novembre, elle a perdu ses dernières valeurs par défaut : `BACKEND_MEMORY_LIMIT`, `MEDIA_OPTIMIZER_ENABLED`, `STORAGE_PURGE_RETENTION` et `STORAGE_PURGE_SCHEDULE`. Plus aucune variable n'en a.
- Relevé dans la console d'`amame-database` : `POSTGRES_DB` = `amame_db`, `POSTGRES_USER` = `postgres`.
- Nouvelle comparaison avec [amamestack.yml](../deploy/portainer/amamestack.yml) (`docker compose config`, mêmes variables qu'au 15 novembre) :
  - base identique : elle ne serait pas recréée ;
  - backend : `MAIL_DEBUG` et les trois `STORAGE_PURGE_*` passent de vide à leur valeur par défaut si elles ne sont pas définies dans Portainer. `v1.2` ne lit aucune `STORAGE_PURGE_*` (vérifié sur la branche `deploiement/v1.2`), et `spring.mail.debug` n'est pas une propriété de Spring Boot. Le backend serait recréé, sans changement de comportement ;
  - frontend : `MEDIA_OPTIMIZER_ENABLED` passe de vide à `false` s'il n'est pas défini. `40-runtime-config.sh` lit déjà le vide comme `false` : recréé, sans changement de comportement ;
  - limite mémoire identique : avec la version de l'équipe, une `BACKEND_MEMORY_LIMIT` vide fait refuser toute la stack (`invalid size: ''`). Elle est donc définie dans Portainer, et le fichier du dépôt donne la même valeur.
- Aujourd'hui, les deux versions donnent le même résultat, parce que chaque variable lue est définie. Elles diffèrent quand une variable manque ou est vide. La version de l'équipe la transmet vide au conteneur : c'est la panne du 16 novembre. Celle du dépôt prend la valeur par défaut, ou refuse le déploiement avant tout changement (`${VAR:?…}`) pour les secrets, les tags et le chemin des uploads.
- ~~Avec `backend-v1.3`, des `STORAGE_PURGE_*` vides restent sans effet tant que la purge est désactivée.~~ **Faux**, déduit du code sans essai. L'essai du même jour l'a démenti : `backend-v1.3` refuse de démarrer avec `STORAGE_PURGE_ENABLED` vide, après avoir appliqué V2 à V4 (écart E51, entrée suivante).

#### 17 novembre 2026 — étape 2 : passage `v1.2` → `v1.3` essayé avec la stack de production, correctifs E51 et C13

À la demande de l'équipe (« go ahead with the next step »), l'étape 2 commence. Les critères de l'étape 1 autres que la baseline n'ont pas été constatés en production : l'équipe a choisi de ne pas les vérifier (16 novembre). L'équipe garde sa version de la stack, sans valeurs par défaut (action K.4 abandonnée), et a déplacé ses secrets dans un fichier `.env` chargé dans Portainer.

**Premier essai : `backend-v1.3` refuse de démarrer.**

- Stack jetable `amame-e1-v13` : la stack de production transmise le même jour, telle quelle, et des variables à la forme relevée le 16 novembre. `STORAGE_PURGE_RETENTION`, `STORAGE_PURGE_SCHEDULE` et `MEDIA_OPTIMIZER_ENABLED` sont absentes, `STORAGE_PURGE_ENABLED` et `MAIL_DEBUG` vides.
- `backend-v1.3` applique V2, V3 et V4, puis s'arrête : `Failed to bind properties under 'app.storage.purge.enabled' to boolean` (valeur vide). En production, le site serait resté arrêté jusqu'au retour en `v1.2`, sur une base déjà en V4. Même cause que l'échec du 16 novembre (E49).

**Correctifs, dans `main`** :

- E51 : [EmptyEnvironmentVariablesPostProcessor.java](../backend/src/main/java/com/example/siteamame/config/EmptyEnvironmentVariablesPostProcessor.java), enregistré dans `META-INF/spring.factories`. Une variable d'environnement vide est traitée comme absente. Le démarrage écrit les noms des variables ignorées. Test : [EmptyEnvironmentVariablesPostProcessorTest.java](../backend/src/test/java/com/example/siteamame/config/EmptyEnvironmentVariablesPostProcessorTest.java), 5 tests, dont un qui reproduit l'échec sans le correctif.
- C13 : `ArticleMapper.convertToDTO` copie les tags. Test : [ArticleMapperTest.java](../backend/src/test/java/com/example/siteamame/mapper/ArticleMapperTest.java), 2 tests.
- [CLAUDE.md](../CLAUDE.md) (règle des variables vides) et le commentaire d'en-tête d'[amamestack.yml](../deploy/portainer/amamestack.yml).

**Vérifié en local** :

- Suite complète, `./mvnw test` : **90 tests, 0 échec** (4 min 04).
- Image `backend-v1.3` reconstruite, révision `ba50a0a+E44+E47+E50+E51+C13-non-commité`. **Ni commitée ni publiée.**
- **Essai de bout en bout n° 3** : **74 vérifications, 0 échec**. Il a fallu trois passages : le deuxième a révélé C13 et trois erreurs du script lui-même (chemins réécrits par Git Bash, photo jamais écrite), corrigées.
  - **Phase A** : base créée par V1 corrigée (empreintes de la production), puis `v1.2` : baseline et 1.1. Trois comptes, dont deux avec photo et CV, et un article avec image.
  - **Phase B, action K.2** : `inventory.sh` (`ops-v1.1`) sous `v1.2` : `inventaire conforme`, et « colonne absente, migration V2 pas encore appliquée » pour les empreintes.
  - **Phase C** : `v1.3`, avec les variables vides. Migrations 2, 3 et 4 (« Successfully applied 3 migrations … now at version v4 »), aucune erreur de validation, purge non activée. Le démarrage liste 8 variables vides traitées comme absentes, dont les trois `STORAGE_PURGE_*`. Historique Flyway : `1 BASELINE`, `1.1`, `2`, `3`, `4`, tous réussis.
    - Comptes créés sous `v1.2` : connexion ; la photo est relue à l'identique ; un autre compte reçoit `403`.
    - Session (E50) : cookies posés sans domaine ; un ancien `refresh_token` révoqué envoyé avant l'actuel donne `200`, seul il donne `401`.
    - Accueil et 7 listes publiques `200` ; adresse inconnue `404` (C9).
    - **Critères de l'étape 2** : remplacement de l'image d'un article (nouvelle clé, nouvelle ligne avec empreinte, ancienne ligne supprimée, ancienne clé dans la file, ancien fichier encore sur le disque) ; article au titre déjà pris refusé, sans fichier laissé ; modification de `file_path` refusée par la base ; compte avec photo et CV, connecté une fois, supprimé par l'administration (C7) : jetons supprimés, deux entrées dans la file, fichiers encore sur le disque ; filière créée avec et sans image, nom vide refusé par un `400` (C8).
    - **Actions N.2 à N.4** : `backfill-sha256.sh` (simulation, puis `--apply`) : 0 ligne sans empreinte ; `delete-orphan-rows.sh` : rien à supprimer ; `inventory.sh` : `inventaire conforme`, 4 fichiers en attente de purge.
    - Mémoire : 482 Mio pour une limite de 768 Mio.
  - **Phase D, retour arrière en `v1.2` sur la base en V4** : démarre, « Schema "public" is up to date », aucune migration. Photo relue, listes `200`, inscription avec photo `201` (les contraintes de V2 acceptent les clés de `v1.2`). Remplacement de l'image d'un article par le formulaire `200` : comme prévu, `v1.2` efface l'ancien fichier et laisse sa ligne.
  - **Phase E, retour en `v1.3`** : démarre sans migration. `inventory.sh` : `inventaire conforme`, une seule ligne orpheline, celle laissée par `v1.2`, au fichier absent. `delete-orphan-rows.sh` ne la propose pas encore : il ne retient que les lignes orphelines de plus de 2 jours.
- La stack jetable est supprimée ensuite (`amame-e1-*` seulement).

**Non vérifié** : rien n'a tourné sur le serveur. Le comportement dans un vrai navigateur n'est pas essayé : l'essai passe par `curl`. La mémoire sous la limite de 512M n'est pas mesurée pour `v1.3` (la production reste à 768M, E48).

**Commit et publication, même jour, avec l'autorisation de l'équipe** : branche locale `deploiement/v1.3`, partie de `main` (`ba50a0a`), 7 commits (`c491fdd` à `be0bb40`). Non poussée sur GitHub ; `main` n'a pas bougé. Image `backend-v1.3` construite depuis `e9e5437`, couches identiques à l'image essayée, publiée (empreinte à l'action D).

#### 17 novembre 2026 — `backend-v1.3` en production

**Constaté (sorties transmises par l'équipe)** :

- Action K.2, 11:22 UTC : `inventory.sh` se termine par `inventaire conforme`. Compteurs dans les faits relevés : 5 lignes orphelines, 1 fichier orphelin, aucun bloquant.
- Action K.3, 11:22 UTC : `backup.sh`, sauvegarde couplée `20261117T112241Z` terminée (29 fichiers, dump de la base envoyé).
- Action M : `BACKEND_IMAGE_TAG=backend-v1.3`, avec la version de la stack de l'équipe.
- Action N.1, journal du backend : « Current version of schema "public": 1.1 », migrations 2, 3 et 4, « Successfully applied 3 migrations to schema "public", now at version v4 », puis `Started SiteAmameApplication` à 11:26:16 UTC (73,6 s). PostgreSQL 15.20.

**Non vérifié** : la ligne « Variables d'environnement vides, traitées comme absentes » est écrite juste après « The following 1 profile is active » (vérifié en local), avant l'extrait transmis. Actions N.2 à N.6 et critères de sortie de l'étape 2 à faire.

**Suite, même jour (sorties transmises par l'équipe)** :

- N.2, 11:54 UTC : `backfill-sha256.sh` puis `--apply` : 28 empreintes écrites. Les 3 lignes restantes sont les lignes orphelines dont le fichier n'existe plus (id 1, 2, 4).
- N.3, 11:55 UTC : `delete-orphan-rows.sh` en simulation liste les 5 lignes orphelines de K.2. Une suppression ne touche que des lignes qu'aucune entité ne référence : rien ne change à l'affichage. Les fichiers des lignes 20 (`partenaire/`) et 31 (`concours/`) restent sur le disque, inscrits dans la file de purge, désactivée jusqu'à l'étape 3.6. **Recommandé : `--apply`.**
- N.4, 11:55 UTC : `inventory.sh` : `inventaire conforme`, 0 référence cassée (critère coché), 3 sans empreinte, 0 fichier en attente de purge.
- L'équipe déclare réussies les vérifications de l'étape 2 dans l'interface d'administration, sans sortie transmise. À 11:55, l'inventaire ne montrait encore aucune trace de ces essais (31 lignes, 0 fichier en attente de purge). Les critères se cochent sur le contenu de la file de purge, relevé après la suppression des lignes orphelines.
- N.3 et N.4, 12:04 UTC : `delete-orphan-rows.sh --apply`, 5 lignes supprimées. `inventory.sh` : 26 lignes, toutes cohérentes, 0 ligne orpheline, 0 sans empreinte (critère coché), 2 fichiers en attente de purge, `inventaire conforme`.
- À 12:04, l'inventaire ne montre toujours aucune trace des vérifications déclarées dans l'interface. Le nombre de lignes (26 = 31 − 5) et les 2 fichiers en attente de purge, ceux des lignes 20 et 31, ne laissent la place à aucun remplacement d'image ni à aucune suppression de compte avec fichiers en production. Les critères correspondants restent non cochés : ils n'ont été constatés que par l'essai local.
- **Décision de l'équipe, 17 novembre** : s'appuyer sur l'essai local (74 vérifications, avec la stack de production) pour les critères de l'étape 2 non constatés en production, comme pour l'étape 1. Ces critères ne sont pas cochés. L'étape 2 est close de ce fait, et l'étape 3 peut commencer. Le premier remplacement de fichier en production fera ce constat : il doit ajouter une entrée dans la file de purge (`inventory.sh` : « fichiers en attente de purge » augmente).

#### 17 novembre 2026 — étape 3 écrite et essayée en local, avec la stack de production et un faux Bunny

À la demande de l'équipe (« we go ahead for next »), le jour même du déploiement de l'étape 2. Le code peut précéder la production ; le déploiement attend le 24 novembre (action O.1).

**Livré dans le dépôt, non commité** (détail dans « Étape 3 — détail » et les écarts E52 à E56) :

- backend : client Bunny (`BunnyStorageClient`, client HTTP du JDK, budget de DT5), `BunnyFileStorageService`, indicateur de santé `bunnyStorage`, refus de démarrer sur une configuration incomplète, migration V5 ;
- frontend : redirection de `/uploads/` vers `MEDIA_BASE_URL` quand elle est définie ;
- exploitation : `copy-to-bunny.sh`, `reconcile-bunny.sh`, `copy-from-bunny.sh`, sauvegarde depuis Bunny (`BACKUP_FILES_SOURCE`) ; variables ajoutées aux deux stacks de production et aux exemples ;
- documentation : [ops/README.md](../ops/README.md), [CLAUDE.md](../CLAUDE.md), actions O à T et retour arrière de l'étape 3 dans ce suivi. Constat C14 (service worker).

**Vérifié en local** :

- Suite complète, `./mvnw test` : **115 tests, 0 échec** (7 min 26), dont 25 nouveaux pour Bunny : client contre un faux serveur (tentatives, délais, empreinte refusée), service, configuration, et un test d'intégration en mode `bunny` avec PostgreSQL. `SiteAmameApplicationTests` contrôle V5 : aucune contrainte non validée, empreinte `NOT NULL`.
- Images `backend-v1.4`, `frontend-v1.3` et `ops-v1.2` construites, révision `c80f0cb+etape3-non-commite`. **Ni commitées ni publiées.** Les deux fichiers de la stack `amame-ops` passent `docker compose config`.
- Avant l'essai, deux défauts corrigés dans les scripts d'exploitation : une boucle de `backup.sh` qui se terminait par `[ … ] && …` aurait fait échouer la sauvegarde sous `set -e` ; le choix du mot de passe de lecture passait par `eval`.
- **Essai de bout en bout n° 4** : stack jetable `amame-e1-v14`, la stack de production de l'équipe telle quelle, plus les cinq lignes `BUNNY_*` de l'action P.2, variables à la forme de la production (vides ou absentes comme en production). Un faux Bunny en conteneur reproduit l'API de stockage : zones distinctes, mots de passe d'écriture et de lecture seule, refus d'un envoi dont l'en-tête `Checksum` ne correspond pas, listing avec empreinte. **61 vérifications, 0 échec.**
  - **Phase A** : base créée par V1 (empreintes de la production), `backend-v1.3` et `frontend-v1.2` : base en V4. Deux comptes, dont un avec photo et CV, un article et une filière avec image.
  - **Phase B, action P** : `backend-v1.4` et `frontend-v1.3`, stockage local. « Migrating schema "public" to version "5 - file metadata required" », « now at version v5 » ; les cinq `BUNNY_*` vides sont listées parmi les variables traitées comme absentes ; frontend : « /uploads/ servi depuis le disque ». Photo et image relues à l'identique, listes publiques `200`, `inventory.sh` conforme.
  - **Phase C, action R** : un fichier du disque modifié exprès est signalé `DIVERGENT` et refusé. Simulation : 4 objets à envoyer, rien d'envoyé ; `--apply` : 4 envoyés, 0 erreur ; relance : rien à renvoyer. Les 2 fichiers privés ne sont que dans la zone privée. `reconcile-bunny.sh` : `réconciliation conforme`, **empreinte non fournie par Bunny : 0**. Un fichier privé déposé dans la zone publique rend la réconciliation non conforme ; un objet orphelin de 3 jours est signalé sans bloquer.
  - **Phase D, action S** : `STORAGE_PROVIDER=bunny`, `MEDIA_BASE_URL=https://media.amame.ml`. Journal du backend sans aucun mot de passe. L'image d'un article a une adresse `https://media.amame.ml/uploads/…` ; l'ancienne adresse `/uploads/…` répond `301` vers elle ; `/uploads/utilisateur/…` reste en `404`. La photo d'un membre est relue à l'identique depuis la zone privée, par l'API. Un nouvel article : objet dans la zone publique, rien sur le disque. Remplacement d'une image : nouvelle clé dans Bunny, ancienne clé dans la file de purge, ancien objet toujours dans Bunny. Inscription avec photo et CV : zone privée seulement. Copie de rattrapage : rien à envoyer ; réconciliation conforme, 1 objet en attente de purge. `backup.sh` avec `BACKUP_FILES_SOURCE=bunny` : « fichiers : 8 dans Bunny, 8 nouveau(x) copié(s) », puis 0 à la relance ; les fichiers privés restaurés depuis la sauvegarde ont les empreintes de la base. Mémoire du backend : 468 Mio pour une limite de 768 Mio.
  - **Phase E, retour arrière** : `STORAGE_PROVIDER=local`, `MEDIA_BASE_URL` vide. Les 4 fichiers créés depuis la bascule manquent sur le disque. `copy-from-bunny.sh` : simulation, 4 à rapatrier ; `--apply` refusé sur le montage en lecture seule du service `backup` ; dans un conteneur ponctuel (`root`, montage en écriture) : « rapatriés : 4 ; erreurs : 0 », puis rien à la relance. Image et CV relus à l'identique depuis le disque. `inventory.sh` : 7 lignes cohérentes, 1 fichier en attente de purge, `inventaire conforme`.
- **Phase F, retour arrière avant la bascule**, sur la même base : `backend-v1.3` et `frontend-v1.2` sur la base en V5. « Schema "public" has a version (5) that is newer than the latest available migration (4) ! », « Schema "public" is up to date. No migration necessary. », démarrage sans erreur. Inscription avec photo et CV `201`, article avec image : image relue à l'identique, empreinte enregistrée (64 caractères), aucune ligne sans empreinte, `inventory.sh` conforme. Retour en `backend-v1.4` et `frontend-v1.3` : aucune migration, image et CV relus. 13 vérifications réussies ; la quatorzième a échoué sur une requête du script (version `1.1` convertie en entier), la version 5 étant constatée par le journal et l'historique Flyway (`1`, `1.1`, `2`, `3`, `4`, `5`, tous réussis).
- La stack jetable est supprimée ensuite (`amame-e1-*` seulement).

**Non vérifié** : rien n'a touché le vrai Bunny. Le faux serveur suit la documentation de l'API de stockage ; l'essai réel est l'action Q.5, puis R (dont la présence de l'empreinte dans le listing, question de 3.1). Ni Pull Zone, ni DNS, ni certificat, ni navigateur : l'essai passe par `curl`. La mémoire sous 512M n'est pas mesurée (la production reste à 768M, E48). Le conteneur ponctuel du retour arrière a été lancé avec `docker run`, pas depuis le formulaire de Portainer : la procédure de [ops/README.md](../ops/README.md) a été reprise pour tenir compte de ce formulaire, qui n'accepte qu'un réseau.

**Commit et publication, même jour, avec l'autorisation de l'équipe** (« Go ahead. All users are informed about application updating. ») :

- Correctif C14 ajouté avant la construction : `navigateFallbackDenylist` dans `vite.config.ts`. Le service worker produit porte `denylist:[/^\/uploads\//,/^\/api\//]`.
- Branche locale `deploiement/v1.3` : `e318831` (backend), `a25f306` (frontend et C14), `6552a6d` (exploitation, stacks, suivi). Non poussée sur GitHub.
- Images construites depuis `6552a6d` et publiées : `backend-v1.4`, `frontend-v1.3`, `ops-v1.2` (empreintes à l'action D, identiques sur Docker Hub). Le code du backend et les scripts d'`ops` n'ont pas changé depuis l'essai. `frontend-v1.3` a été revérifiée seule après C14 : `/uploads/` servi depuis le disque (`200`), redirigé en `301` vers `https://media.amame.ml/uploads/…` avec la chaîne de requête quand `MEDIA_BASE_URL` est définie, `/uploads/utilisateur/` en `404` dans les deux cas, accueil `200`.

#### 17 novembre 2026 — étape 3 en production : mise en place dans Bunny (action Q)

L'équipe déploie l'étape 3 le jour même (E57). Elle proposait d'utiliser `amamestoragezone` : refusé, c'est la zone de sauvegarde (DT6). Deux zones neuves sont créées.

**Constaté (captures d'écran transmises par l'équipe)** :

- Zone publique : `amame-public-storage-zone`. Nom de la zone privée : à relever.
- Pull Zone `amamemedia` (`amamemedia.b-cdn.net`, *Force SSL* actif). Créée d'abord avec pour origine `https://amame.ml` (*Origin URL*), ce qui aurait fait tourner en boucle la redirection de `/uploads/` après la bascule. Corrigée : origine **Storage Zone**, `amame-public-storage-zone`.
- Nom d'hôte `media.amame.ml` ajouté à la Pull Zone, sans certificat pour l'instant. À la vérification, l'enregistrement DNS `CNAME media → amamemedia.b-cdn.net` n'existe pas encore (« Non-existent domain »).

- Le DNS d'`amame.ml` est chez Jokers Hosting (serveurs de noms `ns1` et `ns2.jokershosting.com`, panneau CentOS Web Panel). L'équipe n'y a pas accès : l'enregistrement est demandé à son gestionnaire. L'assistant « Bunny DNS » (transfert de tout le domaine) a été abandonné.
- `https://amamemedia.b-cdn.net` répond déjà : certificat valide, `http://` redirigé en `301` vers `https://`, `404` sur un objet absent. **Décision de l'équipe : basculer avec cette adresse** (E58), `media.amame.ml` plus tard.

**Reste pour l'action Q** : variables des zones dans `amame-ops` ; `copy-to-bunny.sh` en simulation. Plus tard, hors du chemin de la bascule : enregistrement DNS, certificat et *Force SSL* sur `media.amame.ml`.

**18 novembre 2026 (sortie transmise par l'équipe)** :

- Zone privée : `amame-private-storage-zone`. `BUNNY_STORAGE_ENDPOINT` laissée vide : point d'accès par défaut, `https://storage.bunnycdn.com`.
- Action Q.5, 08:15 UTC : `copy-to-bunny.sh` (simulation) dans `amame-ops-backup`, en `ops-v1.2`. Les deux zones sont listées avec leurs mots de passe : noms, mots de passe et point d'accès sont bons. « lignes file_entity : 26 ; déjà dans Bunny : 0 ; envoyées : 0 ; erreurs : 0 », « 26 objet(s) à envoyer » : 6 vers la zone privée (`uploads/utilisateur/`), 20 vers la zone publique. Aucun fichier `ABSENT` ni `DIVERGENT`.
- **Action R**, 08:22 UTC : `copy-to-bunny.sh --apply` : « envoyées : 26 ; erreurs : 0 », « copie terminée ». Relance : « déjà dans Bunny : 26 », « 0 objet(s) à envoyer ». `reconcile-bunny.sh` : 26 lignes, 20 objets dans la zone publique, 6 dans la zone privée, 26 cohérents, toutes les catégories à 0, **empreinte non fournie par Bunny : 0** (le listing de Bunny restitue l'empreinte : réponse à la question de 3.1), « réconciliation conforme ».
- 08:23 UTC : `inventory.sh` : `inventaire conforme`, 26 lignes cohérentes, 0 sans empreinte, 1 fichier orphelin (`actualite/fd838654-….pdf`, non copié, O.6), 2 en attente de purge. `backup.sh` : sauvegarde couplée `20261118T082337Z` terminée.
- **Contrôle du CDN depuis l'extérieur** (implémentation), après la copie : une image publique par `https://amamemedia.b-cdn.net/uploads/actualite/…` répond `200`, 498 832 octets (la taille de sa ligne), `image/jpeg` ; un PDF public `200`, taille identique ; une clé `uploads/utilisateur/…` répond `404` (la Pull Zone ne sert que la zone publique). Aucun cookie posé ; `Cache-Control: max-age=25600000`, sans risque puisqu'une clé n'est jamais réécrite.
- Le site sert `frontend-v1.3` (`sw.js` porte la liste d'exclusion de C14) ; `/uploads/…` est encore servi depuis le disque (`200`).
- **Action P, journal du backend** (transmis ensuite) : `backend-v1.4` démarré le 18 novembre à 08:04 UTC. « Successfully validated 7 migrations », « Current version of schema "public": 4 », « Migrating schema "public" to version "5 - file metadata required" », « Successfully applied 1 migration to schema "public", now at version v5 » (0,213 s), « Stockage local des fichiers : /app/uploads », « Started SiteAmameApplication in 61.698 seconds ». La migration V5 a donc précédé la copie de 08:22. Aucun `backup.sh` lancé à la main juste avant la mise à jour n'a été transmis (O.3) ; V5 ne modifie aucune donnée.
- **Action S, bascule** : `STORAGE_PROVIDER=bunny`, `MEDIA_BASE_URL=https://amamemedia.b-cdn.net`, zones et mots de passe d'écriture dans `amamestack`. 08:52 UTC, copie de rattrapage : « déjà dans Bunny : 26 ; envoyées : 0 ; erreurs : 0 » ; `reconcile-bunny.sh` : 26 cohérents, toutes les catégories à 0, « réconciliation conforme ». `amame-ops` mise à jour avec `BACKUP_FILES_SOURCE=bunny` (nouveau conteneur) ; 08:54 UTC, `backup.sh` : « fichiers : 26 dans Bunny, 0 nouveau(x) copié(s) » (déjà sauvegardés depuis le disque), sauvegarde couplée `20261118T085447Z` terminée.
- **Contrôlé depuis l'extérieur** (implémentation), après la bascule : `https://amame.ml/uploads/actualite/…` répond `301` vers `https://amamemedia.b-cdn.net/uploads/actualite/…` ; `https://amame.ml/uploads/utilisateur/…` répond `404` ; `/config.js` porte `mediaBaseUrl: "https://amamemedia.b-cdn.net"` ; la liste publique des articles renvoie des `fileUrl` en `https://amamemedia.b-cdn.net/uploads/…`.
- `inventory.sh` compare la base au disque : depuis la bascule, chaque nouveau fichier y apparaîtra en « référence cassée ». Le contrôle passe à `reconcile-bunny.sh` ([ops/README.md](../ops/README.md), avec la récupération d'un objet perdu, non essayée).
- **Journal du backend après la bascule** (transmis ensuite) : « Stockage des fichiers dans Bunny : zone publique amame-public-storage-zone, zone privée amame-private-storage-zone » à 08:35:39 UTC, « Started SiteAmameApplication in 51.051 seconds » à 08:35:50. La copie de rattrapage et la réconciliation de 08:52 sont donc postérieures à la bascule : aucun upload entre les deux (0 envoyé). Critères « zéro référence cassée » et « plus de `/uploads/` servi depuis le disque » cochés.
- Recette de l'action T dans l'interface et relevés à 48 h (20 novembre) : à faire.
- **Incident, 09:06:58 UTC : la création d'un article avec image échoue** (`500`, « Transaction silently rolled back because it has been marked as rollback-only », `/api/admin/articles`). Lecture du code : `BunnyFileStorageService.storeFile` a levé une `IOException` (l'envoi vers Bunny a échoué) ; le service, en `rollbackFor = Exception.class`, marque la transaction à annuler, mais `ArticleController.createArticle` porte aussi `@Transactional`, sans `rollbackFor`, et tente de valider : Spring remplace alors l'erreur d'origine par ce message (constat C15). Un refus de Bunny (`401`, `404`…) n'est écrit nulle part dans le journal, et la santé de `bunnyStorage` n'est pas affichée en production. Hypothèse principale : mot de passe d'écriture ou nom de zone erroné dans les variables d'`amamestack` (ceux d'`amame-ops` sont bons : copie et réconciliation réussies). Tant que la cause n'est pas corrigée, tout upload échoue (articles, galerie, inscription avec photo ou CV). L'article n'est pas créé (transaction annulée).
- **Cause confirmée par l'équipe** : les *Read-only passwords* avaient été saisis dans `BUNNY_PUBLIC_ZONE_KEY` et `BUNNY_PRIVATE_ZONE_KEY` d'`amamestack`. Ils suffisent pour lire (affichage des fichiers privés), pas pour écrire. Remplacés par les *Password* (ceux d'`amame-ops`), stack mise à jour. Uploads impossibles d'environ 08:35 à 09:30 UTC ; aucun fichier perdu, aucune ligne créée pendant ce temps.
- **09:30 UTC** : article n° 7 « Essai Bunny » créé avec image, puis modifié (`PUT /api/admin/articles/7` : `200`). Contrôlé de l'extérieur : `fileUrl` `https://amamemedia.b-cdn.net/uploads/actualite/df8a1ada-….jpg`, servie par le CDN (`200`, `image/jpeg`, 275 240 octets) : l'objet est dans la zone publique, écrit par le backend.
- **09:38 UTC, recette (sorties transmises)** : l'équipe déclare tous les essais réussis, vérifiés sur le site et dans le panneau Bunny. `reconcile-bunny.sh` : 26 lignes, 21 objets publics (20 + l'image de l'article n° 7), 6 privés, 26 cohérents, 0 anomalie, 1 objet en attente de purge (l'image de l'article n° 7, supprimé), `réconciliation conforme`. `backup.sh` : « fichiers : 27 dans Bunny, 1 nouveau(x) copié(s) », dump `20261118T093822Z` envoyé. **Constaté** : upload public dans Bunny, suppression d'un article (ligne supprimée, objet en file de purge, encore présent), sauvegarde depuis Bunny. **Non constaté par ces chiffres** : remplacement d'une image (il aurait donné 22 objets publics et 2 en attente de purge) ; écriture dans la zone privée (toujours 6 objets : aucune photo ni CV envoyé depuis la bascule), donc le *Password* de la zone privée dans `amamestack` n'est pas encore éprouvé. Demandé : un upload privé (inscription de test avec photo et CV, ou changement de photo d'un membre), puis `reconcile-bunny.sh`. L'équipe confirme n'avoir fait ni remplacement d'image ni inscription : les chiffres concordent.
- **09:50 UTC, zone privée (sorties transmises)** : inscription de test avec photo et CV. `reconcile-bunny.sh` : 28 lignes, 21 objets publics, **8 privés** (6 + photo + CV), 28 cohérents, `réconciliation conforme` : le *Password* de la zone privée est bon. Compte supprimé depuis l'administration ; 09:51 UTC : 26 lignes, 26 cohérents, **3 objets en attente de purge** (image de l'article n° 7, photo et CV du compte), toujours présents dans Bunny, `réconciliation conforme`. La suppression d'un compte avec fichiers réussit (C7) et passe par la file de purge.
- **10:00 UTC, `restore-test.sh` échoue (constat C16)** sur le dump `20261118T093822Z` : `pg_restore` refuse `ALTER TABLE ONLY … ALTER COLUMN … SET (pg_attver=…)` (« unrecognized parameter "pg_attver" »), 31 erreurs. Colonnes concernées dans le dump : `file_entity.file_sha256` (`pg_attver=40864848`), toutes celles de `flyway_schema_history` (`40701088`) et de `storage_purge_queue` (`41107640`), c'est-à-dire exactement les colonnes créées en production depuis le 16 novembre (baseline Flyway, V2, V3). Chaque `CREATE TABLE` part avec ses `ALTER … SET` dans la même commande : les trois tables ne sont pas restaurées, ni leurs données, contraintes, déclencheurs et clés étrangères. Le test s'arrête ensuite sur `relation "file_entity" does not exist`. `pg_attver` n'est ni dans le dépôt ni dans la documentation publique de PostgreSQL. **La production fonctionne** ; ce sont les dumps postérieurs au 16 novembre qui ne se restaurent pas tels quels. **Purge (3.6) suspendue** tant qu'une restauration complète n'est pas constatée : sa rétention de 10 jours suppose une base restaurable.
- **Diagnostic (sorties transmises)** : base en **PostgreSQL 15.20** ; 18 colonnes portent `pg_attver` (celles du dump) ; aucun déclencheur d'évènement, `shared_preload_libraries` vide, seule extension `plpgsql`, seul compte `postgres`. Image `ops-v1.2` : `postgres` et `pg_dump` en **15.19**. Cause trouvée dans le commit `c23382f0` de PostgreSQL (CVE-2026-6460), détail au constat C16.
- **Essai local du correctif** (implémentation) : image `ops-v1.2.1`, même code, reconstruite avec `docker build --pull` sur `postgres:15-alpine` en 15.20 (`postgres`, `pg_dump`, `pg_restore` 15.20). Base jetable `postgres:15.20-alpine`, schéma par V1 à V5 et une table `flyway_schema_history`, une ligne `file_entity` référencée par un partenaire, faux Bunny pour la zone de sauvegarde. **9 vérifications, 0 échec** : colonnes marquées `pg_attver` comme en production ; `ops-v1.2` : sauvegarde, puis `restore-test.sh` en échec sur `unrecognized parameter "pg_attver"` (reproduit) ; `ops-v1.2.1` : `restore-test.sh` du **même dump** fait en 15.19 réussi, sans erreur de `pg_restore` (27 tables, ligne référencée retrouvée, fichier vérifié) ; nouvelle sauvegarde et `restore-test.sh` réussis. Lignes `pg_attver` : 217 dans le dump fait en 15.19, **0** dans celui fait en 15.20. **Les dumps déjà faits sont donc sains** : ils se restaurent avec un `pg_restore` et un serveur en 15.20.
- **Publication, avec l'accord de l'équipe** (« Ok, commite et publie ops-v1.2.1 ») : commit `a590e48` ; `ops-v1.2.1` reconstruite depuis ce commit, couches identiques à l'image essayée, publiée (empreinte à l'action D, identique sur Docker Hub). À faire par l'équipe : `OPS_IMAGE_TAG=ops-v1.2.1` dans `amame-ops`, mise à jour avec *Re-pull image*, puis `restore-test.sh`.
- **11:16 UTC, en production (sortie transmise)** : `amame-ops` en `ops-v1.2.1`, `postgres --version` : 15.20. `restore-test.sh` sur le dump `20261118T093822Z` (fait par `ops-v1.2`, 15.19) : 27 tables, « lignes file_entity : 26 au total, 26 référencée(s) », 30 fichiers dans la sauvegarde dont 4 sans ligne référencée (le PDF orphelin, les 2 fichiers de l'étape 2 en attente de purge, l'image de l'article n° 7 supprimé), « 0 fichier(s) manquant(s), 0 écart(s) de taille », **« test de restauration RÉUSSI »**. Constat C16 réglé ; la purge n'est plus suspendue pour cette raison (elle attend encore les 48 h, 3.6).


#### 18 novembre 2026 — étape 4 préparée et essayée en local (PostgreSQL 17, puis 18)

À la demande de l'équipe (« on passe à l'étape suivante »). La bascule elle-même attend le 25 novembre (DT2) ; tout ce qui précède peut se faire avant.

**Écrit** (non commité) : [db-transfer.sh](../ops/backup/db-transfer.sh), [db-compare.sh](../ops/backup/db-compare.sh), [db-grants.sql](../ops/backup/db-grants.sql), copiés dans l'image `ops` ; SQL des rôles et de la base, et procédure du conteneur ponctuel, dans [ops/README.md](../ops/README.md) ; `SPRING_DATASOURCE_PASSWORD` retirée d'[amamestack.yml](../deploy/portainer/amamestack.yml) (C17) ; actions U à X et retour arrière de l'étape 4.

**Suite de tests du backend** : `./mvnw test -Dtest.postgres.image=postgres:17-alpine` : 115 tests, 0 échec (17.12). Puis, après le relevé de la console, `postgres:18-alpine` : 115 tests, 0 échec (18.7).

**Essai local n° 5** (stack de production copiée, base 15.20 comme la production, PostgreSQL 17 à la place de Neon, faux Bunny) :

- phase A, production : V1 puis `backend-v1.4` (baseline, 1.1 à 5), deux inscriptions avec fichiers, articles, une suppression en file de purge ; 217 colonnes marquées `pg_attver` sur la source (C16) ;
- phase B, « Neon » : le SQL donné à l'équipe, exécuté par un propriétaire de console qui n'est pas superutilisateur (`CREATEROLE`, `CREATEDB`) : rôles et base créés, aucun rôle applicatif superutilisateur ;
- phase C, transfert par `ops-v1.3` : simulation sans effet ; transfert en 8 s, `bases identiques` sur les 9 points (27 tables, 16 lignes, 3 clés de fichiers, 81 contraintes, 50 index, 20 séquences) ; refus d'une cible pleine et d'un rôle non propriétaire ;
- phase D, `backend-v1.4` sur la cible (`amame_app`, Flyway en `amame_owner`) : « up to date », listes publiques, connexion d'un compte transféré, lecture d'une photo privée, inscription avec fichiers, déclencheur de purge exécuté par `amame_app` ;
- phase E, droits : le scraper insère dans `bourse`, et rien d'autre ; le backend ne peut ni modifier l'historique Flyway ni le schéma ; la sauvegarde lit et n'écrit pas ; droits par défaut d'une table créée par une migration future (app écrit, sauvegarde lit, scraper rien) ;
- phase F : `backup.sh`, `restore-test.sh` et `inventory.sh` avec `amame_backup` ;
- phase G, retour arrière après écritures sur la cible : `pg_restore` direct vers 15.20 refusé (`SET transaction_timeout`), puis réussi par `psql` sans cette ligne ; backend revenu sur la base d'origine, « up to date », compte créé sur la cible présent et utilisable.

Premier passage : phase D en échec, « password authentication failed for user amame_app » : la ligne `SPRING_DATASOURCE_PASSWORD` de la stack l'emportait sur `DATABASE_PASSWORD` (constat C17). Le même passage a montré qu'après un transfert manqué, un backend démarré sur la cible vide y aurait créé un schéma par Flyway : l'essai s'arrête désormais après la phase C en cas d'échec, et la règle est écrite (action U). Après correction : **40 vérifications, 0 échec**.

**Relevé de la console Neon** (transmis par l'équipe) : projet `amame-site`, Francfort, **PostgreSQL 18**, plan **Launch**, branche `production`, calcul 0,25 ↔ 8 CU, historique 6 heures (faits relevés, « Projet Neon » ; E59, E60). Conséquences, traitées le jour même :

- **essai n° 6** : le même, avec PostgreSQL 18.7 à la place de Neon et une image `ops` construite sur 18.7. **40 vérifications, 0 échec**. Écart corrigé avant le passage : 18 inscrit les NOT NULL dans `pg_constraint`, `db-compare.sh` ne les y compare plus. Flyway 10.20 avertit que 18 n'est pas testée et valide le schéma (E59). Retour arrière 18 → 15.20 par `psql`, comme depuis 17 ;
- **TLS vers Neon**, essayé contre le proxy de Neon avec un point d'accès et un compte fictifs : `ops-v1.3` et le backend vérifient le certificat et le nom d'hôte ; l'image des scrapers échoue avec `sslrootcert=system` et passe avec le fichier de certificats du système (C18) ;
- **garde-fou** : ancienne base en lecture seule après le transfert (W.4), essayé sur une base 15.20 jetable : écriture refusée, lecture et `pg_dump` possibles, levée depuis la base `postgres`.

**Action U, en production** (sortie transmise par l'équipe) : `SHOW server_version` : `18.7 (84da7d8)`, la version de `ops-v1.3`. L'équipe déclare avoir appliqué les réglages recommandés (calcul, veille, historique). Mot de passe de `amame-site-owner` réinitialisé (U.1, déclaré par l'équipe). Rôles et base (U.5), sorties transmises : `amame_app`, `amame_backup`, `amame_owner` et `amame_scraper`, aucun superutilisateur, aucun droit de créer un rôle ou une base ; `amame_db` appartient à `amame_owner`. **Action U faite.** L'hôte direct (U.6) reste chez l'équipe, hors du dépôt. Second relevé de la page du projet : calcul 0,25 ↔ 1 CU (conforme) ; historique à **1 jour** et non 7 (à confirmer : la restauration à un instant donné ne couvre alors que 24 heures, au-delà c'est le dump de la nuit) ; 0,08 CU-h consommés depuis le 17 novembre.

#### 19 novembre 2026 — `ops-v1.3` publiée, bascule avancée (E61)

- **Commit** `a9864c1` sur `deploiement/v1.3`, avec l'accord de l'équipe (« Ok, commite et publie ops-v1.3 ») : outils de transfert et de comparaison, `Dockerfile`, `amamestack.yml` sans `SPRING_DATASOURCE_PASSWORD`, suivi. Aucun secret ni hôte Neon dans le diff (recherche faite avant le commit).
- **Image** : `docker build --pull --build-arg PG_MAJOR=18`, étiquette de révision `a9864c1`. PostgreSQL 18.7 (`postgres`, `pg_dump`, `pg_restore`, `psql`), Alpine 3.24.4, scripts et `db-grants.sql` identiques à ceux de l'image essayée le 18 novembre (même empreinte globale), droits et utilisateur `postgres` inchangés. Couches de base différentes : `postgres:18-alpine` a été reconstruite en amont le 18 novembre, seul paquet changé `gnutls` 3.8.13 → 3.8.14. L'image publiée n'étant plus celle des essais, **essai n° 7** refait avec elle (même script que l'essai n° 6, « Neon » en `postgres:18-alpine`) : **40 vérifications, 0 échec** (transfert, 9 points identiques, backend sur la cible, droits, sauvegarde et restauration par `amame_backup`, retour arrière). Conteneurs et volumes de l'essai supprimés.
- **Publication** : empreinte `sha256:41300a07…` relue sur Docker Hub, identique à l'image locale (action D).
- **Page du projet Neon, second relevé** (18 novembre au soir) : calcul 0,25 ↔ 1 CU, conforme ; historique **1 jour** au lieu des 7 recommandés (E60), à confirmer par l'équipe ; 0,08 CU-h depuis le 17 novembre.
- **Décision de l'équipe** (E61) : bascule dès que la répétition a réussi, sans attendre le 25 novembre ; utilisateurs informés. Docker Desktop démarré par l'équipe pour la construction.

Non vérifié : rien de nouveau dans le dépôt ; tout le reste de l'étape se constate en production (actions V à X).

**Action V, en production** (sorties transmises par l'équipe) :

- **V.1–V.2** : branche `repetition` créée depuis `production` ; conteneur ponctuel `amame-transfert` (`ops-v1.3`, `common_net` et `amame-ops_sortie`).
- **Premier essai de V.3, 08:55 UTC** : `password authentication failed for user 'amame_owner'`, arrêt au contrôle de connexion, rien de transféré. Contrôle sans secret dans la console : la partie mot de passe de `TARGET_DATABASE_URL` comptait 41 caractères dont un hors lettres et chiffres, code `3a`, un **deux-points en trop** (seul le premier `:` sépare le rôle du mot de passe). Variable corrigée par l'équipe. Note pour les commandes données à l'équipe : le `grep` de l'image `ops` est celui de BusyBox (pas d'option `-b`).
- **V.3, 09:36 UTC** : simulation puis transfert. Source PostgreSQL 15.20 (`postgres`), cible 18.7 (`amame_owner`), outils 18.7 ; autres connexions ouvertes sur la source : 0 (le pool du backend de production ne garde aucune connexion inactive) ; dump de 235 768 octets, restauration en 3 s, droits appliqués ; **neuf points identiques** (lignes 27 tables, fichiers 26, Flyway 6, colonnes 217, contraintes 81, déclencheurs 3, fonctions 3, index 50, séquences 20) : `bases identiques : 27 tables, 604 lignes, 26 clés de fichiers`, transfert en 6 s.
- **V.4, premiers essais** : lancé d'abord dans la console d'un autre conteneur (outils 15.20, sans doute `amame-ops-backup`) : `pg_dump` refuse un serveur 18, rien de lu ; consigne donnée d'y effacer l'historique de l'interpréteur (`history -c; unset HISTFILE`, ou `rm -f ~/.bash_history`). Puis, dans `amame-transfert`, l'invite `/tmp$` collée avec la commande : rien d'exécuté. **La ligne de commande transmise dans la conversation contenait le mot de passe de `amame_backup` et l'hôte de `repetition`** : mot de passe exposé. Suite : **le changer sur la branche `production` avant W.8** (la branche `repetition` garde sa propre copie des rôles) ; **supprimer la branche `repetition` dès la fin de la répétition** (V.9), puisqu'elle contient une copie complète des données ; les commandes données ensuite demandent le mot de passe sans l'afficher (`read -rs`).
- **V.4** : `pg_dump` par `amame_backup` sur `repetition`, depuis `amame-transfert` (outils 18.7) : **27** tables avec leurs données dans le dump (`TABLE DATA`), le nombre attendu. Les droits posés par `db-grants.sql` suffisent à la sauvegarde.
- **V.5** : backend ponctuel `amame-repetition` (`backend-v1.4`, `amame-ops_sortie` seul, 512 Mo, profil `prod`, stockage local) : `Started SiteAmameApplication in 42.367 seconds` à 11:37:54 UTC, `Stockage local des fichiers : /app/uploads`. Journal : `Database: jdbc:postgresql://ep-…/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory (PostgreSQL 18.7)` ; avertissement de Flyway sur PostgreSQL 18.7 (« latest supported version … is 17 », sans effet, E59) ; `Successfully validated 7 migrations`, `Current version of schema "public": 5`, `Schema "public" is up to date. No migration necessary.` ; `Cache des listes publiques : désactivé`, comme en production (`PUBLIC_LISTS_CACHE_TTL=0` dans `amamestack`) : la comparaison des temps n'est pas faussée par le cache.
- **V.6** : `/api/visitor/bourses` et `/api/visitor/articles/search` : `200`.
- **V.7, première série à chaud** (10 appels chacun, depuis `amame-transfert`) : médiane **79,5 ms** sur Neon contre **52,5 ms** pour le backend de production (base du VPS), soit **+27 ms**, au-dessus du seuil de 20 ms du critère. Série non concluante : JVM démarrée deux minutes plus tôt, temps croissants (médiane 65 ms sur les cinq premiers, 117 ms sur les cinq derniers), appels non alternés. Hypothèse à vérifier : chaque appel fait plusieurs allers-retours vers la base (page, comptage, fin de transaction), chacun allongé du trajet VPS ↔ Francfort. Réveil à froid lancé vers 11:40 UTC (`nohup`, dix appels espacés de 400 s).
- **Décision de l'équipe** (« on enchaîne… jusqu'à la bascule fonctionnelle ») : on n'attend pas la fin du réveil à froid, qui continue seul dans `amame-transfert` ; le réveil est un critère de fin d'étape, pas un préalable à la bascule. Mesures à chaud alternées et temps d'un `SELECT 1` demandés juste avant l'arrêt du backend (sorties non reçues à ce stade).

**Action W, en production, le 19 novembre** (sorties transmises par l'équipe) :

- **W.0–W.2** (déclarés par l'équipe) : nouveau mot de passe de `amame_backup` sur `production` (et sur `repetition`) ; `backup.sh` réussi ; `amame-backend` **arrêté avant le transfert**.
- **W.3, 12:29 UTC** : transfert vers la branche `production` depuis une nouvelle console d'`amame-transfert` (`TARGET_DATABASE_URL` redéfinie dans la session, mot de passe saisi sans affichage). Simulation : source 15.20, autres connexions ouvertes 0, **cible vide** (donc pas `repetition`, qui contient déjà les tables). Transfert : dump de 235 768 octets (même taille que le matin), restauration en 3 s, droits appliqués, **neuf points identiques**, `bases identiques : 27 tables, 604 lignes, 26 clés de fichiers`, transfert en 9 s.
- **W.4** : `ALTER DATABASE amame_db SET default_transaction_read_only = on` dans `amame-database` : `ALTER DATABASE`.
- **W.5–W.6, 13:07 UTC** : `amamestack` mise à jour. Journal : `Database: jdbc:postgresql://ep-…/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory (PostgreSQL 18.7)`, l'hôte de la branche `production` (différent de celui de `repetition`) ; avertissement de Flyway sur la version 18 (E59) ; `Successfully validated 7 migrations`, `Current version of schema "public": 5`, `Schema "public" is up to date. No migration necessary.` ; `Stockage des fichiers dans Bunny : zone publique amame-public-storage-zone, zone privée amame-private-storage-zone` ; `Started SiteAmameApplication in 84.074 seconds` à 13:08:32 UTC, première requête servie à 13:08:45. **Le site tourne sur Neon depuis 13:08 UTC.**
- **W.7** (déclarée par l'équipe) : connexion, déconnexion et listes fonctionnent ; une connexion écrit un jeton de renouvellement, donc `amame_app` écrit sur Neon. Article de test avec image : créé, images affichées. Sa suppression n'est pas confirmée : `file_entity` compte 27 lignes à 13:32 contre 26 au transfert (voir W.8).
- **W.8, 13:32 UTC** : `amame-ops` en `ops-v1.3`, URL de `amame_backup` et `amame_scraper` sur `production`. `postgres --version` : 18.7. `backup.sh` : sauvegarde couplée `20261119T133206Z`, dump lu sur Neon (252 994 octets avant chiffrement), 30 fichiers dans Bunny, 1 nouveau copié. `restore-test.sh` : 27 tables, « lignes file_entity : 27 au total, 27 référencée(s) », 33 fichiers dans la sauvegarde dont 6 sans ligne référencée, 0 manquant, 0 écart de taille, **« test de restauration RÉUSSI »**. `reconcile-bunny.sh` : 27 lignes, 21 objets publics et 9 privés, 27 cohérents, **0 référence cassée**, 0 objet dans la mauvaise zone, 0 fichier privé en zone publique, 0 écart de taille ou d'empreinte, 0 orphelin, 3 objets en attente de purge : **« réconciliation conforme »**.
- **Après W.8, 13:48 UTC** : `reconcile-bunny.sh` : 27 lignes, 22 objets publics (+1) et 9 privés, 27 cohérents, 0 référence cassée, **4 objets en attente de purge (+1)**, conforme. Une ligne `file_entity` a donc été supprimée sur Neon et inscrite dans la file de purge par le déclencheur (V3), avec les droits de `amame_app` ; un envoi a eu lieu dans le même intervalle (image remplacée ou nouvel article : l'équipe vérifie qu'aucun article de test ne reste en ligne).
- **Mesures après la bascule** (depuis `amame-ops-backup`) : backend de production sur Neon, JVM chaude, 30 appels à `/api/visitor/bourses` : **médiane 83,4 ms** (min 51,4, max 216,8), contre 52,5 ms ce matin sur la base du VPS : **+31 ms**, cohérent avec la répétition (+27 ms). Aller-retour d'un `SELECT 1` vers Neon : 8,8 ms (premier) puis 5,0 à 5,9 ms, **médiane 5,5 ms** ; celui vers la base du VPS n'a pas été mesuré (`SOURCE_DATABASE_URL` n'existe pas dans ce conteneur), il est de l'ordre de la milliseconde sur le réseau Docker de l'hôte. **Le critère des 20 ms n'est pas atteint** : l'écart est structurel (au moins trois allers-retours par appel, page, comptage et fin de transaction, chacun de 5,5 ms, et une exécution plus lente sur 0,25 CU). Décision à prendre par l'équipe (accepter l'écart, activer `PUBLIC_LISTS_CACHE_TTL`).
- **Réveil à froid** (V.7, branche `repetition`, dix appels espacés de 400 s à partir de 11:40 UTC environ, lus dans `amame-transfert`) : 1,320 ; 1,007 ; 1,233 ; 0,883 ; 0,979 ; 0,309 ; 0,395 ; 1,384 ; 1,020 ; 1,119 s. **Médiane des dix : 1,01 s.** Les deux valeurs de 0,3 à 0,4 s ne sont pas des réveils : base déjà éveillée (vraisemblablement par le changement de mot de passe de `amame_backup` sur `repetition` dans le *SQL Editor*), mais connexion à rouvrir (TLS et authentification). Sur les huit vrais réveils : médiane 1,07 s, de 0,88 à 1,38 s. Seuils du §6.3 (suivi, E60) : alerte au-delà de 1 s, action au-delà de 2 s ou en cas de plaintes : **au niveau du seuil d'alerte, sous celui d'action** ; à surveiller par la mesure mensuelle. Le cache des listes publiques, s'il est activé, épargne aussi ce réveil aux pages en cache.
- **V.8, consommation** (page du projet, après 14:00 UTC) : **0,35 CU-h** depuis le 17 novembre (0,08 la veille au soir), 42,28 Mo de stockage, 4,47 Mo d'historique. Le détail par branche n'a pas été relevé : les 0,27 CU-h de la journée réunissent la répétition, la production depuis 13:08 UTC et le *SQL Editor*. Valeur sans doute provisoire : dix réveils de la branche `repetition` coûtent à eux seuls au moins 10 × 5 min à 0,25 CU, soit 0,21 CU-h, et la console agrège la consommation avec retard. Les relevés quotidiens de l'action X donneront la projection.
- **Décisions de l'équipe** (E62) : historique Neon à 1 jour, voulu ; écart de 31 ms accepté et compensé par le cache des listes publiques. L'équipe indique `PUBLIC_LISTS_CACHE_TTL` « déjà à 10 » (le journal de 13:08 affichait encore `désactivé`) : sans unité, c'est 10 ms ; valeur à écrire `10m`, à constater dans le journal (`Cache des listes publiques : actif, durée PT10M`).
- **V.9, nettoyage** (déclaré par l'équipe) : conteneurs `amame-repetition` et `amame-transfert` supprimés, **branche `repetition` supprimée** (elle contenait une copie complète des données). L'équipe indique `PUBLIC_LISTS_CACHE_TTL=10m` déjà en place ; non constaté : le journal de 13:08 affichait `désactivé` et la série de 13:50 (médiane 83,4 ms sur 30 appels identiques) n'a pas été servie par un cache. **Constaté ensuite** (journal du dernier démarrage d'`amame-backend`, transmis par l'équipe) : `Cache des listes publiques : actif, durée PT10M`.
- **Publication sur GitHub, à la demande de l'équipe** (« on va pousser le tout pour mettre la branche main à jour ») : `origin/main` (`ba50a0a`) est un ancêtre de `deploiement/v1.3` : `main` avance sans fusion jusqu'à la pointe de `deploiement/v1.3`, puis est poussée. Contrôle avant publication des commits depuis `ba50a0a` : aucun fichier `.env`, dump, clé ou fichier d'`uploads/` ; aucun binaire ; aucun hôte ni identifiant Neon, aucun mot de passe (gabarits `<…>` seulement) ; adresses IP : réseaux internes de Docker et serveurs DNS publics. Les modèles de variables Portainer ([amamestack.env.example](../deploy/portainer/amamestack.env.example), [amame-ops.env.example](../deploy/portainer/amame-ops.env.example)), restés à l'étape 2, passent à l'état de la production : tags courants, variables Bunny (étape 3), `DATABASE_*` et URL Neon (étape 4), `BACKUP_FILES_SOURCE=bunny`, `PUBLIC_LISTS_CACHE_TTL=10m`. Sans cela, une stack recréée depuis ce modèle aurait démarré sur l'ancienne base en lecture seule.
- **Incident de suivi, ter** : troisième réécriture de ce fichier par l'éditeur, à 14:32:13 UTC (version d'environ 13:45), enregistrée par erreur dans `1336f8b` ; version de `e4dc81b` rétablie, puis E62 ajouté.
- **Incident de suivi, bis** : nouvelle réécriture de ce fichier par l'éditeur à 13:49:58 UTC (retour de « Prochaine action » et de l'action X à un état antérieur), enregistrée par erreur dans `1201975` ; version de `2ca9a3f` rétablie, puis ce paragraphe ajouté.
- **Action X, dans le dépôt** (après W.8) : image des quatre tests sur PostgreSQL en `postgres:18-alpine` (E19) ; `ops-v1.3` et `OPS_PG_MAJOR=18` par défaut (`ops/docker-compose.yml`, `deploy/portainer/amame-ops.yml`, `Dockerfile`, `.env.example`, README d'exploitation, CLAUDE.md). `./mvnw test` : **115 tests, 0 échec**, les quatre tests d'intégration sur PostgreSQL 18.7 ; `docker compose config` valide les deux fichiers d'exploitation. `AMAME_NETWORK` gardée (retour arrière) ; base locale de développement laissée en 15 (cas de `restore-db.sh` documenté). Le fichier de production `amame-ops.yml` ne change que par sa valeur par défaut et ses commentaires : rien à recoller dans Portainer.
- **Incident de suivi** : ce fichier a été réécrit à 12:58 UTC avec une version antérieure (éditeur ouvert sur le fichier), ce qui a effacé les paragraphes V.5 à W.3 ; rétablis le même jour à partir des sorties transmises.

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
- [x] Secrets changés ; `git ls-files` ne liste plus ni les `.env` ni `backend/uploads/`. **Constaté le 15 novembre 2026** : mot de passe de la base, `JWT_SECRET` et mot de passe d'application Gmail neufs, l'ancien révoqué (déclaré par l'équipe) ; `git ls-files` ne suit que `.env.example`, rien sous `backend/uploads/`. Hors de ce critère : le mot de passe du rôle Neon, transmis dans une conversation, est à réinitialiser avant l'étape 4 (faits relevés, « Projet Neon »).
- [x] Toute URL `/uploads/utilisateur/…` ou `/amame-uploads/utilisateur/…` renvoie 404 (écart E2). **Constaté le 15 novembre 2026** : avec un fichier réel de `/app/uploads/utilisateur/`, ouvert en fenêtre privée, 404 par les deux chemins.
- [x] Le couple dump + fichiers, lu dans `amame-backups`, a été restauré dans un environnement jetable (`restore-test.sh`). **Constaté le 14 novembre 2026** : zone `amamestoragezone` (E40), dump `amame-20261114T114150Z`, 25 tables restaurées.
- [x] Dans cette restauration, chaque ligne `file_entity` référencée retrouve son fichier. **Constaté le 14 novembre 2026** : 26 lignes référencées sur 31, 0 fichier manquant, 0 écart de taille (vérification `full`).
- [x] Une inscription envoyée avec `role=SUPERADMIN` crée un compte `USER`, et tous les comptes `SUPERADMIN`, `ADMIN` et `EDITOR` existants sont connus de l'équipe (écart E10). **Constaté le 15 novembre 2026** (déclaré par l'équipe) : requête multipart sur `/api/visitor/register` avec `role: 'SUPERADMIN'`, réponse `201` et rôle `USER` ; comptes à privilèges relevés dans `users`, tous identifiés.
- [x] Un utilisateur connecté ne peut lire ni le profil ni les fichiers d'un autre (écarts E1 et E11). **Constaté côté serveur le 16 novembre 2026** : connecté en `USER` (compte de test 39, sans fichier), `403` sur les 199 autres profils et sur tous les fichiers privés des autres comptes, y compris en forçant l'appel au serveur (`cache: 'no-store'`). Quatre photos ont d'abord semblé lisibles : elles venaient du cache du navigateur, utilisé plus tôt sous un compte Super Admin. Ce défaut côté navigateur est suivi à part (E44). L'essai du 15 novembre était sans valeur (`401`, pas connecté).
- [x] Les images de l'accueil pèsent moins de 1,5 Mo. **Constaté le 16 novembre 2026** (sortie transmise par l'équipe, mesure par `performance.getEntriesByType`, `encodedBodySize`) :
  - **mesure, fenêtre de 540 px, densité 1** : images 0,16 Mo (10 fichiers, la plus lourde `section-benevolat-640.webp`, 30 Ko) ; page entière 1,08 Mo, dont 0,72 Mo de JavaScript ;
  - **pire cas, calculé et non mesuré** : 0,68 Mo environ. Calcul : la plus grande variante de chaque image de l'accueil publiée dans l'image `v1.1.1` (`-1920.webp`, 671 Ko pour les 8 images), plus les deux petits fichiers de taille fixe (environ 25 Ko).

  Le critère tient donc pour toute largeur d'écran. Le poids de la page entière relève de l'étape 5 : il atteindrait environ 1,6 Mo sur un grand écran. Le plus gros poste est le JavaScript.

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

- [x] La recette [B02 §8.2] est passée. *(18 novembre 2026, action T)*
- [x] La réconciliation indique zéro référence cassée et zéro écart d'empreinte. *(18 novembre 2026, action T)*
- [ ] Aucun 404 sur les médias dans les journaux pendant 48 h.
- [x] Plus aucune requête `/uploads/` n'est servie depuis le disque du VPS. *(18 novembre 2026, action T)*

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

- [x] La recette et les mesures [N02 §8] sont passées. *(19 novembre 2026 : recette V.6, W.6 à W.8 ; mesures V.7 et après la bascule ; l'écart de temps de réponse est traité par E62)*
- [x] Le nombre de lignes par table et la liste des clés sont identiques des deux côtés. *(19 novembre 2026, action W.3 : `bases identiques`, 27 tables, 604 lignes, 26 clés)*
- [x] La réconciliation indique zéro référence cassée. *(19 novembre 2026, action W.8 : 27 lignes cohérentes, 0 référence cassée, 0 écart d'empreinte, sur Neon)*
- [ ] Le temps de réponse médian, hors réveil à froid, ne dépasse pas la référence de plus de 20 ms. **Non atteint** (+31 ms, structurel) : écart accepté, compensé par le cache des listes publiques (E62)
- [x] Le réveil à froid est mesuré et consigné. *(19 novembre 2026, action V.7 : médiane 1,01 s sur dix mesures, 1,07 s sur les huit vrais réveils ; au niveau du seuil d'alerte du §6.3, sous celui d'action)*
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

Le `.env.example` du dépôt documente toutes les variables, sans aucune valeur secrète. En production, les valeurs sont saisies dans les variables des stacks Portainer, dont le contenu vient de [deploy/portainer/](../deploy/portainer/) (E39).

### 7.1 Stack `amame` (application)

| Variable | Utilisée par | Secret | Introduite à l'étape | Remarque |
| --- | --- | --- | --- | --- |
| `BACKEND_IMAGE_TAG`, `FRONTEND_IMAGE_TAG` | stack | non | 0 | versionnés ; le retour arrière consiste à remettre le tag précédent. Sans valeur par défaut dans le fichier de production (E39) |
| `UPLOADS_HOST_PATH` | stack de production : backend et frontend | non | 0 | chemin absolu des uploads sur l'hôte, même valeur que dans `amame-ops` (E39). Inutile après l'étape 3 |
| `BACKEND_MEMORY_LIMIT` | stack de production | non | 0 | 512M par défaut ; 768M pendant l'étape 0 seulement (E39) |
| `POSTGRES_PASSWORD` | base locale, backend | oui | 0 | mot de passe de la base du VPS. PostgreSQL ne le lit qu'à la création du volume : le changer d'abord par `ALTER USER`. Disparaît avec la base locale (étape 6) |
| `JWT_SECRET` | backend | oui | 0 | plus aucune valeur par défaut dans le compose |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | backend | mot de passe : oui | 0 | vides en temps normal ; créent le premier administrateur sur une table des utilisateurs vide |
| `PGADMIN_PASSWORD` | pgAdmin | oui | 0 | outil accessible sur `127.0.0.1` seulement. `GRAFANA_ADMIN_PASSWORD` a disparu avec la supervision (écart E14) |
| `FRONTEND`, `COOKIE_DOMAIN`, `COOKIE_SECURE` | backend | non | 0 | valeurs locales par défaut dans le compose de développement ; en production `https://amame.ml`, `.amame.ml` et `true`, valeurs par défaut du fichier de production |
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
