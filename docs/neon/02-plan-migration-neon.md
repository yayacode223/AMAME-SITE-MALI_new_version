# Plan de migration — PostgreSQL vers Neon (AMAME)

| | |
| --- | --- |
| **Date** | 30 septembre 2026 |
| **Base** | branche `main`, commit `0e43556` |
| **Prérequis** | [01 — État des lieux de la base](01-etat-des-lieux-base-de-donnees.md) (les identifiants D1, M1, S3, L1… y renvoient) |
| **Statut** | proposition : aucun code n'a été modifié |

---

## Résumé

- **Cible.** Un projet Neon `amame` :
  - région **AWS Francfort (`aws-eu-central-1`)**, à environ 150 km du VPS de Lauterbourg ;
  - **PostgreSQL 17** sur le **plan Launch** ;
  - calcul de 0,25 à 1 CU ;
  - restauration à un instant donné sur **7 jours** ;
  - une branche de production protégée et une branche de développement.

  Le backend s'y connecte en TLS vérifié, avec un **rôle applicatif sans privilèges d'administration**. Le schéma est désormais versionné avec **Flyway**.
- **Migration.** `pg_dump` / `pg_restore` pendant une fenêtre de maintenance de 10 à 20 minutes (la base fait quelques dizaines de Mo). Une répétition complète a lieu au préalable sur une branche Neon. L'ancienne base est conservée 14 jours pour pouvoir revenir en arrière.
- **Préalables dans le code** (à déployer **avant** la bascule) :
  - configuration de la base externalisée ;
  - Flyway en mode baseline avec `ddl-auto=validate` ;
  - chargements groupés contre les N+1 ;
  - cache dans le filtre JWT ;
  - réglage de HikariCP pour une base distante ;
  - initialiseur admin sécurisé.
