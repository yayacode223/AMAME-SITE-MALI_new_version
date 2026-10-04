# État des lieux — Base de données PostgreSQL (AMAME)

| | |
| --- | --- |
| **Date** | 30 septembre 2026 |
| **Base analysée** | branche `main`, commit `0e43556` + observation du site en production (`https://amame.ml`) |
| **Périmètre** | configuration JPA/Hibernate et HikariCP, entités, repositories, Docker Compose, supervision, scrapers Python, tests |
| **Nature** | audit en lecture seule : aucun fichier de code n'a été modifié |
| **Documents liés** | [02 — Plan de migration vers Neon](02-plan-migration-neon.md) · audit du stockage de fichiers : [../bunny/01-etat-des-lieux-stockage.md](../bunny/01-etat-des-lieux-stockage.md) |

---

## Résumé

1. **PostgreSQL 15 tourne dans un conteneur sur le VPS de production** (Contabo, Lauterbourg, France), avec un volume Docker local. Comme les fichiers uploadés, les données vivent sur le disque de ce serveur unique : le backend ne peut pas être dupliqué ni déplacé sans elles.
2. **Aucune sauvegarde.** Ni `pg_dump` planifié, ni copie du volume, ni restauration à un instant donné. Perdre le disque ou supprimer le volume par erreur ferait perdre tous les comptes, adhésions, cotisations et dons. Le conteneur `database` n'a pas non plus de politique de redémarrage : après un redémarrage du VPS, il ne repart pas tout seul.
3. **Le schéma est piloté par Hibernate (`ddl-auto=update`) en production**, alors que le fichier indique juste au-dessus « Ne pas modifier le schéma en prod ». Il n'y a ni migrations versionnées ni historique des changements de schéma.
4. **Sécurité faible.**
   - L'application se connecte avec le superutilisateur `postgres` / `postgres`, identifiants écrits en dur à au moins dix endroits, dont les trois scrapers.
   - pgAdmin est configuré **sans authentification** (mode « desktop ») et Grafana avec `admin` / `adminpass`. Leurs ports ne répondaient pas depuis Internet le 30/09/2026 (pare-feu), mais la configuration versionnée les publie.
   - Un initialiseur crée un compte administrateur dont l'e-mail et le mot de passe sont écrits dans le code, donc dans Git.
5. **La base est minuscule** : 61 bourses, 6 filières, 5 articles, 3 ressources, 2 établissements (comptages publics). Elle tient largement dans les offres d'entrée de gamme de Neon.
6. **Certains accès sont sensibles à la latence réseau.** Tant que la base est sur la même machine, un aller-retour coûte moins d'une milliseconde. Avec une base distante, **chaque requête SQL coûte un aller-retour réseau**. Or :
   - le filtre JWT fait 2 requêtes à chaque appel authentifié ;
   - six listes font des requêtes « N+1 » (une requête par élément affiché) ;
   - le comptage des catégories d'articles fait une requête par catégorie.

   Ces points sont à corriger **avant** de déplacer la base.
7. **Conclusion.** Neon apporte la restauration à un instant donné, des branches de base pour le développement, et un backend qui ne dépend plus du disque du VPS. En contrepartie viennent une latence réseau par requête, des réveils à froid si la mise en veille est active, et un coût d'environ 10 à 20 $/mois. Les points 2 à 4 sont à traiter **quel que soit le choix** : voir la [section 7](#7-actions-immédiates-indépendantes-de-neon).

---

## 1. Méthode et limites

**Lu intégralement :**

- la configuration (`application*.properties`, `pom.xml`) et les 19 entités ;
- les 19 repositories, les services, `JwtFilter`, `CustomUserDetailsService`, `PermissionService`, `RefreshTokenService` et les initialiseurs de données ;
- l'infrastructure et la supervision : `docker-compose.yml`, `monitoring/prometheus/prometheus.yml`, la source de données Grafana ;
- les trois scrapers et les tests (`src/test`).

**Observé en production le 30/09/2026 :**

