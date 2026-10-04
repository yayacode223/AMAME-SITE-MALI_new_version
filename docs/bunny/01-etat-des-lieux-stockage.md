# État des lieux — Stockage et diffusion des fichiers (AMAME)

| | |
| --- | --- |
| **Date** | 29 septembre 2026 |
| **Base analysée** | branche `main`, commit `0e43556` + observation du site en production (`https://amame.ml`) |
| **Périmètre** | backend Spring Boot, frontend React/Vite, Nginx, Docker Compose, scrapers Python |
| **Nature** | audit en lecture seule : aucun fichier de code n'a été modifié |
| **Document lié** | [02 — Plan d'implémentation Bunny.net](02-plan-implementation-bunny.md) |

---

## Résumé

1. **Stockage local sur un serveur unique.** Tous les fichiers uploadés sont écrits sur le disque du VPS (`./backend/uploads`), monté à la fois dans le conteneur backend et dans le conteneur Nginx. Le backend a donc un état local : impossible de lancer une deuxième instance sur une autre machine, et aucune sauvegarde de ces fichiers n'est prévue.
2. **Le vrai frein à la performance, c'est le poids des images.** La page d'accueil télécharge **≈ 52 Mo d'images** (8 PNG de 5 à 7,5 Mo, affichés dans des cadres de 176 à 208 px de haut, plus un hero de 7,3 Mo, taille confirmée en production). Sur une connexion mobile à 2 Mbit/s, cela représente **≈ 3 min 30** de téléchargement et un coût en données important pour les étudiants. Aucune image n'est redimensionnée, compressée ou convertie en WebP/AVIF, ni au build ni à l'upload.
3. **Aucun CDN.** Tout est servi depuis un seul serveur (`77.237.243.111`, derrière un reverse-proxy OpenResty). En production, les images expirent à heure fixe (le 29/09/2026, `Expires` valait 00:30 GMT le lendemain, soit un cache navigateur de moins de 24 h), ce qui annule les durées de cache prévues dans `nginx.conf`.
4. **Données personnelles exposées.** Les CV et photos des inscrits (`uploads/utilisateur/`) sont servis **publiquement et sans contrôle d'accès**. L'upload est ouvert aux visiteurs anonymes, sans limitation de débit. **34 fichiers d'utilisateurs (17 CV PDF, 17 photos) sont versionnés dans Git** depuis le 21/09/2025. Deux fichiers `.env` versionnés contiennent des secrets, dont un mot de passe d'application Gmail.
5. **Le code de stockage est fragile.** Neuf services dépendent directement de l'implémentation concrète `FileStorageServiceImpl`. Le chemin est codé en dur à trois endroits (la propriété de configuration est ignorée). Les suppressions ont lieu avant le commit, et **6 services sur 9 laissent des fichiers ou des lignes orphelins**.
6. **Conclusion.** Bunny.net (Storage + CDN + Optimizer) répond directement aux points 1 à 3, à deux conditions : introduire une vraie abstraction de stockage et traiter les images (redimensionnement + WebP). Les points 4 et 5 sont à corriger quel que soit le fournisseur retenu. La section [7](#7-actions-immédiates-indépendantes-de-bunny) liste les actions à lancer tout de suite.

---

## 1. Méthode et limites

**Lu intégralement :**

- tout le stockage backend : `service/file/*`, `model/File`, `FileDto`, `FileMapper`, `FileRepository`, `FileType` ;
- les 9 services et 9 contrôleurs qui gèrent des fichiers, les entités, mappers et repositories liés ;
- la configuration : `SecurityConfig`, `WebMvcconfigurer`, les fichiers `application*.properties`, `pom.xml` ;
- l'infrastructure : `docker-compose.yml`, les Dockerfiles, `nginx.conf`, les `.gitignore`/`.dockerignore`, les `.env` ;
- le frontend : `vite.config.ts`, `index.html`, `axiosInstance`, les services, les formulaires d'upload et toutes les pages qui affichent un fichier ;
- les trois scrapers Python.

**Mesures :** `du`/`file` pour les tailles et dimensions des fichiers du dépôt, un script de recherche des références d'assets dans `src/`, et des requêtes `HEAD` sur le site public (pages et images publiques uniquement, **aucun fichier utilisateur n'a été consulté**).

**Limites :**

- le contenu réel du volume `uploads` en production n'a pas été inventorié (les fichiers du dépôt diffèrent de ceux de la production) ;
- ni la table `file_entity`, ni les variables d'environnement effectives, ni le trafic réel n'ont été observés.

Les estimations de coûts du rapport 02 reposent donc sur des hypothèses explicites.

---

## 2. Architecture actuelle

### 2.1 Schéma

```text
Navigateur (Mali, mobile majoritaire)
   │ HTTPS
   ▼
Reverse-proxy OpenResty (TLS, en-têtes Expires à heure fixe)   ← hors dépôt, probablement sur le même VPS
   │ HTTP
   ▼
Nginx — conteneur amame-frontend (port 80)
   ├── /assets/**, /images/**, /amame-uploads/**  → fichiers du build Vite, embarqués dans l'image Docker (~92 Mo d'images)
   ├── /uploads/**   (alias /app/uploads/)          → ./backend/uploads   ← bind-mount du disque du VPS
   └── /api/**       (proxy)                        → Spring Boot (amame-backend, port 8080 aussi publié sur l'hôte)
                                                          │ Files.copy / Files.deleteIfExists
                                                          ▼
                                                     ./backend/uploads   (même dossier, même disque)
```

### 2.2 Chaîne d'upload (backend)

1. Le contrôleur reçoit un `multipart/form-data` : une partie JSON (`article`, `bourse`, …) et une partie fichier (`file` ou `image`). Taille maximale : 10 Mo ([application.properties:55-56](../../backend/src/main/resources/application.properties#L55-L56), [nginx.conf:175](../../frontend/nginx.conf#L175)).
2. Le service appelle `FileStorageServiceImpl.storeFile(file, "<dossier>", FileType)` ([FileStorageServiceImpl.java:76-125](../../backend/src/main/java/com/example/siteamame/service/file/FileStorageServiceImpl.java#L76-L125)). Celui-ci :
   - vérifie le type MIME **déclaré par le client** et l'extension (liste blanche) ;
   - renomme le fichier en `UUID.ext` ;
   - l'écrit dans `uploads/<dossier>/` **relativement au répertoire de travail** du processus ;
   - renvoie `filePath = "uploads/<dossier>/<uuid>.<ext>"`.
3. Le service convertit le `FileDto` en entité `File` (table `file_entity`), l'enregistre, puis l'associe à l'entité métier par un `@OneToOne(cascade = ALL)`.
4. Les DTO renvoyés au frontend exposent ce chemin **relatif** (`filePath`, `imagePath`, `cvPath`, `coverImagePath`), comme le confirme `GET /api/visitor/articles` en production.

### 2.3 Chaîne de lecture (frontend)

- Le frontend construit l'URL lui-même, avec trois variantes : `${PROD_URL}/${filePath}` (la plupart des pages), `/${filePath}` (ConcoursDetail, OrientationDetail) ou le chemin brut (avatar mobile de la Navbar, voir F1).
- Nginx sert `/uploads/**` directement depuis le volume (bloc `^~`, [nginx.conf:142-147](../../frontend/nginx.conf#L142-L147)). Le backend expose lui aussi `/uploads/**` depuis `file:/app/uploads/` ([WebMvcconfigurer.java:12-13](../../backend/src/main/java/com/example/siteamame/config/WebMvcconfigurer.java#L12-L13)), en `permitAll` ([SecurityConfig.java:44](../../backend/src/main/java/com/example/siteamame/config/SecurityConfig.java#L44)). Ce second chemin serait joignable directement, puisque le port 8080 est publié dans le compose ([docker-compose.yml:28-29](../../docker-compose.yml#L28-L29)). En production, un pare-feu le filtre (vérifié le 30/09/2026).

### 2.4 Inventaire fonctionnel des fichiers

| Dossier | Entité (champ) | Type déclaré | Upload via | Qui uploade | Affiché où | Sensibilité |
| --- | --- | --- | --- | --- | --- | --- |
| `actualite` | `Article.file` | IMAGE | `POST/PUT /api/admin/articles` (part `image`) | admin, éditeur | Articles, Postes, GuideConseils, ArticleDetail | public |
| `bourses` | `Bourse.file` | DOCUMENT | `/api/admin/bourses` (part `file`) | admin | **nulle part** : le fichier n'est exposé par aucun DTO | public |
| `concours` | `Concours.file` | DOCUMENT, mais affiché comme image de carte | `/api/admin/concours` | admin | ConcoursCardItem (image), ConcoursDetail (image + téléchargement) | public |
| `filiere` | `Filiere.file` | IMAGE | `/api/admin/filieres` | admin | Orientation, OrientationDetail | public |
| `galerie` | `Galerie.coverImage` | IMAGE | `/api/admin/galeries` (part `image`) | admin | Galeries | public |
| `membre` | `Membre.file` | IMAGE | `/api/admin/membres` | admin | Membres (bureau) | public (personnes réelles) |
| `partenaire` | `Partenaire.file` | IMAGE | `/api/admin/partenaires` | admin | Partenaires | public |
| `ressource` | `RessourceAcademique.file` | DOCUMENT | `/api/admin/ressources` | admin | RessourcesAcademiques (lien) | public |
| `utilisateur` | `User.files` (CV + photo) | DOCUMENT + IMAGE | **`POST /api/visitor/register` (anonyme)**, `PUT /api/user/update/{id}` | tout visiteur | Navbar, espace membre, back-office | **privé : données personnelles, possiblement de mineurs** |

**Hors upload :**

- **Images externes chargées directement depuis d'autres sites** : `Etablissement.urlLogo/urlImage` (scrapés sur legrandfrere.africa) et `Opportunites.urlDrapeau/urlPdf1/urlPdf2` (dg-enseignementsup.ml) sont enregistrés en base comme URLs externes et affichés tels quels ([scraper_etablissement.py:63-89](../../scraper/scraper_etablissement.py#L63-L89)).
- **Images statiques** : ~92 Mo dans `frontend/public/` (voir §3.2).

---

## 3. Volumétrie mesurée

### 3.1 Uploads

| Source | Contenu | Remarque |
| --- | --- | --- |
| Dépôt (`backend/uploads/`) | 37 fichiers, 11 Mo (`actualite` : 3, `utilisateur` : 34) | photos d'articles jusqu'à **6000 × 3374 px** ; photos de profil de **2773 × 4160 px** |
| Production (observé via l'API) | 5 articles publiés ; images de 106 Ko à 487 Ko | les fichiers de production ne sont pas ceux du dépôt |

Le volume de production est probablement faible (quelques dizaines à quelques centaines de Mo), ce qui rend une migration rapide et peu risquée.

### 3.2 Images statiques du frontend

| Dossier | Taille | Détail |
| --- | --- | --- |
| `public/amame-uploads/` | 59 Mo | 7 PNG « AMAME-IMAGE » de 4,9 à 7,4 Mo, en 2048 × 2048 ou 2816 × 1536 px |
| `public/images/` | 33 Mo | dont `heroes/` : 25 Mo (30 PNG, jusqu'à 7 Mo) |
| **Référencées dans le code** | **68,5 Mo** | |
| **Jamais référencées** | **21,6 Mo** (128 fichiers) | variantes `*1.png` des heroes, `filieres/*.png`, restes de template : `carousel`, `cards`, `grid-image`, `user`, `product`… |
| `public/favicon.svg` | **583 Ko** | contient une image raster encodée en base64 ; une icône devrait peser moins de 5 Ko |

Point notable : `images/heroes/hero-homepage1.png` est en réalité un fichier JPEG portant l'extension `.png`.

### 3.3 Poids de la page d'accueil

| Élément | Fichier | Dimensions | Poids | Taille d'affichage |
| --- | --- | --- | --- | --- |
| Hero (image LCP) | `images/heroes/hero-homepage.png` | 2752 × 1536 | **7,0 Mo** (7 314 372 octets en prod) | plein écran |
| 3 cartes « fonctionnalités » | `AMAME-IMAGE/Concours&Opportunités.png`, `Orientation&Filières.png`, `Boursesd'études.png` | 2816 × 1536 | 5,4 + 5,1 + 4,9 Mo | 176 px de haut (`h-44`) |
| Section bénévolat | `AMAME-IMAGE/SectionBénévolat.png` | 2752 × 1536 | 7,0 Mo | desktop uniquement, **mais téléchargée aussi sur mobile** (`<img>` sans `loading="lazy"` dans un bloc `hidden`) |
| 3 témoignages | `Fatoumata…`, `Coulibaly…`, `Aïcha….png` | 2048 × 2048 | 7,4 + 7,0 + 7,0 Mo | 208 px de haut (`h-52`) |
| Logo (Navbar + Footer) | `amame-logo.webp` | — | 0,29 Mo | 40 px |
| Favicon | `favicon.svg` | — | 0,57 Mo | 16 à 32 px |
| **Total images** | | | **≈ 52 Mo** | |

- Durée de téléchargement : ≈ 42 s à 10 Mbit/s (bonne 4G), ≈ 3 min 30 à 2 Mbit/s (3G ou 4G saturée).
- Cible réaliste après optimisation : **moins de 1 Mo d'images**, en WebP dimensionné à la taille d'affichage.
- Les pages internes chargent chacune un hero PNG de 0,3 à 1 Mo sans lazy loading ([PageHero.tsx:34-39](../../frontend/src/components/PageHero.tsx#L34-L39)). Les pages de connexion et de mot de passe oublié réutilisent le hero de 7 Mo en arrière-plan CSS ([Authentication.tsx:108](../../frontend/src/pages/Authentication.tsx#L108), [ForgotPassword.tsx:62](../../frontend/src/pages/ForgotPassword.tsx#L62)).

---

## 4. Constats détaillés

Niveaux de gravité : 🔴 critique · 🟠 élevé · 🟡 moyen · ⚪ faible.

### 4.1 Scalabilité, disponibilité, exploitation

| ID | Constat | Gravité |
| --- | --- | --- |
| A1 | **Backend avec état local.** Les fichiers vivent sur le disque de l'hôte (`./backend/uploads:/app/uploads`, [docker-compose.yml:62-63](../../docker-compose.yml#L62-L63)), et le même dossier est monté dans Nginx ([docker-compose.yml:79-81](../../docker-compose.yml#L79-L81)). Avec une deuxième instance sur une autre machine, un fichier uploadé sur l'instance A serait introuvable depuis B : **pas de scalabilité horizontale.** | 🟠 |
| A2 | **Aucune sauvegarde des fichiers.** Le README ne prévoit une sauvegarde que pour PostgreSQL. La perte du disque du VPS entraîne la perte de toutes les images et de tous les CV, alors que la base continue de les référencer. | 🟠 |
| A3 | **Image Docker frontend alourdie** d'environ 92 Mo d'images, dont 21,6 Mo inutilisés : chaque build et chaque déploiement transfère ce poids. Le montage `./frontend/dist:/app/dist` ne sert à rien (Nginx sert `/usr/share/nginx/html`). | 🟡 |
| A4 | **Port 8080 publié dans le compose versionné** : sans pare-feu, l'API et `/uploads/**` seraient joignables sans passer par Nginx (contournement des en-têtes et des limites). Le 30/09/2026, ce port ne répondait pas depuis Internet (pare-feu en place), mais la configuration reste risquée sur tout autre hôte. Le README et le CLAUDE.md indiquent « backend interne uniquement ». | 🟡 |
| A5 | **Mémoire JVM incohérente** : `-Xmx2g` ([backend/Dockerfile:30](../../backend/Dockerfile#L30)) avec une limite conteneur de 512 Mo ([docker-compose.yml:53-56](../../docker-compose.yml#L53-L56)). Risque d'arrêt brutal (OOM kill) pendant les uploads, qui chargent les fichiers en mémoire. | 🟡 |

### 4.2 Performance de chargement

| ID | Constat | Gravité |
| --- | --- | --- |
| P1 | **≈ 52 Mo d'images sur l'accueil** (§3.3). C'est le premier facteur de lenteur du site, loin devant l'emplacement du stockage. | 🔴 |
| P2 | **Aucun traitement à l'upload** : les photos de 6000 px (≈ 1,9 Mo) sont stockées et resservies telles quelles. Le WebP n'est même pas accepté par la liste blanche ([FileStorageServiceImpl.java:34-48](../../backend/src/main/java/com/example/siteamame/service/file/FileStorageServiceImpl.java#L34-L48)). | 🟠 |
| P3 | **Balisage des images non optimisé** : 15 balises `<img>` sur 51 ont `loading="lazy"` ; aucune n'a `width`/`height` (décalages de mise en page, CLS), `srcset`/`sizes` ou `fetchpriority`. Les images affichées en dessous de la ligne de flottaison sont chargées immédiatement ([Index.tsx:149-153](../../frontend/src/pages/Index.tsx#L149-L153), [Index.tsx:238-241](../../frontend/src/pages/Index.tsx#L238-L241)). | 🟠 |
| P4 | **Aucun CDN** : chaque octet part du VPS (`Server: openresty`, pas d'en-tête de cache CDN). Le Mali n'a pas de datacenter proche, et la bande passante du VPS est consommée par les images (≈ 52 Mo par nouvelle visite de l'accueil). | 🟠 |
| P5 | **Cache navigateur effectif ≤ 24 h.** En production, les images (statiques comme uploads) reviennent avec une expiration à heure fixe (`Expires: 00:30 GMT` le lendemain, observé le 29/09/2026), vraisemblablement imposée par le proxy frontal. La configuration versionnée prévoyait 7 jours (PNG/WebP), 30 jours (`/uploads/`) ou 1 an (`/images/`, `/assets/`). Par ailleurs, dans `nginx.conf`, le bloc regex `~* \.(png\|webp…)$` ([nginx.conf:150-154](../../frontend/nginx.conf#L150-L154)) l'emporte sur le préfixe `/images/`, dont le cache d'un an n'est donc jamais appliqué aux PNG. | 🟡 |
| P6 | **En-têtes de sécurité perdus sur les fichiers** : Nginx n'hérite pas des `add_header` du niveau `server` dans un bloc `location` qui définit ses propres `add_header`. Les réponses `/uploads/`, `/images/` et `/assets/` n'ont donc ni `X-Content-Type-Options: nosniff` ni les autres en-têtes (constaté en production sur `/uploads/`). | 🟡 |
| P7 | **Service worker (Workbox)** : cache `CacheFirst` pour `/amame-uploads/**` mais rien pour `/uploads/**` ([vite.config.ts:133-159](../../frontend/vite.config.ts#L133-L159)). | ⚪ |
| P8 | **Images externes chargées directement depuis d'autres sites** (logos d'établissements, drapeaux) : la performance et la disponibilité dépendent de sites tiers, et les images peuvent disparaître à tout moment. | ⚪ |

### 4.3 Backend — code de stockage

| ID | Constat | Gravité |
| --- | --- | --- |
| B1 | **Chemin codé en dur, configuration ignorée** : `@Value("uploads/")` injecte la chaîne littérale `uploads/`, pas une propriété, et le paramètre `uploadDir` du constructeur n'est jamais utilisé ([FileStorageServiceImpl.java:50-54](../../backend/src/main/java/com/example/siteamame/service/file/FileStorageServiceImpl.java#L50-L54)). Le chemin dépend donc du répertoire de lancement du processus. | 🟡 |
| B2 | **Handler statique figé sur `/app/uploads/`** ([WebMvcconfigurer.java:13](../../backend/src/main/java/com/example/siteamame/config/WebMvcconfigurer.java#L13)) : en développement local hors Docker (Windows), les fichiers sont écrits dans `backend/uploads/` mais servis depuis `C:/app/uploads/`. Ils sont donc introuvables. | 🟡 |
| B3 | **Pas d'abstraction réelle** : l'interface `FileStorageService` existe, mais les 9 services injectent `FileStorageServiceImpl` directement (ex. [ArticleService.java:40](../../backend/src/main/java/com/example/siteamame/service/ArticleService.java#L40)). Changer de stockage impose de modifier 9 classes, et aucune bascule par configuration n'est possible. | 🟠 |
| B4 | **Validation faible** : le type MIME vient du client (`file.getContentType()`, [L94-97](../../backend/src/main/java/com/example/siteamame/service/file/FileStorageServiceImpl.java#L94-L97)) et le contenu réel n'est pas vérifié (octets de signature). Pas de limite de taille par type. `image/jpg` n'est pas un type MIME standard. | 🟡 |
| B5 | **Incohérence transactionnelle** : l'ancien fichier est supprimé du disque *avant* le commit. Si la transaction échoue ensuite, la base pointe vers un fichier qui n'existe plus. À l'inverse, un fichier écrit avant un rollback reste orphelin sur le disque. | 🟠 |
| B6 | **Orphelins dans 6 services sur 9** (tableau ci-dessous). | 🟠 |
| B7 | **Modèle de données** : `@OneToOne(cascade = ALL)` **sans `orphanRemoval`** sur les 8 entités, ce qui fait qu'un remplacement de fichier laisse l'ancienne ligne `file_entity` en base. `File.user` ([File.java:37-39](../../backend/src/main/java/com/example/siteamame/model/File.java#L37-L39)) n'est jamais renseigné, alors que `User.files` passe par une table de jointure séparée ([User.java:47-48](../../backend/src/main/java/com/example/siteamame/model/User.java#L47-L48)). | 🟡 |
| B8 | **Bugs liés au caractère optionnel du fichier** : `ConcoursMapper.convertToDTO` appelle `concours.getFile().getFilePath()` sans contrôle de nullité, d'où une NPE (erreur 500) sur tout concours sans fichier ([ConcoursMapper.java:28](../../backend/src/main/java/com/example/siteamame/mapper/ConcoursMapper.java#L28)). Les requêtes JPQL de `ConcoursRepository` sélectionnent `c.file.filePath`, ce qui crée une jointure interne implicite : **les concours sans fichier disparaissent des listes** ([ConcoursRepository.java:28](../../backend/src/main/java/com/example/siteamame/repository/ConcoursRepository.java#L28)). | 🟠 |
| B9 | **Fichiers de bourse inutilisés** : ils sont uploadés et stockés, mais `BourseDetailDto` et `BourseSummaryDto` n'exposent aucun chemin. Le frontend affiche à la place des drapeaux statiques par pays. | ⚪ |
| B10 | `FiliereController.ajouterFiliere` lit la partie JSON avec `@RequestParam` au lieu de `@RequestPart` ([FiliereController.java:78](../../backend/src/main/java/com/example/siteamame/controller/FiliereController.java#L78)), alors que la mise à jour utilise `@RequestPart`. | ⚪ |

#### Gestion des orphelins par service

| Service | Remplacement : ancien fichier disque supprimé ? | Remplacement : ancienne ligne `file_entity` supprimée ? | Suppression de l'entité : fichier disque supprimé ? |
| --- | --- | --- | --- |
| Article | ✅ | ❌ | ❌ |
| Bourse | ✅ | ✅ | ✅ |
| Concours | ✅ | ❌ | ❌ |
| Filière | ✅ | ❌ | ❌ |
| Galerie | ✅ | ❌ | ❌ |
| Membre (bureau) | ❌ | ❌ | ❌ |
| Partenaire | ❌ | ❌ | ❌ |
| Ressource académique | ❌ | ❌ | ❌ |
| Utilisateur | ✅ | ❌ (seule la ligne de jointure disparaît) | ❌ |

Toutes les suppressions « ✅ » sont faites avant le commit (voir B5). Seul `BourseService` est complet.

### 4.4 Frontend

| ID | Constat | Gravité |
| --- | --- | --- |
| F1 | **Construction des URLs dispersée** : 19 fichiers définissent leur propre constante `https://amame.ml` (`PROD_URL` ou `url`) pour préfixer les chemins, et deux pages utilisent `/${filePath}`. L'avatar mobile de la Navbar utilise le chemin brut `uploads/…`, résolu relativement à la route courante, donc **toujours cassé** ([Navbar.tsx:279](../../frontend/src/components/Navbar.tsx#L279)). Changer d'hôte pour les médias demanderait aujourd'hui une vingtaine de modifications manuelles. | 🟠 |
| F2 | **Code mort** : `open*/download*File` dans 4 services utilisent `process.env.REACT_APP_API_URL` (syntaxe Create React App, `process` n'existe pas sous Vite). Ces fonctions ne sont appelées nulle part. | ⚪ |
| F3 | **Attribut `accept` incohérent avec le backend** : `image/*` (8 formulaires) laisse passer HEIC/WebP/AVIF, refusés par le backend ; le formulaire de ressources accepte `.ppt/.pptx` ([RessourceForm.tsx:144](../../frontend/src/pages/admin/RessourceForm.tsx#L144)), également refusés. L'utilisateur ne découvre l'erreur qu'après l'envoi. | 🟡 |
| F4 | **Pas de compression côté client** : une photo de téléphone de 3 à 8 Mo est envoyée telle quelle, sur réseau mobile, et les métadonnées EXIF (dont la position GPS) sont conservées. | 🟡 |
| F5 | **Téléchargement par `<a download>`** ([ConcoursDetail.tsx:54-63](../../frontend/src/pages/ConcoursDetail.tsx#L54-L63)) : fonctionne tant que le fichier est sur le même domaine. Le navigateur ignore l'attribut `download` pour une URL d'un autre domaine (à prévoir avec un CDN). | ⚪ |

### 4.5 Sécurité et données personnelles

| ID | Constat | Gravité |
| --- | --- | --- |
| S1 | **CV et photos d'utilisateurs publics** : `/uploads/utilisateur/<uuid>.pdf` est servi par Nginx sans authentification, avec un cache public. Le nom UUID rend les URLs difficiles à deviner, mais toute URL qui fuit (logs, historique, partage) reste valable indéfiniment. | 🔴 |
| S2 | **Upload anonyme sans limitation** : `POST /api/visitor/register` accepte jusqu'à 10 Mo par requête sans authentification ni limite de débit ([UserController.java:42-49](../../backend/src/main/java/com/example/siteamame/controller/UserController.java#L42-L49)). Le disque du VPS peut être rempli volontairement. | 🟠 |
| S3 | **Données personnelles et secrets dans Git** : `backend/uploads/**` (37 fichiers, dont 17 CV PDF) ainsi que `backend/.env` et `frontend/.env` sont versionnés depuis le 21/09/2025, bien qu'ils figurent dans `.gitignore` : ils ont été ajoutés avant la règle. `frontend/.env` contient un **mot de passe d'application Gmail** ; `backend/.env` contient le `JWT_SECRET`, identique à la valeur par défaut de [docker-compose.yml:36](../../docker-compose.yml#L36). Toute personne ayant accès au dépôt (public ?) y a accès, historique compris. | 🔴 |
| S4 | **Métadonnées EXIF** (GPS, modèle d'appareil) conservées sur les photos publiques (membres du bureau, galeries). | 🟡 |
| S5 | **Public potentiellement mineur** (« meilleurs élèves ») : les photos et CV relèvent de données personnelles à protéger par défaut. | 🟠 |

### 4.6 Relevés hors périmètre

Ces points ne concernent pas le stockage, mais ils ont été repérés dans les fichiers lus :

- **Précédence AND/OR dans `ConcoursRepository`** : dans `findValideConcoursByNiveauOrByStatus` et `findValideConcoursBySearch` ([ConcoursRepository.java:51-54](../../backend/src/main/java/com/example/siteamame/repository/ConcoursRepository.java#L51-L54), [L76-80](../../backend/src/main/java/com/example/siteamame/repository/ConcoursRepository.java#L76-L80)), le dernier `OR` n'est pas entre parenthèses. Des concours expirés ou désactivés peuvent donc apparaître dans les résultats filtrés, et même tous les concours lorsque `status` est nul. Ces requêtes sont modifiées de toute façon par le plan (jointure externe), c'est l'occasion de les corriger.
- **Cache hors ligne des réponses d'API authentifiées** : la règle Workbox `NetworkFirst` sur `/api/**` conserve 24 h les réponses personnelles (profil, listes admin) sur l'appareil ([vite.config.ts:137-146](../../frontend/vite.config.ts#L137-L146)). C'est un risque sur les appareils partagés (cybercafés) ; à restreindre aux routes publiques `/api/visitor/**`.

### 4.7 Documentation

- `CLAUDE.md` n'est plus à jour : les tags d'image annoncés (`yaya236/...:frontend-v4.6`) ne sont pas ceux du compose (`yayacode224/amame:*-v1.0`), et il décrit un backend « internal only » alors que le compose publie le port 8080.
- Le README affirme « Il n'y a pas de fichier `.env.example` versionné », alors qu'il en existe un à la racine.

---

## 5. Matrice des risques

| Priorité | Risque | Constats | Probabilité | Impact |
| --- | --- | --- | --- | --- |
| **P0** | Fuite de données personnelles (CV, photos) et de secrets (Gmail, JWT) | S1, S3, S5 | élevée (déjà exposés) | juridique, réputation, compromission de comptes |
| **P0** | Site perçu comme très lent ou abandonné sur mobile ; coût data pour les utilisateurs | P1, P3, P5 | certaine | audience, mission de l'association |
| **P1** | Perte définitive des fichiers (panne ou perte du disque du VPS) | A1, A2 | faible à moyenne | toutes les images et documents |
| **P1** | Saturation du disque par des uploads anonymes | S2 | moyenne | indisponibilité du site |
| **P1** | Erreurs 500 et concours invisibles lorsqu'ils n'ont pas de fichier | B8 | élevée | fonctionnel |
| **P2** | Accumulation d'orphelins, incohérences base ↔ disque | B5, B6, B7 | certaine (lente) | coût, confusion, images cassées |
| **P2** | Impossible de monter en charge ou de redéployer sans coupure | A1, B3 | selon la croissance | évolutivité |
| **P3** | Dette frontend (URLs en dur, code mort, `accept` incohérents) | F1 à F5 | — | maintenabilité |

---

## 6. Adéquation de Bunny.net aux problèmes constatés

| Problème | Brique Bunny | Ce qui reste à faire côté AMAME |
| --- | --- | --- |
| Stockage local sans scalabilité (A1) | **Bunny Storage** : stockage objet accessible par API HTTP, réplication multi-régions optionnelle | abstraction `FileStorageService` réelle, backend sans état local |
| Pas de sauvegarde (A2) | redondance du fournisseur, réplication optionnelle (+0,01 $/Go/mois pour 2 régions) | la réplication n'est pas une sauvegarde : prévoir une copie périodique (FTP ou API) |
| Pas de CDN (P4, P5) | **Pull Zone** : 119 PoP, dont Lagos, Lisbonne, Madrid et Marseille, proches de l'Afrique de l'Ouest ; contrôle total des en-têtes de cache | clés immuables (UUID) pour un cache d'un an sans purge |
| Images lourdes (P1, P2) | **Bunny Optimizer** (9,50 $/mois) : redimensionnement, compression et WebP à la volée par paramètres d'URL ou « Image Classes » | `srcset`/`sizes`, `loading="lazy"`, `width`/`height` côté frontend |
| Bande passante du VPS | trafic média déplacé vers Bunny (0,01 $/Go en Europe/Amérique du Nord, 0,06 $/Go en Afrique) | — |
| Fichiers privés (S1) | zone de stockage **non exposée** ; ou Pull Zone avec Token Authentication (URLs signées) | endpoint backend authentifié |

**Ce que Bunny ne résout pas :**

- les secrets et données personnelles déjà versionnés (S3) ;
- la validation des uploads (B4) et la limitation de débit (S2) ;
- les orphelins et la cohérence transactionnelle (B5 à B7) ;
- les bugs de mapping (B8) et la dette frontend (F1 à F5).

Déplacer 52 Mo de PNG sur un CDN sans les optimiser accélère leur transfert, mais **laisse 52 Mo à télécharger**. L'optimisation d'images est indispensable.

---

## 7. Actions immédiates (indépendantes de Bunny)

Elles sont détaillées dans la **phase 0** du [plan d'implémentation](02-plan-implementation-bunny.md#11-plan-de-livraison).

1. **Secrets (S3)** : révoquer le mot de passe d'application Gmail et régénérer `JWT_SECRET`, puis retirer du suivi Git `frontend/.env`, `backend/.env` et `backend/uploads/` (`git rm --cached`). Le nettoyage de l'historique (réécriture + force-push) est une décision d'équipe, à planifier.
2. **Fermer l'accès public à `/uploads/utilisateur/`** dans Nginx et dans Spring Security (S1).
3. **Optimiser les images statiques** : convertir les heroes et `AMAME-IMAGE` en WebP à 640, 1280 et 1920 px, supprimer les 21,6 Mo inutilisés, remplacer `favicon.svg`, ajouter `loading="lazy"`, `width`/`height` et `fetchpriority="high"` sur le hero. **Gain attendu : de ≈ 52 Mo à moins de 1,5 Mo sur l'accueil.**
4. Retirer la publication du port 8080 et aligner `-Xmx` sur la limite mémoire du conteneur (A4, A5).
5. Ajouter une limitation de débit sur `/api/visitor/register` (S2).

---

## Annexe — Commandes de mesure utilisées

```bash
# Tailles et dimensions (depuis la racine du dépôt)
du -sh backend/uploads frontend/public/images frontend/public/amame-uploads
file frontend/public/amame-uploads/AMAME-IMAGE/* frontend/public/images/heroes/hero-homepage.png

# Fichiers suivis par Git malgré .gitignore
git ls-files backend/uploads frontend/.env backend/.env
git log --diff-filter=A --format="%h %ad %s" --date=short -- backend/uploads | tail -1

# Production (images publiques uniquement)
curl -sI https://amame.ml/images/heroes/hero-homepage.png   # Content-Length: 7314372, Server: openresty
```