- **Coût.** Environ **10 $/mois** avec mise en veille, environ **20 $/mois** en toujours actif (recommandé), à ajouter aux 1 à 10 $ de Bunny. Le plan Free ne convient pas à la production ([D2](#d2--plan-launch-pas-free)).
- **Effort indicatif : 6 à 8 jours-homme.** La phase 0 (sauvegardes et sécurité, sans Neon) est à lancer **tout de suite**, quelle que soit la décision.

---

## 1. Décisions

### D1 — Neon, comparé à « garder PostgreSQL sur le VPS »

| Critère | PostgreSQL sur le VPS + sauvegardes (phase 0 seule) | Neon (plan Launch) |
| --- | --- | --- |
| Coût mensuel | 0 $ (inclus dans le VPS) | ≈ 10 à 20 $ |
| Restauration après une erreur | dernier `pg_dump` (jusqu'à 24 h de perte) | **à la seconde près** sur 7 jours, plus des `pg_dump` externes |
| Backend sans état local, VPS remplaçable | non : la base reste sur le disque | **oui** (avec Bunny pour les fichiers) |
| Plusieurs instances du backend | non (base locale à un hôte) | oui |
| Environnements de dev et de recette | base locale à la main | **branches** instantanées |
| Latence SQL | < 1 ms | quelques ms par aller-retour (à mesurer, §3.6) |
| Exploitation (mises à jour, disque, redémarrages) | à la charge de l'équipe | gérée |
| Dépendance | aucune | fournisseur externe (Neon, groupe Databricks) |

**Recommandation.** Si l'objectif est un backend sans état et facile à faire évoluer (c'est le contexte de la demande), **Neon est adapté**. Sinon, la phase 0 seule (sauvegardes, sécurité) traite les risques critiques pour 0 $.

### D2 — Plan Launch, pas Free

| | Free | **Launch** | Scale |
| --- | --- | --- | --- |
| Prix | 0 $ | à l'usage, sans minimum : 0,106 $/CU-h, 0,35 $/Go-mois | 0,222 $/CU-h, 0,35 $/Go-mois |
| Calcul | **100 CU-h/mois** (400 h à 0,25 CU, alors qu'un mois compte 730 h) | illimité | illimité |
| Mise en veille | après 5 min, **impossible à désactiver** | après 5 min, **désactivable** | réglable de 1 min à toujours actif |
| Restauration à un instant donné | 6 h | jusqu'à 7 jours (0,20 $/Go-mois) | jusqu'à 30 jours |
| Trafic sortant inclus | 5 Go | 500 Go | 500 Go |
| Filtrage par IP, SLA | non | non | **oui** |

- **Free est exclu en production** : le plafond de calcul peut être atteint en cours de mois, la mise en veille est imposée et la restauration ne couvre que 6 h. Il reste utile pour des projets personnels de développement.
- **Scale** ne se justifie que si le filtrage par IP (restreindre l'accès à l'IP du VPS) ou un SLA deviennent nécessaires. Le calcul coûte alors deux fois plus cher.

### D3 — Région Francfort (`aws-eu-central-1`)

- C'est la région la plus proche du VPS (Contabo, Lauterbourg). C'est aussi celle de la zone de stockage Bunny prévue.
- **Choix irréversible** : la région d'un projet Neon ne se change pas. Il faudrait créer un nouveau projet et migrer.

### D4 — PostgreSQL 17

- La migration par dump et restauration est le moment le moins coûteux pour changer de version majeure (15 → 17). PostgreSQL 17 est supporté plus longtemps, et Hibernate 6.6 (Spring Boot 3.4) le prend en charge.
- **Validé par la répétition** sur une branche (§7.1). En cas de problème, créer le projet en PostgreSQL 15, lui aussi disponible.

### D5 — Connexion directe (sans le pooler PgBouncer)

- Le backend a déjà son propre pool (HikariCP, 10 connexions au plus), très en dessous des 104 connexions autorisées à 0,25 CU.
- Flyway et `pg_dump`/`pg_restore` **exigent** une connexion directe (verrous consultatifs, fonctions de session).
- Le point d'accès *pooled* (`-pooler`) ne sera utile que si l'application passe un jour à de nombreuses instances ou à du serverless.

### D6 — Toujours actif ou mise en veille

| | Toujours actif (recommandé) | Mise en veille après 5 min |
| --- | --- | --- |
| Coût du calcul à 0,25 CU | ≈ 19,35 $/mois | ≈ 9,70 $/mois avec ~12 h d'activité par jour |
| Première requête après inactivité | normale | + « quelques centaines de ms » pour le réveil, plus la reconnexion du pool |
| Réglage HikariCP | `minimum-idle=2`, keepalive actif | `minimum-idle=0`, **keepalive désactivé** (sinon la base ne s'endort jamais) |
| Supervision de la base par un exporter | possible | à proscrire (réveils permanents) |

AMAME a peu de trafic, ce qui a un effet paradoxal : avec la mise en veille, **une grande partie des visiteurs tomberait sur un réveil à froid**. La différence est d'environ 10 $/mois. Recommandation : **toujours actif**. Si le budget l'impose, mesurer les réveils pendant la répétition (§8.2) avant de choisir la veille.

### D7 — Schéma versionné avec Flyway

- On crée une migration `V1__baseline.sql` depuis le schéma actuel, puis `ddl-auto=validate` : Hibernate vérifie le schéma mais ne le modifie plus (corrige M1 et M2).
- Flyway est introduit **sur la base actuelle d'abord** (phase 1). Sa table d'historique fait ensuite partie du dump et arrive dans Neon.

### D8 — Rôles séparés

| Rôle | Créé par | Droits | Utilisé par |
| --- | --- | --- | --- |
| `amame_owner` | console Neon (membre de `neon_superuser`) | propriétaire du schéma | Flyway, restauration, administration |
| `amame_app` | SQL (§3.3) | `SELECT/INSERT/UPDATE/DELETE` sur les tables | backend |
| `amame_scraper` | SQL | lecture et écriture sur `bourse`, `etablissements`, `opportunites` uniquement | scrapers |
| `amame_backup` | SQL | lecture seule | sauvegarde `pg_dump` |

Cela corrige S1 : l'application n'est plus superutilisateur.

### D9 — Sauvegardes : restauration à un instant donné et `pg_dump` externe

- La restauration à un instant donné protège contre les erreurs récentes (7 jours).
- Neon **ne propose pas** de sauvegarde planifiée vers l'extérieur. On conserve donc un `pg_dump` chiffré quotidien hors de Neon ([§11](#11-exploitation)), qui protège contre la perte du compte, une erreur ancienne ou un départ du fournisseur.

### D10 — Branches de développement

- **`main`** : la production, en **branche protégée**.
- **`dev`** : branche enfant, réinitialisable depuis `main`.
- **Branches de recette** : éphémères, pour tester une migration Flyway avant la production.
- ⚠️ Une branche copie **aussi les données personnelles**. Il faut en limiter l'accès, ou exécuter un script d'anonymisation (e-mails, téléphones, adresses) sur les branches de développement.

---

## 2. Architecture cible

```text
VPS Contabo (Lauterbourg) — sans données locales
┌──────────────────────────────────────────────┐
│ Nginx ── /api ──► Spring Boot                │
│                     HikariCP (2→10 conn.)    │──── TLS (verify-full), connexion directe ───┐
│ scraper (ponctuel) ──────────────────────────│──── TLS, rôle amame_scraper ────────────────┤
│ cron backup-neon.sh ─────────────────────────│──── rôle amame_backup ──────────────────────┤
│ Prometheus (métriques Hikari et JVM)         │                                             │
└──────────────────────────────────────────────┘                                             ▼
                                                     Neon — projet « amame », aws-eu-central-1
                                                     branche main (protégée) : PostgreSQL 17, 0,25→1 CU
                                                     branche dev, branches de recette
                                                     historique : 7 jours de restauration
backup-neon.sh ── dump chiffré ──► Bunny Storage, zone privée (backups/db/)
```

---

## 3. Mise en place côté Neon

### 3.1 Projet

| Réglage | Valeur |
| --- | --- |
| Nom du projet | `amame` |
| Région | **AWS Europe (Frankfurt) — `aws-eu-central-1`** |
| Version de PostgreSQL | 17 (voir D4) |
| Base | `amame_db` |
| Rôle propriétaire | `amame_owner` (créé avec le projet) |
| Plan | Launch |

### 3.2 Calcul

- **Taille** : autoscaling de 0,25 CU minimum à 1 CU maximum. La base tient largement en mémoire, et le maximum ne sert qu'aux pics.
- **Mise en veille** : désactivée (D6).
- **Historique de restauration** : 7 jours.
- **Branche `main`** : marquée protégée.

### 3.3 Rôles applicatifs

À exécuter avec `amame_owner` dans l'éditeur SQL de la console, **après** la restauration des données (§7) :

```sql
-- Rôle du backend : manipulation des données, aucune modification du schéma
CREATE ROLE amame_app LOGIN PASSWORD '<mot de passe long et aléatoire>';
GRANT CONNECT ON DATABASE amame_db TO amame_app;
GRANT USAGE ON SCHEMA public TO amame_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO amame_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO amame_app;
-- Tables créées plus tard par les migrations Flyway (exécutées en amame_owner)
ALTER DEFAULT PRIVILEGES FOR ROLE amame_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO amame_app;
ALTER DEFAULT PRIVILEGES FOR ROLE amame_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO amame_app;

-- Rôle des scrapers : limité aux tables alimentées par le scraping
CREATE ROLE amame_scraper LOGIN PASSWORD '<mot de passe long et aléatoire>';
GRANT CONNECT ON DATABASE amame_db TO amame_scraper;
GRANT USAGE ON SCHEMA public TO amame_scraper;
GRANT SELECT, INSERT, UPDATE ON bourse, etablissements, opportunites TO amame_scraper;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO amame_scraper;

-- Rôle de sauvegarde : lecture seule
CREATE ROLE amame_backup LOGIN PASSWORD '<mot de passe long et aléatoire>';
GRANT CONNECT ON DATABASE amame_db TO amame_backup;
GRANT USAGE ON SCHEMA public TO amame_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO amame_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO amame_backup;
ALTER DEFAULT PRIVILEGES FOR ROLE amame_owner IN SCHEMA public GRANT SELECT ON TABLES TO amame_backup;
```

Les rôles créés en SQL n'héritent pas de `neon_superuser`, contrairement à ceux créés depuis la console : c'est voulu.

### 3.4 Chaînes de connexion

```text
# Backend (JDBC) — TLS avec vérification du certificat et du nom d'hôte
jdbc:postgresql://ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory

# Outils (psql, pg_dump, pg_restore, scrapers Python)
postgresql://<rôle>:<mot de passe>@ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=require
```

- `sslmode=require` chiffre la connexion mais **ne vérifie pas** le certificat. `verify-full` avec la fabrique SSL Java utilise le magasin de certificats de la JVM, ce qui bloque une interception.
- Toujours utiliser l'hôte **sans** `-pooler` (D5).

### 3.5 Branches

1. `main` : production, protégée.
2. `repetition` : créée pour la répétition du §7.1, supprimée après la bascule.
3. `dev` : créée après la bascule et anonymisée (D10).

### 3.6 Mesure de latence depuis le VPS (à faire dès la création du projet)

```bash
docker run --rm postgres:17-alpine psql "$NEON_OWNER_URL" \
  -c '\timing on' -c 'select 1' -c 'select 1' -c 'select 1'
```

La durée affichée pour `select 1` correspond à peu près à un aller-retour. Multipliée par le nombre de requêtes d'un appel d'API (rapport 01, §3.4), elle donne le surcoût attendu. **Si elle dépasse ~10 ms, régler L1 à L3 devient impératif.**

---

## 4. Backend (Spring Boot 3.4)

### 4.1 Vue d'ensemble

| Fichier | Changement |
| --- | --- |
| `pom.xml` | + `flyway-core`, `flyway-database-postgresql` ; + Testcontainers (tests) ; + `spring-boot-starter-cache`, `caffeine` |
| `application-prod.properties` | URL et identifiants lus depuis l'environnement, `ddl-auto=validate`, Flyway, chargements groupés, HikariCP |
| `application-dev.properties` | idem avec des valeurs par défaut locales ; retrait des journaux `TRACE` des paramètres (S5) |
| `db/migration/V1__baseline.sql` | **nouveau** : schéma actuel |
| `ArticleRepository`, `ArticleController` | comptage des catégories en une seule requête (L3) |
| `CustomUserDetailsService`, `JwtFilter` | cache de 60 s pour le chargement de l'utilisateur à chaque requête (L1) |
| `UserDataInitializer` | admin initial lu depuis l'environnement, sinon rien (S3) |
| `SiteAmameApplicationTests` | PostgreSQL via Testcontainers (O2) |

### 4.2 Configuration

```properties
# ── Base de données (Neon) — application-prod.properties ─────────────────────
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}

# Le schéma est géré par Flyway ; Hibernate vérifie seulement qu'il correspond aux entités
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.user=${DATABASE_MIGRATION_USERNAME}
spring.flyway.password=${DATABASE_MIGRATION_PASSWORD}

# Chargements groupés : les N+1 deviennent 1 + 1 (WHERE id IN (...) par lots de 50)
spring.jpa.properties.hibernate.default_batch_fetch_size=50

# HikariCP pour une base distante toujours active (D6)
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=15000
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=900000
spring.datasource.hikari.keepalive-time=120000
```

- **À retirer** :
  - `connection-test-query=SELECT 1` : le pilote JDBC 4 valide les connexions sans elle ;
  - le dialecte explicite, détecté automatiquement ;
  - `spring.datasource.url/username/password` écrits en dur ;
  - `SPRING_JPA_HIBERNATE_DDL_AUTO=update` du compose.
- **Si la mise en veille est retenue**, remplacer les trois dernières lignes par :

```properties
spring.datasource.hikari.minimum-idle=0
spring.datasource.hikari.idle-timeout=60000
spring.datasource.hikari.keepalive-time=0     # sinon les pings maintiennent la base éveillée
```

### 4.3 Flyway (introduit sur la base actuelle, avant la migration)

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

```bash
# Schéma actuel de la production → migration V1 (depuis le VPS)
docker compose exec -T database pg_dump -U postgres --schema-only --no-owner --no-privileges amame_db \
  > backend/src/main/resources/db/migration/V1__baseline.sql
# Relire le fichier et retirer la ligne « SELECT pg_catalog.set_config('search_path', '', false); »
```

```properties
# Base existante sans historique Flyway → marquée « en V1 » sans exécuter V1.
# Base vide (tests, nouvelle branche) → V1 est exécutée.
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=1
```

À partir de là, **toute évolution du modèle JPA s'accompagne d'un script `V2__…sql`**, testé d'abord sur une branche Neon de recette.

### 4.4 Réduire les allers-retours avec la base

**Chargements groupés (L2)** : `default_batch_fetch_size=50` (§4.2) couvre les fichiers `@OneToOne(EAGER)` des galeries, membres, partenaires et ressources, les débouchés des filières et les `User.files`, sans modifier les repositories.

**Comptage des catégories (L3)** :

```java
// ArticleRepository
@Query("SELECT a.categorie, COUNT(a) FROM Article a WHERE a.estPublie = true GROUP BY a.categorie")
List<Object[]> countPublishedByCategorie();

// ArticleController.getCategoriesWithCount
Map<String, Long> categoriesWithCount = articleService.countPublishedByCategorie().stream()
        .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
```

**Filtre JWT (L1)** : mettre en cache le chargement **effectué à chaque requête**, mais pas celui de la connexion (login). Sinon un ancien hash de mot de passe resterait utilisable jusqu'à 60 s.

```java
@Service
@RequiredArgsConstructor
public class RequestUserLoader {

    private final CustomUserDetailsService delegate;

    /** Utilisé par JwtFilter uniquement. L'utilisateur mis en cache est détaché : ne jamais le modifier. */
    @Cacheable(cacheNames = "requestUser", key = "#email.toLowerCase()")
    public CustomUserDetails load(String email) {
        return (CustomUserDetails) delegate.loadUserByUsername(email);
    }
}
```

```properties
spring.cache.cache-names=requestUser
spring.cache.caffeine.spec=maximumSize=1000,expireAfterWrite=60s
```

- Activer le cache avec `@EnableCaching` et appeler `requestUserLoader.load(username)` dans `JwtFilter`.
- Ajouter `@CacheEvict(cacheNames = "requestUser", allEntries = true)` sur les méthodes qui changent un rôle, des permissions, un mot de passe, ou qui suppriment un utilisateur : `PermissionService`, `AdhesionService.approveAdhesion/rejectAdhesion`, `MembreService.changePassword`, réinitialisation du mot de passe, `UserService.update/deleteUser`.

### 4.5 Initialiseur admin sans mot de passe dans le code (S3)

```java
@Value("${app.bootstrap.admin-email:}")
private String adminEmail;

@Value("${app.bootstrap.admin-password:}")
private String adminPassword;

@Override
public void run(String... args) {
    // Rien n'est créé si les variables ne sont pas fournies (cas normal en production)
    if (userRepository.count() > 0 || adminEmail.isBlank() || adminPassword.isBlank()) return;
    // … création de l'admin avec adminEmail / passwordEncoder.encode(adminPassword)
}
```

### 4.6 Tests sur un vrai PostgreSQL (O2)

```java
@SpringBootTest
@Testcontainers
class SiteAmameApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Test
    void contextLoads() {
        // Démarre l'application : Flyway exécute V1 sur une base vide, puis Hibernate valide le schéma
    }
}
```

Ce test garantit au passage que `V1__baseline.sql` recrée un schéma conforme aux entités. Dépendances (versions gérées par Spring Boot) : `spring-boot-testcontainers`, `org.testcontainers:postgresql`, `org.testcontainers:junit-jupiter`, toutes en `test`.

---

## 5. Scrapers

Les trois scripts lisent désormais une seule variable d'environnement (O3) :

```python
import os
import psycopg2

# postgresql://amame_scraper:<mot de passe>@ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=require
conn = psycopg2.connect(os.environ["DATABASE_URL"])
```

Dans `docker-compose.yml`, service `scraper` : `DATABASE_URL=${SCRAPER_DATABASE_URL}`, et suppression de `DB_HOST`, `DB_PORT` et autres, ainsi que de `depends_on: database`.

---

## 6. Infrastructure

### 6.1 `docker-compose.yml`

```yaml
  backend:
    environment:
      # … variables existantes, sans SPRING_DATASOURCE_* ni SPRING_JPA_HIBERNATE_DDL_AUTO …
      - DATABASE_URL=${DATABASE_URL:?Définir DATABASE_URL dans .env}
      - DATABASE_USERNAME=${DATABASE_USERNAME:?}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD:?}
      - DATABASE_MIGRATION_USERNAME=${DATABASE_MIGRATION_USERNAME:?}
      - DATABASE_MIGRATION_PASSWORD=${DATABASE_MIGRATION_PASSWORD:?}
    # depends_on: database → à supprimer

  # Services à retirer après la période de retour arrière (§7.5) :
  #   database, pgadmin, postgres-exporter ; volumes database_data, pgadmin_data
```

- **Prometheus** : retirer le job `postgres` et la dépendance à `postgres-exporter`. Les métriques HikariCP (`hikaricp_connections_*`) restent exportées par le backend.
- **pgAdmin** : ne plus le faire tourner sur le serveur. Chacun peut s'en servir **depuis son poste** avec la chaîne de connexion directe et son propre rôle.

### 6.2 `.env.example`

```dotenv
# ── Base de données (Neon) ────────────────────────────────────────────────────
DATABASE_URL=jdbc:postgresql://ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory
DATABASE_USERNAME=amame_app
DATABASE_PASSWORD=<mot de passe amame_app>
DATABASE_MIGRATION_USERNAME=amame_owner
DATABASE_MIGRATION_PASSWORD=<mot de passe amame_owner>
SCRAPER_DATABASE_URL=postgresql://amame_scraper:<mot de passe>@ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=require
NEON_BACKUP_URL=postgresql://amame_backup:<mot de passe>@ep-<id>.eu-central-1.aws.neon.tech/amame_db?sslmode=require
BACKUP_PASSPHRASE=<phrase de chiffrement des sauvegardes, conservée hors du serveur>
```

---

## 7. Migration des données (runbook)

### 7.1 Répétition (J-7), sur la branche `repetition`

1. Faire un dump de la production, sans interruption :

   ```bash
   docker compose exec -T database pg_dump -U postgres -Fc amame_db > amame-repetition.dump
   ```

2. Le restaurer sur la branche de répétition. Le client 17 lit les archives de PostgreSQL 15 :

   ```bash
   docker run --rm -v "$PWD:/w" postgres:17-alpine pg_restore \
     --no-owner --no-privileges --verbose -d "$NEON_OWNER_URL_REPETITION" /w/amame-repetition.dump
   ```

3. Exécuter le script de rôles (§3.3).
4. Comparer les nombres de lignes (§7.3) entre la production et la branche.
5. Démarrer le backend en local ou sur le VPS (autre port) sur la branche. Vérifier que Flyway est en « validate OK », faire la recette (§8.1), puis **mesurer les temps de réponse** (§8.2) : c'est ici que se décide l'option toujours actif ou mise en veille (D6).
6. Chronométrer l'ensemble pour dimensionner la fenêtre de maintenance.

### 7.2 Bascule (jour J, heure creuse)

1. Annoncer la maintenance (réseaux de l'association) de 15 à 30 minutes.
2. `docker compose stop backend scraper` : plus aucune écriture.
3. Faire le dump final : `docker compose exec -T database pg_dump -U postgres -Fc amame_db > amame-final.dump`.
4. Restaurer dans la branche `main` (vide) avec la même commande que le §7.1, puis exécuter le script de rôles.
5. Comparer les nombres de lignes (§7.3). En cas d'écart, **arrêter** et revenir en arrière.
6. Mettre à jour le `.env` du serveur (§6.2), puis `docker compose up -d backend`.
7. Faire la recette rapide (§8.1) et surveiller les journaux pendant une heure.
8. Garder le conteneur `database` **arrêté, avec son volume**, pendant 14 jours.

### 7.3 Vérification des nombres de lignes

À exécuter sur l'ancienne base puis sur Neon. Les deux résultats doivent être identiques :

```sql
SELECT table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
                           false, true, '')))[1]::text::bigint AS lignes
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 7.4 Retour arrière

- **Avant toute nouvelle écriture sur Neon** : remettre l'ancien `.env`, `docker compose start database`, puis redémarrer le backend.
- **Après des écritures sur Neon** : faire un `pg_dump` de Neon (URL directe, `amame_owner`), le restaurer dans la base locale, puis revenir à l'ancien `.env`.
- Dans les deux cas, Flyway et les données restent cohérents : le même schéma est présent des deux côtés.

### 7.5 Nettoyage (J+14)

1. Faire un dernier dump chiffré de l'ancienne base et l'archiver hors du VPS.
2. Supprimer les services `database`, `pgadmin` et `postgres-exporter`, ainsi que les volumes associés.
3. Supprimer la branche `repetition` et créer la branche `dev` anonymisée.
4. Mettre à jour `CLAUDE.md` (base, variables, commandes) et le README (sauvegardes, branches).

---

## 8. Recette et mesures

### 8.1 Recette fonctionnelle

- [ ] Pages publiques : bourses, concours, filières (avec débouchés), articles, galeries, membres, partenaires, ressources, établissements.
- [ ] Connexion, rafraîchissement du jeton, déconnexion, mot de passe oublié.
- [ ] Création, modification et suppression d'un article de test (puis suppression définitive).
- [ ] Inscription et adhésion avec un compte de test, puis approbation par un admin.
- [ ] Changement de permission d'un utilisateur : effectif en moins de 60 s (cache L1).
- [ ] Au démarrage, Flyway indique « Schema … is up to date » et Hibernate `validate` ne signale aucune erreur.
- [ ] Un scraper tourne avec `amame_scraper` ; une écriture hors de ses tables est refusée.
- [ ] Le script de sauvegarde (§11) produit un dump, et ce dump se restaure dans une branche.

### 8.2 Mesures de performance

1. **Comptage des requêtes SQL par appel**, en recette, en activant temporairement :

   ```properties
   spring.jpa.properties.hibernate.generate_statistics=true
   logging.level.org.hibernate.stat=DEBUG
   ```

   Objectif : **2 à 3 requêtes au plus** pour chaque liste publique après les corrections L2 et L3.
2. **Temps de réponse** : reprendre la méthode du rapport 01 (§2.5) sur les mêmes endpoints.
   - Objectif : **médiane au plus 20 ms au-dessus de la référence**, soit ≤ 150 ms pour `/api/visitor/articles` depuis le même poste.
   - Pour les appels authentifiés, vérifier le gain du cache L1.
3. **Réveil à froid** (seulement si la mise en veille est envisagée) : après 6 minutes sans requête, mesurer le premier appel d'API, sur 10 essais.

---

## 9. Coûts

Tarifs Neon publics consultés le 30/09/2026. La base fait moins de 1 Go.

| Scénario | Calcul | Mensuel |
| --- | --- | --- |
| Free | inadapté à la production (D2) | 0 $ |
| **Launch, toujours actif, 0,25 CU** | 0,25 × 730 h × 0,106 $ = 19,35 $ + stockage 0,5 Go × 0,35 $ + historique ≈ 0,10 $ | **≈ 20 $** |
| Launch, mise en veille, ~12 h d'activité par jour | 0,25 × 365 h × 0,106 $ = 9,67 $ + stockage et historique ≈ 0,30 $ | ≈ 10 $ |
| Scale, toujours actif (filtrage IP, SLA) | 0,25 × 730 h × 0,222 $ = 40,52 $ + stockage | ≈ 41 $ |

- **Pics d'activité** : les montées à 1 CU sont facturées au temps réel (0,106 $ par heure à 1 CU), ce qui est négligeable ici.
- **Trafic sortant** : les réponses SQL vers le VPS et les dumps restent très loin des 500 Go inclus.
- **Total avec Bunny** : environ 21 à 30 $/mois selon les options (Optimizer, mise en veille).

---

## 10. Plan de livraison

| Phase | Contenu | Résultat | Effort indicatif |
| --- | --- | --- | --- |
| **0 — Sécurisation (sans Neon)** | sauvegarde quotidienne chiffrée de la base actuelle + test de restauration ; initialiseur admin par variables d'environnement et vérification du mot de passe admin en production ; mots de passe hors de Git ; rôle applicatif non superutilisateur ; `restart: unless-stopped` sur `database` ; pgAdmin et Grafana liés à `127.0.0.1` | risques D1, S1 à S4 traités | 1 j |
| **1 — Préparation du code** | configuration externalisée ; Flyway (baseline) + `validate`, déployé sur la base **actuelle** ; chargements groupés, requête des catégories, cache du filtre JWT ; réglage HikariCP ; Testcontainers ; scrapers par `DATABASE_URL` | code prêt, sans changement de comportement | 2 à 3 j |
| **2 — Neon et répétition** | projet, rôles, branche `repetition`, restauration, recette, mesures de latence et de réveil, décision D6 | bascule répétée et chronométrée | 1 à 2 j |
| **3 — Bascule** | runbook §7.2 | production sur Neon | ½ j |
| **4 — Nettoyage et exploitation** | sauvegarde depuis Neon, suppression des anciens services (J+14), branche `dev` anonymisée, supervision, documentation | exploitation stable | 1 j |

Total : **6 à 8 jours-homme**.

**Articulation avec le plan Bunny :**

- les deux phases 0 sont indépendantes et à lancer tout de suite ;
- les deux migrations peuvent avancer en parallèle, mais **pas le même jour**, pour pouvoir attribuer un incident à la bonne cause ;
- la sauvegarde Neon peut utiliser la zone privée Bunny.

---

## 11. Exploitation

**Sauvegarde quotidienne hors de Neon** (cron sur le VPS, par exemple `30 2 * * *`) :

```bash
#!/usr/bin/env bash
# backup-neon.sh — dump quotidien chiffré de la base Neon, copié dans la zone privée Bunny
set -euo pipefail
: "${NEON_BACKUP_URL:?}" "${BACKUP_PASSPHRASE:?}" "${BUNNY_PRIVATE_ZONE:?}" "${BUNNY_PRIVATE_ZONE_KEY:?}"
f="amame-$(date +%F).dump"

docker run --rm -e PGURL="$NEON_BACKUP_URL" postgres:17-alpine sh -c 'pg_dump -Fc "$PGURL"' > "$f"
gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" -c "$f"
curl -sS --fail -X PUT "https://storage.bunnycdn.com/$BUNNY_PRIVATE_ZONE/backups/db/$f.gpg" \
  -H "AccessKey: $BUNNY_PRIVATE_ZONE_KEY" --data-binary @"$f.gpg"
rm -f "$f" "$f.gpg"
```

- **Rétention** : 30 dumps quotidiens et 12 mensuels (suppression des plus anciens par l'API de listing).
- **Test de restauration** : une fois par mois, dans une branche éphémère.
- **Phrase de chiffrement** : à conserver **hors du serveur**. Sans elle, les sauvegardes sont inutilisables.

**Supervision :**

- dans la console Neon : calcul, mémoire, connexions et consommation en CU-heures ;
- l'extension `pg_stat_statements` pour repérer les requêtes lentes ;
- dans Grafana : `hikaricp_connections_pending` et `hikaricp_connections_acquire_seconds`, avec une alerte si des connexions sont en attente pendant plus de 5 minutes ;
- une alerte e-mail du cron en cas d'échec de la sauvegarde.

**Sécurité :**

- secrets uniquement dans le `.env` du serveur ;
- rotation annuelle des mots de passe des rôles (console Neon ou `ALTER ROLE`) ;
- sur le plan Launch, **pas de filtrage par IP** : la protection repose sur des mots de passe forts et le TLS vérifié. Passer à Scale si une restriction à l'IP du VPS devient nécessaire.

**Données personnelles :**

- les données restent en Union européenne (Francfort), comme aujourd'hui avec le VPS en France ;
- Neon annonce SOC 2, ISO 27001/27701 et le RGPD ;
- vérifier le contrat de traitement des données (Trust Center de Neon) ;
- mettre à jour la politique de confidentialité (nouveau sous-traitant) ;
- vérifier auprès de l'autorité malienne de protection des données (APDP) les formalités liées à l'hébergement hors du Mali.

**Incident Neon :**

- l'API renvoie des erreurs 5xx et HikariCP retente la connexion pendant `connection-timeout` ;
- suivre la page de statut de Neon ;
- en dernier recours, restaurer le dernier dump dans un PostgreSQL local : le compose d'origine est conservé dans Git.

---

## 12. Risques et parades

| Risque | Parade |
| --- | --- |
| Temps de réponse dégradés par la latence réseau | mesure dès la création du projet (§3.6) ; corrections L1 à L3 avant la bascule ; objectifs chiffrés (§8.2) |
| Réveils à froid perçus par les visiteurs | toujours actif (D6), ou mesure préalable si la mise en veille est retenue |
| Écart de données après restauration | comptage table par table (§7.3) ; arrêt des écritures pendant le dump final |
| Incompatibilité avec PostgreSQL 17 | répétition complète sur une branche ; repli sur PostgreSQL 15 |
| Échec de Flyway en production | baseline introduite et validée sur la base actuelle en phase 1 ; test Testcontainers de V1 |
| Fuite d'identifiants (base joignable depuis Internet) | rôles à privilèges minimaux, TLS `verify-full`, secrets hors de Git ; plan Scale pour le filtrage IP si besoin |
| Données personnelles copiées dans les branches de dev | accès restreint et anonymisation (D10) |
| Dérive des coûts | toujours actif à 0,25 CU plafonné à 1 CU ; suivi mensuel de la consommation dans la console |
| Dépendance au fournisseur (Databricks) | PostgreSQL standard, dumps quotidiens externes : retour vers n'importe quel PostgreSQL en quelques heures |

---

## Sources Neon (consultées le 30/09/2026)

- Offre : [Tarifs](https://neon.com/pricing) · [Plans](https://neon.com/docs/introduction/plans) · [Régions](https://neon.com/docs/introduction/regions) · [Conformité](https://neon.com/docs/security/compliance.md)
- Fonctionnement : [Mise en veille](https://neon.com/docs/introduction/scale-to-zero) · [Configuration de la veille](https://neon.com/docs/guides/scale-to-zero-guide) · [Cycle de vie du calcul](https://neon.com/docs/introduction/compute-lifecycle) · [Latence et délais de connexion](https://neon.com/docs/connect/connection-latency.md) · [Pooling de connexions](https://neon.com/docs/connect/connection-pooling) · [Compatibilité PostgreSQL](https://neon.com/docs/reference/compatibility.md)
- Données : [Migration par pg_dump/pg_restore](https://neon.com/docs/import/migrate-from-postgres.md) · [Sauvegardes](https://neon.com/docs/postgres/backup-restore/backups.md) · [Checklist de production](https://neon.com/docs/get-started/production-checklist)
- Contexte : [Rachat par Databricks (communiqué)](https://databricks.com/company/newsroom/press-releases/databricks-agrees-acquire-neon-help-developers-deliver-ai-systems) · [Community Neon — « What awakes compute »](https://community.neon.tech/t/what-awakes-compute/1037)