- volumes de données via les endpoints publics `/api/visitor/*` ;
- temps de réponse, avec 7 requêtes par endpoint sur une connexion HTTP réutilisée ;
- localisation de l'IP du serveur ;
- ouverture des ports publiés par le compose (simple test de connexion, **aucune tentative d'authentification**).

**Limites :**

- tables privées non observées : `users`, `adhesions`, `cotisations`, `dons`, jetons ;
- version exacte de PostgreSQL et taille réelle de la base inconnues ;
- configuration effective du serveur non vue : le `docker-compose.yml` de production peut différer de celui du dépôt.

---

## 2. Architecture actuelle

### 2.1 Schéma

```text
VPS Contabo — Lauterbourg (FR), IP 77.237.243.111 — un seul hôte Docker
┌──────────────────────────────────────────────────────────────────────────────┐
│ amame-backend (Spring Boot, Hikari 5→15 connexions) ──► amame-database       │
│                                                          postgres:15-alpine   │
│ amame-scraper (Python, ponctuel) ──────────────────────► volume database_data │
│ amame-pgadmin      :5050  (mode desktop, sans authentification) ──┘           │
│ amame-postgres-exporter ── interroge la base toutes les 15 s ─────┘           │
│ amame-prometheus   :9090 ◄── exporter + /actuator/prometheus du backend       │
│ amame-grafana      :3001  (admin / adminpass)                                 │
└──────────────────────────────────────────────────────────────────────────────┘
Ports publiés dans le compose mais non joignables depuis Internet le 30/09/2026 (pare-feu).
```

### 2.2 Connexions à la base

| Client | Configuration | Identifiants |
| --- | --- | --- |
| Backend (profil `prod`) | `jdbc:postgresql://database:5432/amame_db` ([application-prod.properties:2-4](../../backend/src/main/resources/application-prod.properties#L2-L4)), surchargé par `SPRING_DATASOURCE_*` ([docker-compose.yml:32-35](../../docker-compose.yml#L32-L35)) | `postgres` / `postgres` (**superutilisateur**) |
| Backend (profil `dev`) | `localhost:5454` ([application-dev.properties:2-4](../../backend/src/main/resources/application-dev.properties#L2-L4)) | `postgres` / `postgres` |
| Scraper mina7 (conteneur) | `database:5432`, **codé en dur** ([scraping_site_web_mina7.py:19-25](../../scraper/scraping_site_web_mina7.py#L19-L25)) ; les variables `DB_*` du compose sont ignorées | `postgres` / `postgres` |
| Scrapers établissements et opportunités | `localhost:5454`, codé en dur ([scraper_etablissement.py:10-16](../../scraper/scraper_etablissement.py#L10-L16), [scraper_opportunity.py:15-21](../../scraper/scraper_opportunity.py#L15-L21)) | `postgres` / `postgres` |
| postgres-exporter | DSN avec mot de passe en clair ([docker-compose.yml:127](../../docker-compose.yml#L127)) | `postgres` / `postgres` |
| pgAdmin | mode desktop (`PGADMIN_CONFIG_SERVER_MODE: "False"`) | pas d'authentification sur l'interface |

### 2.3 Schéma et gestion du schéma

- **Création et évolution** : Hibernate crée et modifie les tables au démarrage (`spring.jpa.hibernate.ddl-auto=update` en `prod` et en `dev`, renforcé par `SPRING_JPA_HIBERNATE_DDL_AUTO=update` dans le compose).
- **Aucun outil de migration** (ni Flyway ni Liquibase dans le `pom.xml`).
- **Tables** : environ 25 au total.
  - 19 tables d'entités : `users`, `adhesions`, `article`, `bourse`, `concours`, `cotisations`, `dons`, `etablissements`, `file_entity`, `filiere`, `galerie`, `lien_utile`, `membre`, `opportunites`, `partenaire`, `password_reset_tokens`, `refresh_token`, `ressource_academique`, `user_permission` ;
  - 5 tables de collections (`article_tags`, `filiere_debouches`, `filiere_competences`, `filiere_universites`, `filiere_prerequis`) ;
  - la table de jointure de `User.files`.
- **Identifiants** : `GenerationType.IDENTITY` partout. Les enums sont stockés en texte ; Hibernate 6 ajoute des contraintes `CHECK` sur ces colonnes, que `ddl-auto=update` ne met pas à jour quand une valeur d'enum est ajoutée.
- **Index** : seulement `refresh_token` (token, user_id), `user_permission` (user_id) et les contraintes d'unicité (slug, url_source, token…). PostgreSQL n'indexe pas automatiquement les clés étrangères. C'est sans effet au volume actuel.

### 2.4 Volumétrie

| Donnée (comptage public, 30/09/2026) | Lignes |
| --- | --- |
| Bourses valides | 61 |
| Filières | 6 |
| Articles publiés | 5 |
| Ressources académiques | 3 |
| Établissements | 2 |
| Galeries publiées | 1 |
| Concours valides | 0 |

Le reste (utilisateurs, adhésions, cotisations, dons, jetons) n'est pas observable publiquement. L'ordre de grandeur probable de la base est de **quelques dizaines de Mo au plus**.

### 2.5 Temps de réponse actuels

Mesures depuis un poste client, médiane sur 7 requêtes par connexion HTTP réutilisée, le 30/09/2026 :

| Ressource | Médiane | Min |
| --- | --- | --- |
| `/robots.txt` (statique, référence réseau) | 58 ms | 56 ms |
| `/api/visitor/articles?page=0&size=9` | 130 ms | 93 ms |
| `/api/visitor/bourses?page=0&size=9` | 122 ms | 100 ms |
| `/api/visitor/filieres?page=0&size=9` | 116 ms | 92 ms |
| `/api/visitor/partenaires` | 104 ms | 78 ms |
| `/api/visitor/articles/popular` | 92 ms | 78 ms |

Le traitement côté serveur (Spring et SQL, base locale) représente donc environ **35 à 75 ms par appel**. C'est la référence à comparer après migration.

---

## 3. Constats détaillés

Niveaux de gravité : 🔴 critique · 🟠 élevé · 🟡 moyen · ⚪ faible.

### 3.1 Disponibilité, sauvegarde, exploitation

| ID | Constat | Gravité |
| --- | --- | --- |
| D1 | **Aucune sauvegarde ni restauration à un instant donné.** Les données n'existent que dans le volume `database_data` du VPS. Une panne disque, un `docker compose down -v` ou une erreur de requête (`DELETE` sans `WHERE`) est irréversible. Les données concernées sont les comptes, les adhésions et l'historique des cotisations et dons. | 🔴 |
| D2 | **Pas de politique de redémarrage sur `database`** ([docker-compose.yml:2-19](../../docker-compose.yml#L2-L19)), alors que `backend` et `frontend` sont en `unless-stopped`. Après un redémarrage du VPS, l'API redémarre mais sans base, jusqu'à une intervention manuelle. | 🟠 |
| D3 | **Base et backend sur le même hôte**, sans limite mémoire pour PostgreSQL (le backend est limité à 512 Mo, [docker-compose.yml:53-56](../../docker-compose.yml#L53-L56)). Une surcharge de l'un pénalise l'autre, et remplacer ou redimensionner le VPS oblige à migrer les données. | 🟡 |
| D4 | **Mise à niveau manuelle** : les mises à jour mineures ou majeures de PostgreSQL (15 → 17) dépendent de l'équipe (image `postgres:15-alpine` non épinglée à une version mineure). | ⚪ |

### 3.2 Gestion du schéma

| ID | Constat | Gravité |
| --- | --- | --- |
| M1 | **`ddl-auto=update` en production** ([application-prod.properties:8-9](../../backend/src/main/resources/application-prod.properties#L8-L9)), avec un commentaire contradictoire (« Ne pas modifier le schéma en prod »). Hibernate ajoute des colonnes et des tables, mais ne supprime ni ne renomme rien, ne migre pas les données et ne met pas à jour les contraintes `CHECK` des enums. Un changement de modèle peut donc échouer au démarrage en production ou laisser un schéma incohérent. | 🟠 |
| M2 | **Aucun historique des changements de schéma** : impossible de reconstruire une base vide identique à la production, ou de savoir quelle version du schéma tourne. | 🟡 |
| M3 | **Garde-fou révélateur** : `PermissionService.getEffectivePermissions` intercepte l'erreur « table `user_permission` absente (migration en cours) » ([PermissionService.java:51-56](../../backend/src/main/java/com/example/siteamame/service/PermissionService.java#L51-L56)). Le code compense l'absence de migrations maîtrisées. | ⚪ |

### 3.3 Sécurité

| ID | Constat | Gravité |
| --- | --- | --- |
| S1 | **L'application utilise le superutilisateur `postgres`.** Une injection SQL ou une fuite des identifiants donnerait un contrôle total : suppression de la base, lecture de toutes les données, et potentiellement exécution de commandes sur le conteneur. | 🟠 |
| S2 | **Mot de passe `postgres` en clair à au moins 10 endroits versionnés** : deux fichiers `application-*.properties`, quatre entrées du compose, `backend/.env` et les 3 scrapers. `POSTGRES_PASSWORD` n'est pas lu depuis l'environnement, contrairement à ce qu'exige `CLAUDE.md`. | 🟠 |
| S3 | **Compte administrateur par défaut dans le code** : si la table `users` est vide, `UserDataInitializer` crée un ADMIN avec un e-mail et un mot de passe écrits en dur ([UserDataInitializer.java:18-24](../../backend/src/main/java/com/example/siteamame/datainitializer/UserDataInitializer.java#L18-L24)). Ce mot de passe est dans l'historique Git. **Vérifier que le compte de production a changé de mot de passe.** Le risque reviendra sur toute base neuve, y compris une base Neon vide ou une branche de test. | 🔴 |
| S4 | **pgAdmin sans authentification** (mode desktop), identifiants Grafana par défaut, Prometheus sans authentification, tous publiés sur l'hôte ([docker-compose.yml:106-164](../../docker-compose.yml#L106-L164)). Non joignables depuis Internet le 30/09/2026 grâce à un pare-feu, mais il suffit d'une règle de pare-feu modifiée pour que pgAdmin (et donc la base, via `database:5432` et les identifiants connus) soit exposé. | 🟠 |
| S5 | **Les journaux de développement exposent les paramètres SQL** (`BasicBinder=TRACE`, `show-sql`, [application-dev.properties:19-23](../../backend/src/main/resources/application-dev.properties#L19-L23)) : données personnelles et hash de mots de passe dans les logs locaux. | ⚪ |

### 3.4 Performance et sensibilité à la latence

Aujourd'hui, un aller-retour avec la base coûte moins de 1 ms, donc les défauts ci-dessous restent invisibles. Avec une base distante, chaque aller-retour coûtera **plusieurs millisecondes** : la valeur réelle entre le VPS et la région Neon est à mesurer (voir le rapport 02).

| ID | Constat | Allers-retours estimés (lecture du code) | Gravité |
| --- | --- | --- | --- |
| L1 | **`JwtFilter` recharge l'utilisateur et ses permissions à chaque requête authentifiée** ([JwtFilter.java:46-63](../../backend/src/main/java/com/example/siteamame/security/jwt/JwtFilter.java#L46-L63), [CustomUserDetailsService.java:29-37](../../backend/src/main/java/com/example/siteamame/service/user/CustomUserDetailsService.java#L29-L37)). La recherche est insensible à la casse (`findByEmailIgnoreCase`), donc aucun index ne peut servir. | +2 par appel authentifié (admin, espace membre) | 🟠 |
| L2 | **Listes avec requêtes N+1** : fichier `@OneToOne(EAGER)` chargé élément par élément pour les galeries ([GalerieRepository.java:18-19](../../backend/src/main/java/com/example/siteamame/repository/GalerieRepository.java#L18-L19) : le commentaire « pas d'EntityGraph nécessaire » est inexact), les membres, les partenaires et les ressources ; débouchés `@ElementCollection` chargés un par un pour les filières paginées ; fichiers `User.files` pour la liste admin des utilisateurs. | 1 à 2 + N par page (N = 9 à 12) | 🟠 |
| L3 | **Comptage des catégories** : une requête `COUNT` par catégorie ([ArticleController.java:86-93](../../backend/src/main/java/com/example/siteamame/controller/ArticleController.java#L86-L93)) au lieu d'un `GROUP BY`. | 1 + nombre de catégories | 🟡 |
| L4 | **HikariCP réglé pour une base locale** : 5 connexions gardées en permanence (`minimum-idle=5`), `SELECT 1` de test à chaque emprunt (`connection-test-query`), pas de `keepalive-time` ([application-prod.properties:24-31](../../backend/src/main/resources/application-prod.properties#L24-L31)). À ajuster pour une base distante qui peut se mettre en veille. | — | 🟡 |
| L5 | **`hibernate.jdbc.batch_size=30` sans effet** : Hibernate désactive le regroupement des `INSERT` avec `GenerationType.IDENTITY`. | — | ⚪ |

Le détail d'un article (`/articles/slug/{slug}`) combine une lecture et une mise à jour du compteur de vues : 2 à 3 allers-retours, ce qui est acceptable.

### 3.5 Supervision, tests, outillage

| ID | Constat | Gravité |
| --- | --- | --- |
| O1 | **`postgres-exporter` interroge la base toutes les 15 s** ([prometheus.yml](../../monitoring/prometheus/prometheus.yml)). Sur un service facturé au temps d'activité avec mise en veille (Neon), cela maintiendrait la base éveillée en permanence. | 🟡 |
| O2 | **Tests dépendants d'une base réelle** : `SiteAmameApplicationTests` est un `@SpringBootTest` sans profil de test ([SiteAmameApplicationTests.java:6-7](../../backend/src/test/java/com/example/siteamame/SiteAmameApplicationTests.java#L6-L7)). `./mvnw test` échoue donc sans PostgreSQL local sur le port 5454. H2 est déclaré mais inutilisé, et `data.sql` est écrit en dialecte H2 (`DATEADD`). | 🟡 |
| O3 | **Scrapers non configurables** : hôte, port et mot de passe en dur. Changer de base oblige à modifier le code des trois scripts. | 🟡 |
| O4 | **Aucune alerte** : ni sur l'espace disque, ni sur l'arrêt de la base, ni sur l'échec d'une sauvegarde (inexistante). | 🟡 |

---

## 4. Matrice des risques

| Priorité | Risque | Constats | Probabilité | Impact |
| --- | --- | --- | --- | --- |
| **P0** | Perte définitive des données (comptes, adhésions, cotisations, dons) | D1 | faible à moyenne, mais irréversible | critique |
| **P0** | Prise de contrôle via le compte admin par défaut ou les identifiants connus | S3, S1, S2 | selon l'état réel des mots de passe | critique |
| **P1** | API indisponible après un redémarrage du VPS | D2 | moyenne | site sans données |
| **P1** | Échec de démarrage ou schéma incohérent après une évolution du modèle | M1, M2 | moyenne à chaque livraison | indisponibilité |
| **P1** | Exposition de pgAdmin ou Grafana si le pare-feu change | S4 | faible | critique |
| **P2** | Dégradation des temps de réponse si la base devient distante sans corriger N+1 et le filtre JWT | L1 à L4 | certaine en cas de migration | lenteur perçue |
| **P3** | Dette d'outillage (tests, scrapers, supervision) | O1 à O4 | — | maintenabilité |

---

## 5. Ce que Neon change

| Problème | Apport de Neon | Ce qui reste à faire côté AMAME |
| --- | --- | --- |
| Pas de sauvegarde (D1) | restauration instantanée à un instant donné : 6 h (Free), jusqu'à 7 jours (Launch), jusqu'à 30 jours (Scale) | la restauration à un instant donné n'est **pas** une sauvegarde externe : garder un `pg_dump` régulier hors de Neon |
| Base liée au VPS (D3) | base gérée hors du serveur, stockage séparé du calcul ; le VPS devient remplaçable | combiné à Bunny pour les fichiers, le backend n'a plus aucun état local |
| Redémarrage et mises à niveau (D2, D4) | service géré ; PostgreSQL 14 à 18 disponibles | choisir la version et tester l'application dessus |
| Environnements de dev et de test (O2) | **branches** : copies instantanées de la base pour le développement ou la recette | attention, une branche copie aussi les données personnelles |
| Sécurité (S1, S2, S4) | rôles séparés, TLS obligatoire ; filtrage par IP seulement sur le plan Scale | créer un rôle applicatif sans privilèges d'administration ; secrets hors de Git |

**Ce que Neon ne résout pas, ou aggrave :**

- **Latence** : chaque requête SQL traverse le réseau. L1 à L3 deviennent visibles.
- **Réveil à froid** : si la mise en veille est active, la première requête après 5 minutes sans activité attend « quelques centaines de millisecondes » le réveil de la base, plus la reconnexion du pool.
- **Coût** : 0 $ aujourd'hui (inclus dans le VPS), environ 10 à 20 $/mois sur le plan Launch (rapport 02).
- **Gestion du schéma** (M1), **compte admin par défaut** (S3) et **outillage** (O2, O3) : rien ne change sans action de l'équipe.
- **Dépendance** envers un fournisseur américain (Neon appartient à Databricks depuis mai 2025), même si les données restent hébergées à Francfort.

---

## 6. Constat transversal : un backend enfin sans état

Avec Bunny pour les fichiers et Neon pour la base, le VPS ne porterait plus aucune donnée. Le backend et le frontend deviendraient remplaçables à l'identique : reconstruction du serveur en quelques minutes, plusieurs instances possibles, changement d'hébergeur sans migration. C'est l'objectif de scalabilité horizontale exprimé au départ.

**Point d'attention** : les deux migrations ajoutent des dépendances réseau (CDN, base distante). Elles doivent s'accompagner des corrections de code identifiées (fichiers : rapport Bunny ; accès SQL : L1 à L4).

---

## 7. Actions immédiates (indépendantes de Neon)

Elles sont détaillées en **phase 0** du [plan de migration](02-plan-migration-neon.md#10-plan-de-livraison).

1. **Sauvegarde quotidienne** : `pg_dump -Fc` depuis le conteneur, chiffrée et copiée hors du VPS (par exemple dans la zone privée Bunny). Faire un test de restauration mensuel (D1).
2. **Compte admin par défaut** : vérifier que le mot de passe de production a été changé. Rendre `UserDataInitializer` dépendant d'une variable d'environnement, ou le désactiver en production (S3).
3. **Identifiants** : lire `POSTGRES_PASSWORD`, `SPRING_DATASOURCE_PASSWORD` et le DSN de l'exporter depuis `.env`, avec un mot de passe fort. Créer un rôle applicatif non superutilisateur (S1, S2).
4. Ajouter `restart: unless-stopped` au service `database` (D2).
5. Retirer pgAdmin et Grafana du compose de production, ou les lier à `127.0.0.1` (accès par tunnel SSH), avec des identifiants forts (S4).

---

## Annexe — Commandes utilisées

```bash
# Volumes publics (exemple)
curl -s "https://amame.ml/api/visitor/bourses?page=0&size=1"      # → totalElements

# Localisation du serveur
curl -s https://ipinfo.io/77.237.243.111/json                     # → Contabo, Lauterbourg (FR)

# Temps de réponse : 7 requêtes GET sur une connexion HTTPS réutilisée (script Python http.client),
# médiane et minimum par endpoint
```
