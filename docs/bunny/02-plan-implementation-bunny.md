# Plan d'implémentation — Bunny.net pour le stockage et la diffusion des fichiers (AMAME)

| | |
| --- | --- |
| **Date** | 29 septembre 2026 |
| **Base** | branche `main`, commit `0e43556` |
| **Prérequis** | [01 — État des lieux](01-etat-des-lieux-stockage.md) (les identifiants A1, P1, B5… y renvoient) |
| **Statut** | proposition : aucun code n'a été modifié |

---

## Résumé

- **Cible.** Le backend ne garde plus aucun fichier sur disque.
  - Les fichiers vont dans **Bunny Storage**, dans deux zones : `amame-public` et `amame-private`.
  - Les fichiers publics sont diffusés par une **Pull Zone** (CDN de 119 PoP, dont Lagos, Lisbonne, Madrid et Marseille), avec **Bunny Optimizer** pour le redimensionnement et le WebP à la volée.
  - Les fichiers privés (CV, photos des inscrits) ne sont jamais exposés publiquement : ils sont servis par le backend après contrôle d'accès.
- **Migration sans risque.** Les clés d'objets restent identiques aux chemins actuels (`uploads/<dossier>/<uuid>.<ext>`), ce qui évite toute migration de données. La bascule se fait par variable d'environnement (`STORAGE_PROVIDER=local|bunny`), et le retour arrière est immédiat.
- **Coût estimé.** Environ **1 $/mois** sans Optimizer, environ **10 $/mois** avec (hypothèses au [§9](#9-coûts)). Un essai gratuit de 14 jours sans carte bancaire permet de mesurer avant de décider.
- **Effort indicatif.** **9 à 14 jours-homme** en 5 phases livrables séparément ([§11](#11-plan-de-livraison)). La phase 0, sans Bunny, apporte à elle seule le plus gros gain de performance (accueil : de ≈ 52 Mo à moins de 1,5 Mo).
- **Pour l'équipe au quotidien.** En développement local, rien ne change : l'implémentation « disque » reste le défaut. Il n'y a pas besoin de compte Bunny pour coder.

---

## 1. Décisions d'architecture

### D1 — Bunny Storage via l'API HTTP native, pas l'API S3

- **Pourquoi :**
  - l'API HTTP est stable et simple (PUT, GET, DELETE et un en-tête `AccessKey`), sans SDK ;
  - l'API S3 de Bunny est en **« public preview »**, ne s'active **qu'à la création d'une nouvelle zone** et limite la réplication à 4 régions.
- **Réversible :** l'abstraction du [§4.3](#43-contrat-filestorageservice-et-injection-par-interface) permet d'ajouter plus tard une implémentation S3 (AWS SDK) sans toucher aux services.

### D2 — Deux zones de stockage : publique et privée

| Zone | Contenu | Exposition |
| --- | --- | --- |
| `amame-public` | `uploads/{actualite,bourses,concours,filiere,galerie,membre,partenaire,ressource}/**` et `static/**` (images du site) | via la Pull Zone (CDN) |
| `amame-private` | `uploads/utilisateur/**` (CV, photos des inscrits) | **aucune Pull Zone** : lecture par le backend uniquement |

- **Pourquoi :**
  - un mot de passe distinct par zone ;
  - impossible d'exposer un CV par erreur de configuration du CDN ;
  - protection par défaut d'un public possiblement mineur (S1, S5).
- **Écarté pour l'instant :** une zone unique avec Token Authentication (URLs signées HMAC-SHA256). C'est pertinent si les fichiers privés deviennent volumineux ou très consultés.

### D3 — Tier Standard (HDD), région principale Francfort, sans réplication au départ

- **Pourquoi :** les fichiers passent par le cache du CDN, donc la latence HDD (30 à 300 ms en cas de cache miss) est négligeable. C'est la recommandation de Bunny pour ce cas d'usage, pour 0,01 $/Go/mois. Francfort correspond au point d'accès par défaut `storage.bunnycdn.com`, proche des PoP européens qui desservent l'Afrique de l'Ouest.
- **Irréversible :** le tier ne se change plus après création, et une région de réplication ajoutée ne peut plus être retirée. On commence donc sans réplication.
- Le VPS de production est chez Contabo à Lauterbourg (France), à environ 150 km de Francfort (vérifié le 30/09/2026) : ce choix est donc confirmé. La région principale conditionne la latence des uploads.

### D4 — Clés d'objets identiques aux chemins actuels, et immuables

- **Clé :** `uploads/<dossier>/<uuid>.<ext>`. `file_entity.file_path` contient déjà exactement cette valeur, donc aucune ligne en base n'est à modifier.
- **Immuabilité :** une clé n'est jamais réécrite, puisque chaque upload génère un nouvel UUID. On peut donc mettre en cache pendant **1 an** sans jamais purger lors d'une mise à jour.
- **Images statiques :** `static/<chemin-ascii>`, avec une version dans le nom en cas de changement (`hero-accueil-v2.png`). Pas d'accents, d'espaces ni de `&` dans les clés.

### D5 — Les URLs sont calculées par le backend, jamais stockées

- La base ne contient que la clé. Le backend calcule l'URL à partir de `MEDIA_BASE_URL`, de sorte que changer d'hôte ou de CDN revient à changer **une variable d'environnement**.
- Les DTO gagnent des champs `fileUrl`, `imageUrl`, `cvUrl` et `coverImageUrl`. Les anciens champs `filePath` sont conservés le temps de la transition.

### D6 — Optimisation d'images : Bunny Optimizer (recommandé)

- **Avec Optimizer (9,50 $/mois, transformations illimitées) :**
  - on stocke l'original ;
  - le navigateur demande `?class=w640` ;
  - Bunny redimensionne, convertit en WebP et met le résultat en cache sur le PoP.
  - C'est le seul moyen simple d'avoir des tailles adaptées (`srcset`) pour les images uploadées.
- **Sans Optimizer (≈ 1 $/mois au total) :**
  - compression côté navigateur avant upload (une seule taille stockée) ;
  - conversion des images statiques par script (sharp).
  - On obtient environ 80 % du gain, sans `srcset` pour les uploads.
- **Recommandation :** activer Optimizer pendant l'essai de 14 jours, mesurer ([§8.3](#83-mesure-de-performance)), puis décider.

### D7 — Fichiers privés servis par le backend

- `GET /api/user/files/{id}` renvoie le fichier si l'appelant en est propriétaire ou s'il a l'autorité `USER_READ_ALL`. Le fichier est lu dans `amame-private`.
- **Pourquoi :** on réutilise l'authentification existante (cookie JWT), pour un petit volume. Aucune URL publique n'existe.

### D8 — Bascule par configuration

- Deux implémentations de `FileStorageService` : `LocalFileStorageService` (disque) et `BunnyFileStorageService`, sélectionnées par `@ConditionalOnProperty(app.storage.provider)`.
- Le mode local sert au développement **et** au retour arrière.

### D9 — Cohérence : écrire avant, supprimer après le commit, compenser en cas d'échec

- **Upload :** l'objet est envoyé vers Bunny **avant** le commit. Si la transaction est annulée, il est supprimé.
- **Suppression :** toujours **après** le commit (corrige B5).
- **Orphelins :** `orphanRemoval = true` et un listener JPA `@PostRemove` suppriment l'objet quand sa ligne `file_entity` disparaît (corrige B6 et B7), avec un job de réconciliation en filet de sécurité.

### D10 — Un hôte média qui ne reçoit pas les cookies d'authentification

Le cookie d'accès JWT a `path=/`. Si `cookie.domain=.amame.ml` est actif en production, `media.amame.ml` recevrait ce jeton **à chaque requête d'image**, c'est-à-dire que Bunny verrait les jetons des utilisateurs.

- **Recommandé :** garder des cookies *host-only* (`COOKIE_DOMAIN` vide, comme dans le `docker-compose.yml` actuel ; le SPA appelle `/api` sur la même origine) et utiliser `media.amame.ml`.
- **Sinon :** utiliser le nom d'hôte fourni par Bunny (`amame-media.b-cdn.net`) ou un domaine distinct.

---

## 2. Architecture cible

```text
                        ┌─────────────────────────── Bunny.net ───────────────────────────┐
Navigateur ── images ──►│ Pull Zone « amame-media » (media.amame.ml)                      │
   │                    │   PoP le plus proche (Lagos / Lisbonne / Madrid / Marseille…)   │
   │                    │   + Optimizer : ?class=w640 → WebP redimensionné, mis en cache  │
   │                    │        │ cache miss                                             │
   │                    │        ▼                                                        │
   │                    │ Storage « amame-public » (Standard, Francfort)                  │
   │                    │ Storage « amame-private » (Standard, Francfort) — sans CDN      │
   │                    └─────────▲──────────────────────────────▲────────────────────────┘
   │                              │ PUT / DELETE (AccessKey)     │ GET (AccessKey)
   │ HTTPS                        │                              │
   ▼                              │                              │
amame.ml (VPS) ── Nginx ── /api ──► Spring Boot (sans état local) ─┘
   SPA + /api uniquement             └─ /api/user/files/{id} : contrôle d'accès, puis lecture dans amame-private
```

**Flux :**

1. **Upload** : l'admin envoie le formulaire, Spring valide les octets de signature, fait un `PUT` vers Bunny (clé UUID), enregistre en base, puis committe. En cas d'échec avant le commit, l'objet est supprimé.
2. **Lecture publique** : l'`<img>` pointe vers `https://media.amame.ml/uploads/...?class=w640`. Le PoP sert depuis son cache ou, au premier accès, va chercher l'objet dans la storage zone, le transforme et le met en cache.
3. **Lecture privée** : l'`<img>` ou le lien pointe vers `/api/user/files/42`. Spring vérifie le propriétaire ou l'admin, fait un `GET` dans Bunny, puis diffuse le fichier avec `Cache-Control: private`.

---

## 3. Mise en place côté Bunny (panneau d'administration)

### 3.1 Clés et secrets

| Secret | Où le trouver | Utilisé par | Variable |
| --- | --- | --- | --- |
| Mot de passe de la zone publique | Storage → `amame-public` → *FTP & API Access* | backend, script de migration | `BUNNY_PUBLIC_ZONE_KEY` |
| Mot de passe de la zone privée | Storage → `amame-private` → *FTP & API Access* | backend, script de migration | `BUNNY_PRIVATE_ZONE_KEY` |
| Clé API du compte | Account → API | purge du cache (optionnelle) | `BUNNY_API_KEY` |

La clé API du compte donne accès à **tout le compte** (zones, facturation). Elle ne doit être déployée que si la purge automatique est vraiment utilisée.

### 3.2 Storage zones

| Nom | Tier | Région principale | Réplication | S3 |
| --- | --- | --- | --- | --- |
| `amame-public` | Standard | Frankfurt (DE) | aucune au départ | non |
| `amame-private` | Standard | Frankfurt (DE) | aucune | non |

### 3.3 Pull Zone `amame-media` (origine : storage zone `amame-public`)

| Réglage | Valeur | Raison |
| --- | --- | --- |
| Type d'origine | Storage Zone → `amame-public` | pas de serveur d'origine à maintenir |
| Hostname | `media.amame.ml` + SSL gratuit (Let's Encrypt), *Force SSL* | voir D10 |
| Cache sur les PoP | 1 an (override) | clés immuables (D4) |
| Cache navigateur | 1 an | idem ; les versions statiques changent de nom |
| Query string dans la clé de cache | ignorée pour les fichiers non-image | les paramètres d'images sont gérés par Optimizer |
| Protection hotlink | facultative : autoriser `amame.ml` | limite l'usage de la bande passante par des tiers |
| Régions de diffusion | Europe, Amérique du Nord, Afrique **à mesurer** (§3.6) | coût et latence |

### 3.4 Bunny Optimizer

1. Activer Optimizer sur la Pull Zone, avec la compression WebP automatique (et AVIF si le panneau le propose).
2. Activer la *Dynamic Image API*.
3. Créer les *Image Classes* :

| Classe | Paramètres | Usage |
| --- | --- | --- |
| `w320` | `width=320` | petites vignettes, logos de partenaires |
| `w640` | `width=640` | cartes (articles, concours, galeries, filières), mobile |
| `w1280` | `width=1280` | image d'article, hero mobile/tablette |
| `w1920` | `width=1920` | hero desktop |
| `sq320` | `width=320&aspect_ratio=1:1` | photos des membres du bureau |

L'option *Force Transformation Classes* (refus en 403 des requêtes sans classe) empêche les transformations arbitraires. Elle n'est à activer **qu'après** avoir vérifié qu'elle ne bloque pas les fichiers non-image (PDF) de la même Pull Zone.

### 3.5 Domaine personnalisé

1. DNS de `amame.ml` : `media  CNAME  amame-media.b-cdn.net`.
2. Pull Zone → *Hostnames* : ajouter `media.amame.ml`, activer le SSL gratuit, puis *Force SSL*.
3. Vérifier : `curl -sI https://media.amame.ml/static/test.txt` doit renvoyer `200`.

### 3.6 Routage géographique

Il n'y a pas de PoP au Mali. Les plus proches sont **Lagos** (tarif Afrique : 0,06 $/Go) et **Lisbonne, Madrid, Marseille** (tarif Europe : 0,01 $/Go). Le trafic ouest-africain passe souvent par l'Europe : Lagos n'est donc pas forcément le plus rapide depuis Bamako.

- **Mesurer** depuis Bamako (Orange et Moov, 4G) le temps de premier octet sur une même image, avec la région Afrique activée puis désactivée (`EnableGeoZoneAF` dans les réglages de la Pull Zone).
- Garder la configuration la plus rapide. L'écart de coût est de quelques centimes par mois à ce volume.

### 3.7 Tests de fumée

```bash
# Upload manuel dans la zone publique
curl -sS -X PUT "https://storage.bunnycdn.com/amame-public/static/test.txt" \
  -H "AccessKey: $BUNNY_PUBLIC_ZONE_KEY" -H "Content-Type: text/plain" --data-binary "ok"   # → 201

# Lecture via le CDN
curl -sI "https://media.amame.ml/static/test.txt"                                           # → 200

# La zone privée ne doit être joignable qu'avec sa clé
curl -s -o /dev/null -w '%{http_code}\n' "https://storage.bunnycdn.com/amame-private/"      # → 401
```

---

## 4. Backend (Spring Boot 3.4, Java 21)

### 4.1 Vue d'ensemble

| Fichier | Action |
| --- | --- |
| `config/StorageProperties.java` | **nouveau** : propriétés typées `app.storage.*` |
| `config/StorageConfig.java` | **nouveau** : `RestClient` dédié à Bunny (timeouts) |
| `service/file/FileStorageService.java` | **modifié** : ajout de `load()` |
| `service/file/FileStorageServiceImpl.java` | **renommé** `LocalFileStorageService` : propriété réellement lue, validation partagée |
| `service/file/BunnyStorageClient.java` | **nouveau** : PUT, GET, DELETE, checksum, relances |
| `service/file/BunnyFileStorageService.java` | **nouveau** |
| `service/file/StorageTransactionSupport.java` | **nouveau** : après commit / en cas d'annulation |
| `service/file/StoragePaths.java`, `UploadValidator.java` | **nouveaux** |
| `service/file/MediaUrlResolver.java` | **nouveau** : clé → URL |
| `model/File.java` + `FileStorageCleanupListener.java` | listener `@PostRemove` |
| 8 entités à fichier | `orphanRemoval = true` |
| 9 services | injecter **l'interface** ; retirer les suppressions manuelles |
| mappers et DTO | nouveaux champs `*Url` |
| `ConcoursMapper`, `ConcoursRepository` | contrôle de nullité, `LEFT JOIN` (B8) |
| `controller/PrivateFileController.java` | **nouveau** : `GET /api/user/files/{id}` |
| `config/WebMvcconfigurer.java`, `SecurityConfig.java` | actif en mode local seulement ; `denyAll` sur `/uploads/utilisateur/**` |

### 4.2 Configuration

`application.properties` (remplace `file.storage.upload-dir`) :

```properties
# ── Stockage des fichiers ─────────────────────────────────────────────────────
# local : disque (développement, retour arrière) — bunny : Bunny Storage (production)
app.storage.provider=${STORAGE_PROVIDER:local}
# Base des URLs publiques, sans « / » final. Vide → URLs relatives (/uploads/…)
app.storage.public-base-url=${MEDIA_BASE_URL:}
app.storage.local.upload-dir=${UPLOAD_DIR:uploads}
app.storage.bunny.endpoint=${BUNNY_STORAGE_ENDPOINT:https://storage.bunnycdn.com}
app.storage.bunny.public-zone.name=${BUNNY_PUBLIC_ZONE:}
app.storage.bunny.public-zone.access-key=${BUNNY_PUBLIC_ZONE_KEY:}
app.storage.bunny.private-zone.name=${BUNNY_PRIVATE_ZONE:}
app.storage.bunny.private-zone.access-key=${BUNNY_PRIVATE_ZONE_KEY:}
# Clé API du compte : uniquement pour la purge du cache (optionnelle)
app.storage.bunny.api-key=${BUNNY_API_KEY:}
```

```java
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String provider, String publicBaseUrl, Local local, Bunny bunny) {
    public record Local(String uploadDir) {}
    public record Bunny(String endpoint, Zone publicZone, Zone privateZone, String apiKey) {}
    public record Zone(String name, String accessKey) {}
}
```

### 4.3 Contrat `FileStorageService` et injection par interface

On garde les signatures actuelles, ce qui limite les changements dans les 9 services au **type du champ injecté** :

```java
public interface FileStorageService {

    /** Stocke le fichier sous uploads/<folderName>/<uuid>.<ext> ; FileDto.filePath contient la clé. */
    FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException;

    /** Supprime l'objet ; dans une transaction, la suppression a lieu après le commit. */
    void deleteFile(String fileName, String folderName) throws IOException;

    /** Lit un objet (fichiers privés diffusés par le backend). */
    byte[] load(String filePath);
}
```

```java
// Dans ArticleService, BourseService, ConcoursService, FiliereService, GalerieService,
// MembreBureauService, PartenaireService, RessourceAcademiqueService, UserService :
private final FileStorageService fileStorageService;   // au lieu de FileStorageServiceImpl
```

```java
public final class StoragePaths {
    public static final String PRIVATE_FOLDER = "utilisateur";
    private static final Pattern SAFE_KEY = Pattern.compile("^[a-z0-9][a-z0-9/_.-]*$");

    private StoragePaths() {}

    public static String key(String folder, String fileName) {
        return "uploads/" + folder + "/" + fileName;
    }

    public static boolean isPrivate(String key) {
        return key.startsWith("uploads/" + PRIVATE_FOLDER + "/");
    }

    /** Les clés sont générées (dossier + UUID + extension) : tout autre format est refusé. */
    public static String requireSafe(String key) {
        if (!SAFE_KEY.matcher(key).matches() || key.contains("..")) {
            throw new IllegalArgumentException("Clé de stockage invalide : " + key);
        }
        return key;
    }
}
```

### 4.4 Client HTTP Bunny

```java
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
    RestClient bunnyRestClient(RestClient.Builder builder) {
        var factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(60));
        return builder.requestFactory(factory).build();
    }
}
```

```java
@Component
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
public class BunnyStorageClient {

    private final RestClient http;
    private final String endpoint;

    public BunnyStorageClient(@Qualifier("bunnyRestClient") RestClient http, StorageProperties props) {
        this.http = http;
        this.endpoint = props.bunny().endpoint();
    }

    public void put(StorageProperties.Zone zone, String key, byte[] content, String contentType) {
        withRetry(() -> http.put()
                .uri(uri(zone, key))
                .header("AccessKey", zone.accessKey())
                .header("Checksum", sha256Hex(content))       // contrôle d'intégrité côté Bunny
                .contentType(MediaType.parseMediaType(contentType))
                .body(content)
                .retrieve()
                .toBodilessEntity());                         // 201 Created attendu
    }

    public byte[] get(StorageProperties.Zone zone, String key) {
        return http.get()
                .uri(uri(zone, key))
                .header("AccessKey", zone.accessKey())
                .retrieve()
                .body(byte[].class);
    }

    public void delete(StorageProperties.Zone zone, String key) {
        try {
            http.delete()
                    .uri(uri(zone, key))
                    .header("AccessKey", zone.accessKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.NotFound e) {
            // Déjà absent : la suppression est idempotente
        }
    }

    private URI uri(StorageProperties.Zone zone, String key) {
        return URI.create(endpoint + "/" + zone.name() + "/" + StoragePaths.requireSafe(key));
    }

    private static String sha256Hex(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            return HexFormat.of().withUpperCase().formatHex(digest);   // format exigé : hexadécimal majuscule
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Réseau ou 5xx : jusqu'à 3 tentatives (un PUT sur la même clé est idempotent). */
    private static void withRetry(Runnable call) {
        for (int attempt = 1; ; attempt++) {
            try {
                call.run();
                return;
            } catch (ResourceAccessException | HttpServerErrorException e) {
                if (attempt == 3) throw e;
                try {
                    Thread.sleep(500L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw e;
                }
            }
        }
    }
}
```

On envoie un `byte[]`, et non un flux : les fichiers sont limités à 10 Mo, ce qui reste simple et fiable (longueur connue, checksum calculable). Si la limite augmente un jour, passer à un envoi en flux avec `Content-Length`.

### 4.5 Implémentation Bunny

```java
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
public class BunnyFileStorageService implements FileStorageService {

    private final BunnyStorageClient bunny;
    private final UploadValidator validator;
    private final StorageTransactionSupport tx;
    private final StorageProperties.Bunny cfg;

    public BunnyFileStorageService(BunnyStorageClient bunny, UploadValidator validator,
                                   StorageTransactionSupport tx, StorageProperties props) {
        this.bunny = bunny;
        this.validator = validator;
        this.tx = tx;
        this.cfg = props.bunny();
        Assert.hasText(cfg.publicZone().name(), "BUNNY_PUBLIC_ZONE non défini");
        Assert.hasText(cfg.privateZone().name(), "BUNNY_PRIVATE_ZONE non défini");
    }

    @Override
    public FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException {
        ValidatedFile valid = validator.validate(file, fileType);   // signature, taille, extension normalisée
        String fileName = UUID.randomUUID() + "." + valid.extension();
        String key = StoragePaths.key(folderName, fileName);
        StorageProperties.Zone zone = zoneFor(key);

        bunny.put(zone, key, valid.content(), valid.mimeType());
        tx.onRollback(() -> bunny.delete(zone, key));               // la base n'a pas été validée : on retire l'objet

        return new FileDto(fileName, fileType, key, valid.mimeType(), valid.content().length);
    }

    @Override
    public void deleteFile(String fileName, String folderName) {
        String key = StoragePaths.key(folderName, fileName);
        StorageProperties.Zone zone = zoneFor(key);
        tx.afterCommit(() -> bunny.delete(zone, key));               // jamais avant le commit
    }

    @Override
    public byte[] load(String filePath) {
        return bunny.get(zoneFor(filePath), filePath);
    }

    private StorageProperties.Zone zoneFor(String key) {
        return StoragePaths.isPrivate(key) ? cfg.privateZone() : cfg.publicZone();
    }
}
```

### 4.6 Support transactionnel

```java
@Component
public class StorageTransactionSupport {

    private static final Logger log = LoggerFactory.getLogger(StorageTransactionSupport.class);

    /** Exécute l'action après le commit (immédiatement s'il n'y a pas de transaction). */
    public void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            runQuietly(action);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                runQuietly(action);
            }
        });
    }

    /** Exécute l'action seulement si la transaction courante est annulée. */
    public void onRollback(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) runQuietly(action);
            }
        });
    }

    private void runQuietly(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            // La transaction est déjà terminée : on journalise, le job de réconciliation fera le ménage
            log.warn("Opération de stockage différée en échec (objet orphelin possible)", e);
        }
    }
}
```

Les contrôleurs et services sont déjà annotés `@Transactional`. Les synchronisations s'attachent à la transaction la plus externe et s'exécutent à son commit. **Aucun des 9 services n'a besoin de changer pour en profiter.**

### 4.7 Orphelins : `orphanRemoval` et listener JPA

```java
// Sur les 8 entités (Article, Bourse, Concours, Filiere, Galerie, Membre, Partenaire, RessourceAcademique)
@OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
private File file;

// Sur User
@OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
private List<File> files = new ArrayList<>();
```

```java
@Entity
@Table(name = "file_entity")
@EntityListeners(FileStorageCleanupListener.class)
public class File { /* inchangé */ }
```

```java
@Component
public class FileStorageCleanupListener {

    private final ObjectProvider<FileStorageService> storage;   // résolu à la demande : pas de cycle au démarrage JPA

    public FileStorageCleanupListener(ObjectProvider<FileStorageService> storage) {
        this.storage = storage;
    }

    /** Toute ligne file_entity supprimée (explicitement, en cascade ou comme orpheline) entraîne la suppression de l'objet. */
    @PostRemove
    public void afterRemove(File file) throws IOException {
        String path = file.getFilePath();                      // uploads/<dossier>/<nom>
        int lastSlash = path.lastIndexOf('/');
        String folder = path.substring(path.indexOf('/') + 1, lastSlash);
        storage.getObject().deleteFile(path.substring(lastSlash + 1), folder);   // différé après le commit
    }
}
```

Spring Boot configure Hibernate pour instancier les listeners JPA comme des beans Spring : l'injection fonctionne.

**Pièges à connaître :**

- **`User.files` avec `orphanRemoval`** : ne **jamais** remplacer l'instance de la liste (`user.setFiles(nouvelleListe)`), sinon Hibernate lève l'erreur *« A collection with cascade=all-delete-orphan was no longer referenced »*. Il faut la modifier sur place (`user.getFiles().removeIf(…)`, `user.getFiles().add(…)`). `UserService.update` ([UserService.java:112-167](../../backend/src/main/java/com/example/siteamame/service/user/UserService.java#L112-L167)) est à réécrire en ce sens.
- **Suppressions manuelles** : une fois le listener en place, retirer les `deleteFile(...)` des services (Article, Bourse, Concours, Filière, Galerie, User). Un doublon reste sans danger, car la suppression est idempotente.
- **Requêtes JPQL `DELETE` en masse** : elles ne déclenchent pas les listeners. Il n'y en a pas aujourd'hui, et il faut éviter d'en introduire sur `file_entity`.

### 4.8 URLs dans les DTO

```java
@Component
public class MediaUrlResolver {

    private final String publicBaseUrl;

    public MediaUrlResolver(StorageProperties props) {
        String base = props.publicBaseUrl();
        this.publicBaseUrl = (base == null) ? "" : base.replaceAll("/+$", "");
    }

    /** CDN pour un fichier public, endpoint authentifié pour un fichier privé. */
    public String urlOf(File file) {
        if (file == null || file.getFilePath() == null) return null;
        if (StoragePaths.isPrivate(file.getFilePath())) return "/api/user/files/" + file.getId();
        return publicUrl(file.getFilePath());
    }

    /** Base vide (développement, mode local) : renvoie « /uploads/… », servi par Nginx ou Spring. */
    public String publicUrl(String filePath) {
        return filePath == null ? null : publicBaseUrl + "/" + filePath;
    }
}
```

| DTO | Nouveau champ | Rempli par |
| --- | --- | --- |
| `ArticleDto`, `ArticleSummaryDto` | `fileUrl` | `ArticleMapper` |
| `FiliereDto`, `FiliereSummaryDto` | `fileUrl` | `FiliereMapper` |
| `GalerieDto`, `GalerieSummaryDto` | `coverImageUrl` | `GalerieMapper` |
| `MembreDto`, `PartenaireDto`, `RessourceAcademiqueDto` | `fileUrl` | `toDto` des services |
| `ConcoursReponseDto` | `fileUrl` | `ConcoursMapper` ; pour les pages JPQL : `page.map(dto -> { dto.setFileUrl(resolver.publicUrl(dto.getFilePath())); return dto; })` |
| `UserReponseDto` | `imageUrl`, `cvUrl` | `UserMapperDto` |

**Corrections B8 à faire en même temps :**

- dans `ConcoursMapper`, contrôler la nullité de `getFile()` ;
- dans les 3 requêtes de `ConcoursRepository`, remplacer `c.file.filePath` par une jointure externe, ce qui garde les concours sans fichier :

```sql
SELECT new com.example.siteamame.dto.concours.ConcoursReponseDto(
    c.id, c.nom, c.description, c.pays, c.niveau, c.status, c.isAvalable,
    c.dateOuverture, c.dateLimite, c.lienOfficiel, f.filePath)
FROM Concours c LEFT JOIN c.file f
WHERE c.isAvalable = true
  AND c.dateLimite >= :currentDate
  AND (:niveau IS NULL OR c.niveau = :niveau)
  AND (:status IS NULL OR c.status = :status)     -- parenthèses corrigées (01, §4.6)
ORDER BY c.dateLimite DESC
```

### 4.9 Endpoint des fichiers privés

```java
@RestController
@RequestMapping("/api/user/files")
@RequiredArgsConstructor
public class PrivateFileController {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileStorageService storage;

    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> read(@PathVariable Long fileId,
                                       @AuthenticationPrincipal CustomUserDetails me) {
        File file = fileRepository.findById(fileId)
                .filter(f -> StoragePaths.isPrivate(f.getFilePath()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        boolean owner = userRepository.existsByIdAndFiles_Id(me.getUser().getId(), fileId);
        boolean admin = me.getAuthorities().stream()
                .anyMatch(a -> "USER_READ_ALL".equals(a.getAuthority()));
        if (!owner && !admin) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getFileMimeType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.getFileName()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(storage.load(file.getFilePath()));
    }
}
```

- Dans `UserRepository`, ajouter `boolean existsByIdAndFiles_Id(Long userId, Long fileId);`.
- `/api/user/**` exige déjà un utilisateur authentifié ([SecurityConfig.java:49](../../backend/src/main/java/com/example/siteamame/config/SecurityConfig.java#L49)).
- Le bloc Nginx `/api/` ajoute `Cache-Control: no-store`. Pour que les avatars soient mis en cache, prévoir le bloc dédié du [§6.3](#63-nginx).
- **Limite connue :** une `<img>` ne passe pas par l'intercepteur axios. Si le jeton d'accès (15 min) a expiré, l'avatar renvoie 401 jusqu'au prochain appel d'API qui le rafraîchit, et l'avatar de secours (initiales) s'affiche entre-temps.

### 4.10 Validation des uploads

```java
@Component
public class UploadValidator {

    private static final long MAX_IMAGE = 5L * 1024 * 1024;
    private static final long MAX_DOCUMENT = 10L * 1024 * 1024;

    public ValidatedFile validate(MultipartFile file, FileType expected) throws IOException {
        byte[] bytes = file.getBytes();
        Detected d = detect(bytes, file.getOriginalFilename());   // d'après le contenu, pas le Content-Type du client
        if (d == null) throw new InvalidUploadException("Format de fichier non pris en charge");
        if (expected == FileType.IMAGE && !d.image()) throw new InvalidUploadException("Une image est attendue");
        if (bytes.length > (d.image() ? MAX_IMAGE : MAX_DOCUMENT)) throw new InvalidUploadException("Fichier trop volumineux");
        return new ValidatedFile(bytes, d.mimeType(), d.extension());
    }

    private static Detected detect(byte[] b, String originalName) {
        if (starts(b, 0xFF, 0xD8, 0xFF)) return new Detected("image/jpeg", "jpg", true);
        if (starts(b, 0x89, 'P', 'N', 'G')) return new Detected("image/png", "png", true);
        if (starts(b, 'G', 'I', 'F', '8')) return new Detected("image/gif", "gif", true);
        if (starts(b, 'R', 'I', 'F', 'F') && b.length > 12
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return new Detected("image/webp", "webp", true);
        if (starts(b, '%', 'P', 'D', 'F')) return new Detected("application/pdf", "pdf", false);
        // Office : ZIP (50 4B 03 04) → docx/xlsx, OLE2 (D0 CF 11 E0) → doc/xls, selon l'extension d'origine
        return detectOffice(b, originalName);
    }

    private static boolean starts(byte[] b, int... signature) {
        if (b.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((b[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }
}
```

**À compléter :**

- **WebP accepté**, SVG toujours refusé (risque XSS).
- **L'extension enregistrée est celle du type détecté**, pas celle envoyée par le client.
- **Aligner les attributs `accept` du frontend** sur cette liste (F3).
- **Limiter le débit de `POST /api/visitor/register`** (S2). Attention : Nginx dans le conteneur voit l'IP du proxy OpenResty, pas celle du visiteur. Il faut soit configurer `set_real_ip_from` et `real_ip_header X-Forwarded-For`, soit appliquer la limite dans le proxy frontal. Sans cela, tous les visiteurs partagent le même quota.

### 4.11 Mode local corrigé (développement)

- `LocalFileStorageService` (ancien `FileStorageServiceImpl`) :
  - `@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)` ;
  - lit enfin `app.storage.local.upload-dir` (corrige B1) ;
  - réutilise `UploadValidator` et `StorageTransactionSupport`.
- `WebMvcconfigurer` :
  - actif seulement en mode local ;
  - l'emplacement est calculé depuis la propriété (`Paths.get(uploadDir).toAbsolutePath().toUri()`), ce qui corrige B2 sous Windows.
- `SecurityConfig` : ajouter `.requestMatchers("/uploads/utilisateur/**").denyAll()` **avant** le `permitAll` sur `/uploads/**`. Les fichiers privés passent alors, en local aussi, par `/api/user/files/{id}`.

### 4.12 Réconciliation (optionnelle, recommandée)

- **Fréquence** : un `@Scheduled` hebdomadaire.
- **Principe** : pour chaque dossier, lister les objets (`GET {endpoint}/{zone}/uploads/<dossier>/`, qui renvoie un tableau JSON avec notamment `ObjectName` et `DateCreated`). Supprimer ceux qui ne sont référencés par aucune ligne `file_entity` et qui ont plus de 48 h.
- **Précaution** : fonctionner d'abord en mode « rapport seul » pendant quelques semaines.
- **Plusieurs instances du backend** : ajouter ShedLock pour que le job ne tourne qu'une seule fois.

---

## 5. Frontend (React 18, Vite 7)

### 5.1 Variable d'environnement et helper unique

```ts
// src/vite-env.d.ts (à compléter)
interface ImportMetaEnv {
  readonly VITE_MEDIA_BASE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

```ts
// src/lib/media.ts — point d'entrée unique pour les URLs de médias
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Largeurs disponibles = Image Classes déclarées dans Bunny Optimizer. */
export const IMAGE_WIDTHS = [320, 640, 1280, 1920] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** Accepte une URL absolue, une URL d'API (/api/…) ou une clé (« uploads/… », « static/… »). */
export function mediaUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("/api/")) return pathOrUrl;
  return `${MEDIA_BASE}/${pathOrUrl.replace(/^\/+/, "")}`;
}

const isOptimizable = (url: string) => MEDIA_BASE !== "" && url.startsWith(MEDIA_BASE);

/** Ajoute la classe Optimizer si l'URL pointe vers le CDN média ; sinon URL inchangée. */
export function sizedUrl(url: string, width: ImageWidth): string {
  if (!isOptimizable(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}class=w${width}`;
}

export function srcSet(url: string, widths: readonly ImageWidth[] = IMAGE_WIDTHS): string | undefined {
  return isOptimizable(url) ? widths.map((w) => `${sizedUrl(url, w)} ${w}w`).join(", ") : undefined;
}
```

`VITE_MEDIA_BASE_URL` (frontend) et `MEDIA_BASE_URL` (backend) doivent avoir **la même valeur**.

### 5.2 Composant `<MediaImage>`

```tsx
// src/components/MediaImage.tsx
import type { ImgHTMLAttributes } from "react";
import { mediaUrl, sizedUrl, srcSet, type ImageWidth } from "@/lib/media";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  path?: string | null;     // fileUrl renvoyé par l'API, ou clé « static/… »
  maxWidth?: ImageWidth;    // largeur du src par défaut
  priority?: boolean;       // true uniquement pour l'image LCP (hero)
};

export default function MediaImage({ path, maxWidth = 1280, priority = false, sizes = "100vw", ...img }: Props) {
  const url = mediaUrl(path);
  if (!url) return null;
  return (
    <img
      src={sizedUrl(url, maxWidth)}
      srcSet={srcSet(url)}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? ({ fetchpriority: "high" } as Record<string, string>) : {})}   // React 18 : attribut en minuscules
      {...img}
    />
  );
}
```

Exemple sur une carte d'article :

```tsx
<MediaImage path={article.fileUrl ?? article.filePath} alt={article.titre}
            maxWidth={640} sizes="(min-width: 1024px) 33vw, 100vw"
            width={640} height={360} className="w-full h-full object-cover" />
```

### 5.3 Fichiers à modifier

| Zone | Fichiers | Changement |
| --- | --- | --- |
| Constantes `PROD_URL` / `url` | 19 fichiers (Articles, ArticleDetail, GuideConseils, Postes, Galeries, Membres, Partenaires, Orientation, RessourcesAcademiques, LiensUtiles, Universites, ConcoursCardItem, Navbar, LayoutMembre, DashboardHome, DashboardMembre, RessourcesManagement, UsersManagement, UserDetail) | supprimer la constante ; `mediaUrl(dto.fileUrl ?? dto.filePath)` ou `<MediaImage>` |
| Chemins `/${filePath}` | `ConcoursDetail.tsx`, `OrientationDetail.tsx` | idem |
| Avatars (privés) | `Navbar.tsx` (L197 et **L279**, bug F1), `LayoutMembre.tsx`, `DashboardHome.tsx`, `DashboardMembre.tsx`, `UsersManagement.tsx`, `UserDetail.tsx` | `user.imageUrl` (`/api/user/files/{id}`) ; `user.cvUrl` pour le CV |
| Heroes | `Hero.tsx`, `PageHero.tsx` (+ 17 pages qui passent `imageSrc`), fonds CSS d'`Authentication`/`ForgotPassword` | `<MediaImage priority>` avec une clé `static/heroes/…` ; remplacer les fonds CSS de 7 Mo par une `<img>` optimisée |
| Visuels de l'accueil et d'« À propos » | `Index.tsx`, `About.tsx`, `BourseCardItem.tsx`, `BoursesDetail.tsx` | clés `static/…` en ASCII + `<MediaImage>` (lazy) |
| Types | `types/*.ts` | champs optionnels `fileUrl`, `coverImageUrl`, `imageUrl`, `cvUrl` |
| Code mort | `articleService.ts`, `bourseService.ts`, `concoursService.ts`, `orientationService.ts` | supprimer `open*/download*File` (F2) |
| Formulaires | 9 formulaires d'upload | `accept` aligné sur le backend ; compression avant envoi (§5.5) |

**Le logo et le favicon restent dans le bundle.** Ils font partie de la coquille de l'application (servie par la même origine et précachée par la PWA), mais doivent être optimisés : logo en WebP 96 px de quelques Ko, et `favicon.svg` de 583 Ko à remplacer.

### 5.4 Images statiques

1. Renommer en ASCII et envoyer les originaux dans `amame-public/static/`. Exemple : `AMAME-IMAGE/Concours&Opportunités.png` devient `static/accueil/concours-opportunites.png`, `images/heroes/hero-homepage.png` devient `static/heroes/hero-accueil.png`.
2. Supprimer de `frontend/public/` les fichiers déplacés et les **21,6 Mo jamais référencés** (liste dans le rapport 01, §3.2). L'image Docker du frontend s'allège d'environ 90 Mo.
3. **Sans Optimizer** : générer une fois des WebP en 640, 1280 et 1920 px (script `sharp`), puis les stocker dans `static/` avec la largeur dans le nom.

### 5.5 Compression avant upload

```ts
// src/lib/prepareImage.ts — chargé à la demande, uniquement dans les formulaires
export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 1,
    fileType: "image/webp",   // accepté par le backend après évolution de la liste blanche
    initialQuality: 0.8,
    useWebWorker: true,
  });
}
```

- **Upload plus rapide** : une photo de 3 à 8 Mo tombe sous 1 Mo, ce qui compte sur les réseaux mobiles.
- **Métadonnées retirées** : le réencodage supprime les données EXIF, dont la position GPS (S4).
- **Utilisé** dans les formulaires admin et dans l'inscription.

### 5.6 `index.html` et PWA

- Ajouter `<link rel="preconnect" href="https://media.amame.ml">`, **sans** `crossorigin` : les `<img>` sont des requêtes *no-cors*, et une connexion ouverte en mode CORS ne serait pas réutilisée.
- Ne pas précharger le hero dans `index.html`. Ce fichier est commun à toutes les routes du SPA, le préchargement pénaliserait donc les autres pages. `fetchpriority="high"` sur l'`<img>` du hero suffit.
- **Workbox** :
  - retirer la règle `/amame-uploads/` devenue obsolète ;
  - s'appuyer sur le cache HTTP (1 an, immuable) pour les médias, plutôt que de mettre en cache des réponses cross-origin opaques, qui gonflent le quota de stockage ;
  - restreindre la règle `/api/` aux routes publiques (01, §4.6).

---

## 6. Infrastructure

### 6.1 `docker-compose.yml`

```yaml
  backend:
    # ports: "8080:8080" à supprimer — Nginx suffit (A4)
    environment:
      # … variables existantes …
      - STORAGE_PROVIDER=${STORAGE_PROVIDER:-local}
      - MEDIA_BASE_URL=${MEDIA_BASE_URL:-}
      - BUNNY_STORAGE_ENDPOINT=${BUNNY_STORAGE_ENDPOINT:-https://storage.bunnycdn.com}
      - BUNNY_PUBLIC_ZONE=${BUNNY_PUBLIC_ZONE:-}
      - BUNNY_PUBLIC_ZONE_KEY=${BUNNY_PUBLIC_ZONE_KEY:-}
      - BUNNY_PRIVATE_ZONE=${BUNNY_PRIVATE_ZONE:-}
      - BUNNY_PRIVATE_ZONE_KEY=${BUNNY_PRIVATE_ZONE_KEY:-}
      - BUNNY_API_KEY=${BUNNY_API_KEY:-}
    volumes:
      - ./backend/uploads:/app/uploads   # conservé jusqu'à la phase 4 (retour arrière)

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_MEDIA_BASE_URL: ${MEDIA_BASE_URL:-}
    # volumes : retirer ./frontend/dist et ./backend/uploads
```

### 6.2 `frontend/Dockerfile`

```dockerfile
# Étape « builder », juste avant RUN npm run build
ARG VITE_MEDIA_BASE_URL=""
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL
```

### 6.3 Nginx

```nginx
# Plus aucun accès public aux CV et photos des inscrits (à déployer dès la phase 0)
location ^~ /uploads/utilisateur/ {
  return 404;
}

# Transition : les anciennes URLs publiques redirigent vers le CDN (liens partagés, référencement)
location ^~ /uploads/ {
  return 301 https://media.amame.ml$request_uri;
}

# Fichiers privés : le backend fixe lui-même Cache-Control (pas de no-store ajouté ici)
location ^~ /api/user/files/ {
  set $upstream http://backend:8080;
  proxy_pass $upstream;
  proxy_set_header Host              $host;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto https;
}
```

- Supprimer le bloc `/amame-uploads/` (inutile) une fois les images statiques migrées.
- Pour les réponses servies par Nginx, répéter les en-têtes de sécurité dans chaque `location` qui a ses propres `add_header`, par exemple via un `include` (P6).
- Vérifier la règle d'expiration du proxy OpenResty frontal pour les assets restants (P5). Les médias, eux, ne passent plus par lui.

### 6.4 Secrets et `.env.example`

```dotenv
# ── Stockage des fichiers (Bunny.net) ─────────────────────────────────────────
STORAGE_PROVIDER=local          # local | bunny
MEDIA_BASE_URL=                 # ex. https://media.amame.ml (sans / final)
BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
BUNNY_PUBLIC_ZONE=amame-public
BUNNY_PUBLIC_ZONE_KEY=<mot de passe de la storage zone publique>
BUNNY_PRIVATE_ZONE=amame-private
BUNNY_PRIVATE_ZONE_KEY=<mot de passe de la storage zone privée>
BUNNY_API_KEY=                  # clé API du compte, seulement si la purge est utilisée
```

Règles :

- ces valeurs ne vont **que** dans le `.env` du serveur, jamais dans Git ;
- une clé distincte par zone ;
- rotation annuelle, et à chaque départ d'un membre de l'équipe ayant eu accès aux clés.

---

## 7. Migration des fichiers existants (runbook)

### 7.1 Préparation (J-7 à J-1)

1. La phase 0 est terminée : `/uploads/utilisateur/` est bloqué et les secrets ont été changés.
2. Inventaire en production :

   ```bash
   find backend/uploads -type f | wc -l && du -sh backend/uploads/*
   docker compose exec database psql -U postgres -d amame_db -c \
     "SELECT split_part(file_path, '/', 2) AS dossier, count(*) FROM file_entity GROUP BY 1 ORDER BY 1;"
   ```

3. Sauvegarde : `tar czf uploads-$(date +%F).tgz backend/uploads` et `pg_dump`. L'archive contient des CV : la chiffrer et la stocker hors du VPS.
4. Bunny est configuré (§3) et les tests de fumée passent.
5. Le code de la phase 1 est déjà en production avec `STORAGE_PROVIDER=local` et `MEDIA_BASE_URL` vide. Le comportement est identique à aujourd'hui, ce qui valide le refactoring sans risque.

### 7.2 Copie (jour J), script idempotent

```bash
#!/usr/bin/env bash
# migrate-uploads-to-bunny.sh — copie <dossier>/uploads vers Bunny Storage en conservant les clés.
# Ré-exécutable sans risque : un PUT sur la même clé remplace l'objet à l'identique.
set -euo pipefail
: "${BUNNY_PUBLIC_ZONE:?}" "${BUNNY_PUBLIC_ZONE_KEY:?}" "${BUNNY_PRIVATE_ZONE:?}" "${BUNNY_PRIVATE_ZONE_KEY:?}"
ENDPOINT="${BUNNY_STORAGE_ENDPOINT:-https://storage.bunnycdn.com}"
cd "${1:?Usage : $0 <dossier contenant uploads/>}"

ok=0; ko=0
while IFS= read -r -d '' f; do
  if [[ "$f" == uploads/utilisateur/* ]]; then zone=$BUNNY_PRIVATE_ZONE; pass=$BUNNY_PRIVATE_ZONE_KEY
  else zone=$BUNNY_PUBLIC_ZONE; pass=$BUNNY_PUBLIC_ZONE_KEY; fi
  sum=$(sha256sum "$f" | cut -d' ' -f1 | tr '[:lower:]' '[:upper:]')
  mime=$(file --mime-type -b "$f")
  path=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$f")
  code=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$ENDPOINT/$zone/$path" \
         -H "AccessKey: $pass" -H "Checksum: $sum" -H "Content-Type: $mime" --data-binary @"$f")
  if [[ "$code" == "201" ]]; then ok=$((ok + 1)); else ko=$((ko + 1)); echo "ÉCHEC $code $f" >&2; fi
done < <(find uploads -type f -print0)
echo "Copiés : $ok — échecs : $ko"
```

**Vérification :** comparer, pour chaque dossier, le nombre d'objets listés par l'API au nombre de fichiers locaux. Ouvrir aussi quelques URLs via le CDN.

```bash
curl -s -H "AccessKey: $BUNNY_PUBLIC_ZONE_KEY" \
  "https://storage.bunnycdn.com/$BUNNY_PUBLIC_ZONE/uploads/actualite/" \
  | python3 -c 'import json, sys; print(len(json.load(sys.stdin)))'
ls backend/uploads/actualite | wc -l
```

### 7.3 Bascule (jour J, sans interruption notable)

1. Dans le `.env` du serveur : `STORAGE_PROVIDER=bunny` et `MEDIA_BASE_URL=https://media.amame.ml`, puis `docker compose up -d --build` (le frontend est reconstruit avec la même base média).
2. **Relancer immédiatement le script de copie** : il rattrape les fichiers uploadés entre la copie et la bascule.
3. Activer les redirections Nginx du §6.3.
4. Faire la recette (§8.2) et surveiller les 404 et les erreurs 5xx pendant 48 h.

### 7.4 Retour arrière

1. Remettre `STORAGE_PROVIDER=local` et `MEDIA_BASE_URL=` vide, puis redéployer.
2. Rapatrier les objets créés sur Bunny depuis la bascule (listing puis `GET`, vers `backend/uploads/` avec la même clé).
3. Retirer les redirections Nginx.

Les clés étant identiques des deux côtés, aucune donnée en base n'est à modifier.

### 7.5 Nettoyage (J+30)

1. Retirer les montages `./backend/uploads` et le mode local de la configuration de production.
2. Archiver hors ligne le dossier local (chiffré), puis le supprimer du VPS.
3. Garder les redirections `/uploads/` quelques mois : elles ne coûtent rien et préservent les liens partagés.
4. **Historique Git (décision d'équipe)** : `git filter-repo --invert-paths --path backend/uploads --path backend/.env --path frontend/.env`, puis force-push. Tous les contributeurs doivent recloner. Si le dépôt est ou a été public, les forks et caches de GitHub peuvent conserver ces données : les secrets doivent donc **déjà** avoir été changés.

---

## 8. Tests et recette

### 8.1 Tests automatisés

| Cible | Cas | Outil |
| --- | --- | --- |
| `BunnyStorageClient` | URL, `AccessKey` et `Checksum` corrects ; 404 au DELETE ignoré ; 5xx relancé 3 fois | `MockRestServiceServer` |
| `StorageTransactionSupport` | commit : suppression exécutée après ; rollback : compensation exécutée ; hors transaction : exécution immédiate | `TransactionTemplate` + H2 (déjà présent) |
| `UploadValidator` | PNG renommé `.pdf` refusé ; WebP accepté ; image de plus de 5 Mo refusée | JUnit |
| Listener + `orphanRemoval` | remplacement du fichier d'un article : ancienne ligne et ancien objet supprimés après le commit | `@DataJpaTest` + faux `FileStorageService` |
| `PrivateFileController` | propriétaire : 200 ; autre utilisateur : 403 ; anonyme : 401 ; admin : 200 | `@WebMvcTest` + `spring-security-test` (déjà présent) |

```java
@Test
void put_envoie_la_cle_d_acces_et_le_checksum() {
    RestClient.Builder builder = RestClient.builder();
    MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    BunnyStorageClient client = new BunnyStorageClient(builder.build(), props("https://storage.bunnycdn.com"));

    server.expect(requestTo("https://storage.bunnycdn.com/amame-public/uploads/actualite/a.jpg"))
          .andExpect(method(HttpMethod.PUT))
          .andExpect(header("AccessKey", "cle-publique"))
          .andExpect(header("Checksum", "2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824"))
          .andRespond(withStatus(HttpStatus.CREATED));

    client.put(new StorageProperties.Zone("amame-public", "cle-publique"),
               "uploads/actualite/a.jpg", "hello".getBytes(StandardCharsets.UTF_8), "image/jpeg");
    server.verify();
}
```

### 8.2 Recette fonctionnelle

- [ ] Créer un article avec image : l'image s'affiche depuis `media.amame.ml`, en WebP, à la bonne taille.
- [ ] Remplacer l'image : la nouvelle s'affiche ; après le commit, l'ancien objet est absent de la zone.
- [ ] Supprimer l'article : l'objet est supprimé.
- [ ] Provoquer une erreur après l'upload (par exemple un titre dupliqué) : aucun objet ne reste dans la zone.
- [ ] Concours **sans** fichier : visible dans les listes, et la page de détail ne renvoie pas 500 (B8).
- [ ] Inscription avec CV et photo : les objets sont dans `amame-private` ; `/api/user/files/{id}` renvoie 200 au propriétaire, 403 à un autre compte, 401 en anonyme.
- [ ] Une ancienne URL `/uploads/actualite/…` redirige (301) ; `/uploads/utilisateur/…` renvoie 404.
- [ ] Mode local (`STORAGE_PROVIDER=local`) : upload et affichage fonctionnent en développement sous Windows (B2).

### 8.3 Mesure de performance

1. **Avant / après**, avec Lighthouse en mobile (« Slow 4G »), sur `/`, `/bourses`, `/articles` et `/a-propos` : relever le LCP, le poids total transféré et le nombre de requêtes.
2. **En conditions réelles depuis Bamako** : un téléphone sur Orange et sur Moov, en navigation privée, pour mesurer le chargement de l'accueil ; mesurer aussi le temps de premier octet d'une même image selon le réglage `EnableGeoZoneAF` (§3.6).
3. **Objectifs** :
   - accueil **< 1,5 Mo** au total, dont moins de 1 Mo d'images ;
   - LCP **< 2,5 s** en « Slow 4G » ;
   - taux de cache Bunny **> 90 %** après une semaine.

---

## 9. Coûts

Hypothèses : 10 000 visites/mois, 1,5 page par visite, ≈ 0,6 Mo d'images par page après optimisation, soit ≈ 9 Go/mois. Tarifs publics Bunny consultés le 29/09/2026.

| Poste | Calcul | Coût mensuel |
| --- | --- | --- |
| Storage `amame-public` | ≈ 1 Go × 0,01 $ (Standard, 1 région) | ≈ 0,01 $ |
| Storage `amame-private` | ≈ 0,5 Go × 0,01 $ | < 0,01 $ |
| CDN | 9 Go × 0,01 $ (PoP Europe) à 0,06 $ (Lagos) ; aucun frais par requête | 0,09 à 0,54 $ |
| Minimum de facturation | 1 $/mois | — |
| **Sous-total sans Optimizer** | | **≈ 1 $** |
| Bunny Optimizer | forfait par site, transformations illimitées | 9,50 $ |
| **Total avec Optimizer** | | **≈ 10 $** |

- **Aujourd'hui**, sans CDN ni optimisation, chaque première visite de l'accueil coûte environ 52 Mo au VPS et au visiteur. À 10 000 visites, cela peut atteindre plusieurs centaines de Go/mois pour le VPS, et un coût data réel pour les étudiants.
- La réplication d'une zone dans une deuxième région coûterait + 0,01 $/Go/mois. Elle n'est pas nécessaire au départ.

---

## 10. Exploitation

- **Supervision** : dans le tableau de bord Bunny, suivre la bande passante par région, le taux de cache, les erreurs et les requêtes. Vérifier le coût réel à la fin du premier mois.
- **Sauvegarde** : la réplication ne protège pas contre une suppression. Prévoir une copie mensuelle des deux zones hors de Bunny (accès FTP de la zone, ou listing + `GET`), chiffrée pour la zone privée.
- **Rotation des clés** : régénérer le mot de passe de la zone dans le panneau, mettre à jour le `.env` du serveur, redéployer.
- **Incident Bunny** :
  - les pages s'affichent sans images ;
  - les uploads échouent avec une erreur explicite, sans incohérence en base grâce au §4.6 ;
  - en cas de problème DNS ou SSL sur le domaine personnalisé, basculer `MEDIA_BASE_URL` sur `https://amame-media.b-cdn.net`.
- **Documentation** : mettre à jour `CLAUDE.md` (stockage, variables, tags d'image, port backend) et le README (sauvegarde des fichiers, variables Bunny).

---

## 11. Plan de livraison

| Phase | Contenu | Résultat | Effort indicatif |
| --- | --- | --- | --- |
| **0 — Urgences (sans Bunny)** | changer les secrets Gmail et JWT ; `git rm --cached` des `.env` et de `backend/uploads` ; bloquer `/uploads/utilisateur/` (Nginx + Security) ; convertir les images statiques en WebP, supprimer les 21,6 Mo inutilisés et remplacer le favicon ; `loading="lazy"`, `width`/`height` et `fetchpriority` ; fermer le port 8080 ; aligner `-Xmx` ; limiter le débit de l'inscription | fuite stoppée ; accueil de ≈ 52 Mo à < 1,5 Mo | 1 à 2 j |
| **1 — Refactoring sans changement de comportement** | injection par interface (9 services), `StorageProperties`, mode local corrigé, `UploadValidator`, support transactionnel, `orphanRemoval` + listener (et réécriture de `UserService.update`), `MediaUrlResolver` + champs `*Url`, corrections `ConcoursMapper`/`ConcoursRepository`, endpoint privé ; côté frontend : `media.ts`, `<MediaImage>`, remplacement des 19 constantes | déployable en production avec `STORAGE_PROVIDER=local` | 3 à 4 j |
| **2 — Bunny** | compte, zones, Pull Zone, DNS/SSL ; `BunnyStorageClient` + `BunnyFileStorageService` + tests ; migration et bascule (§7) | fichiers sur Bunny, backend sans état local | 2 à 3 j |
| **3 — Optimisation d'images** | Optimizer + Image Classes, images statiques vers `static/`, `srcset`/`sizes`, compression avant upload, `preconnect`, nettoyage Workbox | LCP < 2,5 s ; images en WebP à la bonne taille | 2 à 3 j |
| **4 — Nettoyage et durcissement** | retrait des volumes, job de réconciliation, sauvegarde mensuelle, documentation, décision sur l'historique Git | exploitation stable | 1 à 2 j |

Total : **9 à 14 jours-homme**. Les phases 0 et 1 peuvent démarrer immédiatement, et la phase 0 apporte l'essentiel du gain perçu par les utilisateurs.

---

## 12. Risques du projet et parades

| Risque | Parade |
| --- | --- |
| Latence élevée depuis le Mali malgré le CDN | mesures réelles avant bascule (§3.6, §8.3) ; choix des régions de diffusion |
| Fichier oublié pendant la migration | clés identiques ; script idempotent relancé après bascule ; comparaison des comptes par dossier |
| Fuite d'une clé de storage | une clé par zone, uniquement dans le `.env` du serveur ; clé API du compte non déployée sans nécessité ; rotation |
| Jetons JWT transmis au CDN | cookies *host-only* ou nom d'hôte `b-cdn.net` (D10) |
| Coût d'Optimizer jugé trop élevé | variante sans Optimizer (D6), réversible à tout moment |
| Régressions d'affichage | helper unique, champs `*Url` ajoutés sans retirer les anciens, recette page par page |
| Exception Hibernate avec `orphanRemoval` sur `User.files` | modifier la collection sur place, ne jamais la remplacer (§4.7) |
| Dépendance au fournisseur | clés neutres, URLs calculées et abstraction : changer de fournisseur = une nouvelle implémentation + une copie des objets |

---

## Sources Bunny.net (consultées le 29/09/2026)

- Tarifs : [CDN](https://bunny.net/pricing/) · [Storage](https://bunny.net/pricing/storage/) · [Optimizer](https://bunny.net/pricing/optimizer/)
- Storage : [API HTTP](https://bunny.net/docs/storage/http.md) · [S3 (preview)](https://bunny.net/docs/storage/s3.md) · [Tiers](https://bunny.net/docs/storage/storage-tiers.md) · [Réplication](https://bunny.net/docs/storage/replication.md)
- CDN : [Réseau / PoP](https://bunny.net/network/) · [Purge](https://bunny.net/docs/cdn/purge-cache.md) · [API Purge URL](https://bunny.net/docs/api-reference/core/purge/purge-url) · [API Pull Zone (`EnableGeoZoneAF`)](https://bunny.net/docs/api-reference/core/pull-zone/update-pull-zone)
- Sécurité : [Token Authentication](https://bunny.net/docs/cdn/security/token-authentication/index.md) · [Basique (MD5)](https://bunny.net/docs/cdn/security/token-authentication/basic.md) · [Avancée (HMAC-SHA256)](https://bunny.net/docs/cdn/security/token-authentication/advanced.md)
- Optimizer : [Dynamic Images](https://bunny.net/docs/optimizer/dynamic-images/overview.md) · [Image Classes](https://docs.bunny.net/optimizer/image-classes)
