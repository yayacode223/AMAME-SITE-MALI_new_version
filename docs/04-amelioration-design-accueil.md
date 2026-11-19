# Amélioration du design : conteneurs, navbar, hero vidéo, cartes

> **Rapport d'analyse et plan d'implémentation, à valider.** Aucun fichier du code n'a été modifié : seul ce rapport a été ajouté.
> Analyse du 2026-11-19, branche `deploiement/v1.3`. En production : `frontend-v1.3`.
> Le périmètre est le frontend seul : ni backend, ni base de données, ni variable d'environnement.
> **Décisions reçues le 2026-11-19** : D1 à D9 et D4 bis tranchées ; D10 est appliquée par défaut (section 5). Le plan ci-dessous en tient compte.
> **Avancement** : itérations 1 et 2 en production (`frontend-v1.5`) ; itération 3 publiée (`frontend-v1.6` sur Docker Hub), en attente de déploiement (section 7).

---

## 0. Résumé

| Sujet | Constat mesuré | Proposition |
|---|---|---|
| Conteneurs | Les pages utilisent `container` (Tailwind configuré à **1400 px**) et le footer `max-w-7xl` (**1280 px**). À 1440 px de large, le contenu de la navbar commence à 52 px du bord, celui du footer à 112 px. 10 conteneurs sur 58 ne respectent pas la règle 16/24/32 px. | Une classe unique `.page-container` (1280 px max, padding 16/24/32 px), utilisée partout, y compris par la navbar et le footer. |
| Navbar | Les liens ne sont pas centrés : décalés de 29 à 31 px vers la gauche pour un visiteur, de 17 à 18 px pour un utilisateur connecté. Ils **bougent donc selon l'état de connexion**. | Grille à trois colonnes `1fr auto 1fr` : centrage exact dès environ 1050 px de large, et stable quel que soit l'état de connexion. |
| Vidéo fournie | 1,68 Mo, au-dessus du plafond de 1 Mo. Elle commence par un fondu depuis le noir et se termine par un fondu au noir : en boucle, cela donne un **flash noir toutes les 9 s**. | Boucle sans couture de 7,3 s en deux versions : **839 Ko** (paysage 16:9, 720p) et **475 Ko** (portrait 4:5 pour mobile). Ces deux encodages ont été testés. |
| Performance | Le LCP actuel est limité par le JavaScript et par le chargement des polices Google, pas par l'image du hero (25 Ko sur mobile). | Le poster est le LCP. La vidéo est chargée **après** l'événement `load`, seulement si les conditions le permettent : elle ne touche ni le FCP ni le LCP. |
| Message du hero | Un utilisateur connecté ne voit **aucun bouton d'action**. Les chiffres « 500+ / 200+ / 100+ » sont écrits en dur. Sur un téléphone de 360×640, les chiffres passent sous la barre de navigation du bas. | Itération dédiée au message en 3 secondes : textes, boutons, hauteur du hero sur mobile. |
| Cartes | 2 rayons d'angle, 3 comportements au survol, 6 hauteurs d'image, 3 tailles de titre, 3 couleurs de survol. Une seule carte a un focus clavier visible. | Des classes communes `.amame-card-*`, appliquées page par page. |

Le plan compte **7 itérations**, chacune déployable seule ; la 7e, sur les polices, a été ajoutée par la décision D9. Chaque itération ne touche que le frontend, publie une nouvelle étiquette d'image, et se retire en remettant l'étiquette précédente. Décisions : **10 tranchées**, D10 appliquée par défaut (section 5).

---

## 1. Méthode

Tout ce qui suit a été mesuré, pas estimé. Les fichiers de mesure sont restés hors du dépôt.

- **Lecture du code** : `Index.tsx`, `Hero.tsx`, `Navbar.tsx`, `Footer.tsx`, `PageHero.tsx`, `BottomNav.tsx`, `StaticImage.tsx`, `staticImage.ts`, `tailwind.config.ts`, `index.css`, `vite.config.ts` (PWA), `nginx.conf`, `Dockerfile`, `.dockerignore`, `scripts/optimize_images.py`, ainsi que les 26 pages et composants publics qui contiennent des conteneurs ou des cartes.
- **Mise en page** : Playwright (Chromium) sur le serveur de développement, aux largeurs 360, 390, 768, 1024, 1280, 1440 et 1920 px. L'API est simulée, ce qui permet de tester deux états : visiteur anonyme, et utilisateur connecté (réponse fictive de `/api/auth/me`). Des captures d'écran ont été prises.
- **Performance de référence** : build de production généré **hors du projet** (le `dist/` du dépôt n'a pas été touché), servi par `vite preview`. Mesures Playwright au premier passage, service worker bloqué, sur deux profils :
  - mobile : 390×844, 1,6 Mbit/s, 150 ms de latence, processeur ralenti ×4 ;
  - desktop : 1440×900, 20 Mbit/s.
- **Vidéo** : analyse avec `ffprobe` (format, images clés, position de l'atome `moov`) et mesure de la luminance image par image. Une vingtaine d'encodages d'essai ont été faits avec `ffmpeg` hors du projet. La qualité a été comparée visuellement, et les écarts poster/vidéo ont été mesurés avec Pillow.

---

## 2. État des lieux

### 2.1 Conteneurs

`tailwind.config.ts` : `container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } }`. Le `.container` occupe donc toute la largeur jusqu'à 1400 px, puis plafonne à 1400 px. Le padding de 2rem est remplacé presque partout par `px-4 sm:px-6 lg:px-8`, ce qui correspond déjà à la règle demandée (16 / 24 / 32 px).

**Occurrences** (pages publiques et composants partagés, hors admin et espace membre) :

- 48 conteneurs `container mx-auto px-4 sm:px-6 lg:px-8` : padding conforme, mais **plafond à 1400 px** ;
- 3 conteneurs `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` dans `Footer.tsx` : **plafond à 1280 px** ;
- **10 conteneurs non conformes** :
  - `px-4` seul, donc 16 px à toutes les tailles : [ArticleDetail.tsx:72](../frontend/src/pages/ArticleDetail.tsx#L72), [ArticleDetail.tsx:82](../frontend/src/pages/ArticleDetail.tsx#L82), [BoursesDetail.tsx:61](../frontend/src/pages/BoursesDetail.tsx#L61), [ConcoursDetail.tsx:67](../frontend/src/pages/ConcoursDetail.tsx#L67), [Orientation.tsx:104](../frontend/src/pages/Orientation.tsx#L104), [Orientation.tsx:109](../frontend/src/pages/Orientation.tsx#L109), [OrientationDetail.tsx:29](../frontend/src/pages/OrientationDetail.tsx#L29), [OrientationDetail.tsx:30](../frontend/src/pages/OrientationDetail.tsx#L30) ;
  - `lg:px-6`, donc 24 px au lieu de 32 sur desktop : [ForgotPassword.tsx:66](../frontend/src/pages/ForgotPassword.tsx#L66), [ResetPassword.tsx:108](../frontend/src/pages/ResetPassword.tsx#L108).

**Bord gauche du contenu, mesuré** (en px depuis le bord de la fenêtre) :

| Largeur d'écran | Navbar | Hero et sections | Footer |
|---|---|---|---|
| 390 | 16 | 16 | 16 |
| 768 | 24 | 24 | 24 |
| 1024 et 1280 | 32 | 32 | 32 |
| **1440** | **52** | **52** | **112** |
| **1920** | **292** | **292** | **352** |

Au-delà de 1400 px, le footer est donc décalé de 60 px par rapport au reste de la page. Aucun débordement horizontal n'a été constaté, à aucune largeur.

**Code mort** (inoffensif, mais trompeur) :
- [App.css](../frontend/src/App.css) : reste du modèle Vite (`#root { max-width: 1280px; padding: 2rem; text-align: center }`), importé nulle part ;
- [BoursesHero.tsx](../frontend/src/components/bourses/BoursesHero.tsx) : importé nulle part ;
- `.card-base` et `.card-hover` dans `index.css` : définies, utilisées nulle part.

### 2.2 Navbar

[Navbar.tsx](../frontend/src/components/Navbar.tsx) dispose ses trois blocs avec `flex justify-between` : logo, liens, actions. Le bloc des liens n'est centré que si le logo et les actions ont exactement la même largeur, ce qui n'est jamais le cas.

| Largeur | Écart au centre, visiteur | Écart au centre, connecté |
|---|---|---|
| 1024 | −31 px | −18 px |
| 1280 | −29 px | −18 px |
| 1440 | −31 px | −17 px |
| 1920 | −29 px | −17 px |

- Le bloc d'actions « Connexion + Adhérer » mesure 177 à 182 px ; « avatar + prénom » en mesure 153 à 157. Pendant le chargement de l'utilisateur, un squelette de 36 px s'affiche à la place : les liens se décalent donc aussi pendant le chargement.
- À 1024 px, il reste 17 à 18 px libres de part et d'autre des liens (logo jusqu'à 152 px, liens de 169 à 792 px, actions de 810 à 992 px). Un centrage exact à cette largeur n'est pas possible sans réduire l'espacement des liens.
- **Accessibilité** : les sous-menus s'ouvrent uniquement au survol de la souris (`group-hover`). Au clavier, le bouton reçoit le focus mais le sous-menu reste invisible.

### 2.3 Hero actuel ([Hero.tsx](../frontend/src/components/Hero.tsx))

- Image `heroes/hero-homepage` avec un effet Ken Burns (zoom de 1,05 à 1 sur 8 s). Le réglage système « réduire les animations » n'est respecté nulle part dans le code : il n'y a ni `MotionConfig` ni `useReducedMotion`.
- Titre « Votre Passerelle vers l'Excellence », sous-titre, et un seul bouton, « Rejoindre AMAME », affiché **uniquement aux visiteurs**. Le bouton « Explorer les bourses » est mis en commentaire ([Hero.tsx:124](../frontend/src/components/Hero.tsx#L124)). **Un utilisateur connecté ne voit donc aucun bouton d'action dans le hero.**
- Chiffres « 500+ / 200+ / 100+ » écrits en dur.
- Colonne droite (desktop) : logo et trois badges flottants. Sur mobile, les mêmes trois badges. Dans les deux cas, ce sont des `div` **non cliquables** qui ressemblent à des boutons.
- Hauteur minimale : 600 / 680 / 720 px. Sur mobile, le texte est aligné en bas du hero.
- **Mesure à 360×640** : le hero va de 64 à 664 px, alors que la barre de navigation du bas couvre l'écran à partir de 576 px. Le bouton se termine à 504 px et reste visible, mais **les chiffres passent sous la barre du bas**. Sur un vrai téléphone, la barre d'adresse du navigateur réduit encore la hauteur utile d'environ 56 px.
- L'image `heroes/hero-homepage` sert aussi de fond aux pages `Authentication.tsx` et `ForgotPassword.tsx` : **il faut la garder**.

### 2.4 Vidéo et poster fournis

**`frontend/public/static/home/hero-section/amame-hero.mp4`** (non suivi par Git) :

| Propriété | Valeur |
|---|---|
| Format | H.264 High, MP4, **sans piste audio** |
| Définition, cadence | 1920×1080, 25 images/s |
| Durée | 9,00 s (225 images) |
| Poids | **1 676 946 octets (1,68 Mo)**, au-dessus du plafond de 1 Mo |
| Débit | 1,49 Mbit/s |
| `moov` en tête (lecture progressive) | oui |
| Images clés | toutes les 2 s |

**Contenu**, mesuré par la luminance moyenne image par image :

| Moment | Contenu |
|---|---|
| 0 – 0,52 s (images 0–12) | **fondu depuis le noir** |
| 0,52 – 3,2 s | plan 1 : tuteur et élève souriant |
| 3,2 – 3,8 s | fondu enchaîné |
| 3,8 – 6,2 s | plan 2 : salle de classe, tableau « Mathématiques — Théorème de Pythagore » |
| 6,2 – 6,6 s | fondu enchaîné |
| 6,6 – 8,44 s | plan 3 : élèves souriants, cahier et bannière AMAME avec le slogan « Soutenir aujourd'hui… Bâtir demain » |
| 8,44 – 9 s (images 211–224) | **fondu au noir** |

Conséquences :
- En boucle, ces fondus produisent un flash noir toutes les 9 s.
- Au démarrage, la vidéo partirait du noir alors que le poster est déjà affiché : on verrait poster, puis noir, puis image.

**`amame-hero-poster.webp`** : 1920×1080, 134 328 octets. Il correspond à **l'image 13** de la vidéo, la première après le fondu (écart moyen de 5 sur 255 par canal).

**Risques si ces fichiers restent tels quels :**
1. `python scripts/optimize_images.py` supprime tout `.webp` de `public/static/` qui n'a pas d'original dans `image-sources/`. **Le poster serait effacé au prochain lancement du script.** De plus, le script refuse les sous-dossiers comme `home/hero-section`.
2. Dans `public/static/`, la vidéo serait interceptée par la règle `CacheFirst` du service worker (`/(amame-uploads|static)/`, dans `vite.config.ts`). Par défaut, Workbox ne met pas en cache les réponses partielles 206 qu'utilisent les vidéos. Il existe aussi un risque connu de lecture refusée sur Safari quand un service worker répond à une requête `Range`. Enfin, ce cache est limité à 60 entrées, qu'il partage avec les images.
3. Le fichier `.mp4` d'origine serait copié dans l'image Docker et servi tel quel, à 1,68 Mo.

### 2.5 Performance de référence (état actuel)

Build de production, premier passage, service worker bloqué. Deux passages par profil.

| Profil | FCP | LCP | Élément LCP | CLS | Octets transférés |
|---|---|---|---|---|---|
| Mobile (1,6 Mbit/s, 150 ms, processeur ×4) | 5,4 s / 7,9 s | 5,5 s / 8,1 s | `hero-homepage-640.webp` (24,9 Ko) | 0 | 400 Ko |
| Desktop (20 Mbit/s) | 2,0 s / 2,5 s | 2,1 s / 2,6 s | `hero-homepage-1920.webp` (100 Ko) | 0 | 553 Ko |

**Chronologie mobile** :
- JavaScript (environ 236 Ko compressés) reçu à 1,9 s ;
- feuille de polices Google demandée à 1,05 s, seulement après la feuille CSS de l'application, à cause de l'`@import` dans `index.css` ;
- images demandées à 4,4 s, après l'exécution du JavaScript ;
- fichiers de polices (88 Ko) reçus entre 5,0 et 7,3 s.

Un premier essai a donné un FCP de **26,4 s** : la connexion vers Google a été lente, et l'`@import`, qui bloque le rendu, a laissé la page blanche pendant toute cette attente.

**Conclusion.** Le FCP et le LCP arrivent presque en même temps (écart de 0,13 s). Ce n'est donc pas le média du hero qui retarde l'affichage, mais le JavaScript de l'application et la chaîne de polices. Une vidéo chargée après `load` ne change ni le FCP ni le LCP.

Ces mesures sont faites en laboratoire, en local, sans TLS ni proxy : elles servent de base de comparaison avant/après, pas de valeurs de production.

**Précache PWA** actuel : 113 entrées, 1 818 Kio. Aucune vidéo ni aucun `.webp` n'en fait partie (`globPatterns` : js, css, html, ico, png, svg, woff2).

### 2.6 Cartes

| Page ou composant | Rayon | Ombre au repos | Survol | Hauteur du média | Titre | Action | Focus clavier |
|---|---|---|---|---|---|---|---|
| Accueil, fonctionnalités | 2xl | aucune, bordure épaisse colorée | ombre + soulèvement | h-44 | text-lg | bouton plein, une couleur par domaine | non |
| Accueil, témoignages | 2xl | aucune | ombre + soulèvement | h-52 | — | — | non |
| `BourseCardItem` (3 routes) | 2xl | `shadow-card` | ombre + soulèvement | h-36 | text-sm | lien « Voir », or | non |
| `ConcoursCardItem` (3 routes) | 2xl | `shadow-card` | ombre + soulèvement | h-40 / sm:h-44 | text-base | bouton plein bleu | **oui (bleu)** |
| Orientation | 2xl | `shadow-card` | ombre + soulèvement | h-40, titre sur l'image | text-sm blanc | « Voir détail » | non |
| Universités, Partenaires | 2xl | `shadow-card` | ombre + soulèvement | h-32 (logo) | text-base | « Voir le détail » / « Visiter le site » | non |
| Membres | 2xl | `shadow-card` | ombre + soulèvement | h-52 | text-base | — | non |
| Articles | 2xl | `shadow-card` | ombre seule | h-52, puis horizontale | text-base / sm:text-lg | « Lire » | non |
| Galeries | xl | `shadow-card` | ombre seule | h-48 | text-base | — | non |
| Guide & conseils, Postes | xl | `shadow-card` | ombre seule | h-44 / h-40, puis horizontale | text-base | « Lire le guide » / « Voir l'offre » | non |
| Liens utiles, Ressources | xl | `shadow-card` | ombre + soulèvement | aucun | text-sm | « Accéder au lien » / « Télécharger » | non |
| À propos, piliers | 2xl | aucune, bordure épaisse colorée | ombre + soulèvement | — | — | — | non |

Autres écarts :
- **Couleur du titre au survol** : or (bourses), bleu (concours), vert (le reste).
- **Description** : `text-xs` (12 px) sur les bourses, concours, orientation, liens, ressources, membres et partenaires ; `text-sm` (14 px) ailleurs.
- **Espacement des grilles** : `gap-4` (universités), `gap-5` (liens, ressources, membres, partenaires), `gap-6` (galeries, accueil), `gap-5 lg:gap-6` (bourses, concours, orientation).
- **Squelettes de chargement** des bourses et concours : rayon `xl`, alors que les cartes sont en `2xl`. Les angles changent quand les données arrivent.
- **Panneaux des pages de détail** : `2xl` sur les bourses, `xl` sur les concours, l'orientation et les articles.

---

## 3. Choix proposés

### 3.1 Un conteneur unique de 1280 px

Dans `index.css`, couche `components`, à côté de `.section-white` et `.btn-primary` :

```css
.page-container {
  @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
}
```

| Écran | Padding gauche et droit | Largeur maximale |
|---|---|---|
| Mobile (< 640 px) | 16 px | toute la largeur |
| Tablette (640 à 1023 px) | 24 px | toute la largeur |
| Desktop (≥ 1024 px) | 32 px | 1280 px au total, soit 1216 px de contenu, comme le footer aujourd'hui |

**Pourquoi une classe dédiée plutôt que de modifier `theme.container`.** Dans Tailwind 3, chaque palier de padding du `container` est lié à un palier de largeur maximale (640, 768, 1024 px…). Sur une tablette de 800 px, le contenu serait limité à 640 px. La classe dédiée garde le comportement voulu : toute la largeur, puis 1280 px au maximum. La règle de padding vit ainsi à un seul endroit, et la configuration Tailwind, utilisée aussi par l'administration et l'espace membre, ne change pas.

Les largeurs plus étroites placées **à l'intérieur** du conteneur, pour le confort de lecture (`max-w-5xl mx-auto`…), restent en place : ce sont des choix de mise en page, déjà centrés.

**Décision D8 : 32 px partout sur desktop**, pour la cohérence. Un padding de 48 px, appliqué à la seule page d'accueil, aurait décalé son contenu de 16 px par rapport au logo de la navbar.

### 3.2 Navbar centrée

- Le conteneur de la navbar passe à `.page-container` (itération 1) : logo, hero et footer s'alignent sur le même bord.
- La ligne passe en grille sur desktop : `lg:grid lg:grid-cols-[1fr_auto_1fr]`, avec le logo calé à gauche (`justify-self-start`) et les actions calées à droite (`justify-self-end`). Le bloc central est alors centré **indépendamment** de la largeur des blocs latéraux. Le centrage reste stable entre visiteur et utilisateur connecté, et pendant le chargement.
- **Centrage exact** dès que chaque colonne latérale contient son bloc. Mesuré après l'itération 2 : à partir de 1060 px pour un visiteur, de 1100 px pour un utilisateur connecté au prénom long (détail en section 7).
- **Entre 1024 et 1060 px**, la grille se dégrade proprement : une colonne `1fr` ne descend jamais sous la largeur de son contenu, donc les blocs ne se chevauchent pas. L'espace entre groupes reste d'au moins 16 px (`gap-x-4`).
- Pour atteindre ce seuil, l'espacement interne des liens passe de 12 à 10 px entre 1024 et 1279 px (`px-2.5 xl:px-3`). Cet ajustement n'était pas prévu au départ ; il est inchangé à partir de 1280 px.
- **Complément d'accessibilité**, une ligne : `group-focus-within:opacity-100 group-focus-within:visible` sur les sous-menus, pour les ouvrir au clavier.

### 3.3 Hero cinématique

#### a) Fichiers et chaîne de production

| Fichier | Rôle | Emplacement | Poids mesuré |
|---|---|---|---|
| `amame-hero.mp4` (original) | source, jamais servie | `frontend/video-sources/home/`, exclu de l'image Docker (une ligne dans `.dockerignore`) | 1,68 Mo |
| `hero-16x9.mp4` | paysage 1280×720, boucle sans couture de 7,32 s | `frontend/src/assets/video/` | **838 543 octets** |
| `hero-4x5.mp4` | portrait 576×720, recadré au centre, même boucle | `frontend/src/assets/video/` | **474 804 octets** |
| `hero-poster` | première image de la boucle, en PNG, puis passage dans la chaîne d'images existante | `image-sources/home/hero-poster.png`, qui produit `public/static/home/hero-poster-{640,1280,1920}.webp` | 34 / 80 / 129 Ko (simulés avec les réglages du script) |

**Pourquoi `src/assets/` pour la vidéo :**
- Vite ajoute une empreinte au nom du fichier, qui est alors servi sous `/assets/`. La règle Nginx existante y applique déjà `Cache-Control: public, max-age=31536000, immutable`.
- Les vidéos ne sont pas précachées par la PWA (`globPatterns` ne comprend pas `mp4`).
- Aucune règle du service worker ne correspond à `/assets/` : le navigateur gère seul les requêtes `Range`.
- Résultat : **aucune modification de `nginx.conf` ni de `vite.config.ts`**.

L'autre option, garder la vidéo dans `public/static/`, est écartée : elle obligerait à ajouter une exception dans la règle Workbox et un bloc Nginx, et à versionner le nom du fichier à la main.

**Un script rejouable**, `frontend/scripts/encode_hero_video.py`, appelle `ffmpeg` sur le modèle de `optimize_images.py`, avec les réglages de l'annexe A. Les fichiers produits sont versionnés dans Git : le build Docker n'a donc pas besoin de `ffmpeg`.

**Encodages testés**, tous en H.264 High, preset `slow`, `faststart`, sans audio :

| Version | Poids | Verdict |
|---|---|---|
| 1080p, CRF 28 / 30 | 1,84 Mo / 1,54 Mo | au-dessus de 1 Mo |
| 720p, CRF 26 / 28 / 29 | 1,27 Mo / 1,02 Mo / 914 Ko | CRF 29 conforme, qualité visuellement proche de la source (comparaison zoomée) |
| 720p avec débruitage (`hqdn3d`) | −1 % | gain négligeable |
| 720p en VP9 (WebM), CRF 38 | 831 Ko (−9 %) | ne justifie pas un second format |
| 720p rognée (0,52 à 8,44 s) | 791 Ko | sans les fondus noirs, mais coupe franche en boucle (écart de 66,7 sur 255 entre la dernière et la première image) |
| **720p, boucle sans couture** (fondu enchaîné de 0,6 s) | **839 Ko** | **retenue** : écart de 7,1 sur 255 à la jonction (contre 1,8 entre deux images consécutives) |
| **Portrait 4:5, boucle sans couture** | **475 Ko** | **retenue pour le mobile** |

**Cadrage mobile vérifié** : dans le recadrage portrait (colonnes 528 à 1392 sur 1920), le visage de l'élève (plan 1), la jeune fille et le tableau (plan 2) et la jeune fille avec le cahier AMAME (plan 3) sont bien centrés. Sur un écran de 360×600, le poster 16:9 recadré au centre montre la même zone : **pas de saut d'image** quand la vidéo apparaît.

**Le poster est régénéré** à partir de la première image de la boucle. La boucle commence à 1,12 s de l'original : il faut 0,6 s d'image avant pour le fondu enchaîné, et elle reprend après le fondu depuis le noir. Le poster fourni correspond, lui, à 0,52 s : l'écart avec la première image de la boucle est de 13 sur 255. Il reste une solution de repli acceptable.

#### b) Stratégie de chargement

1. **Premier rendu** : le poster s'affiche avec `<StaticImage name="home/hero-poster" priority sizes="100vw">`. Il fournit une variante par largeur d'écran (`srcset`) et des dimensions connues : c'est l'élément LCP, et le CLS reste à 0.
2. **Après l'événement `load`**, puis dès que le navigateur est libre (`requestIdleCallback`, avec un repli à 1 s), le composant décide s'il charge la vidéo.
3. **Pas de vidéo** (le poster reste affiché) si :
   - le système demande de réduire les animations (`prefers-reduced-motion: reduce`) ;
   - le mode économie de données est activé (`navigator.connection.saveData`) ;
   - la connexion est évaluée en `slow-2g`, `2g` ou `3g` (`effectiveType`, décision D2).
   Chrome classe en `3g` ou moins toute connexion à plus de 270 ms de latence ou à moins de 700 kbit/s : sur Chrome, la vidéo ne se lance donc que sur une connexion qu'il évalue comme `4g`.
   Cette API réseau n'existe que dans les navigateurs Chromium (Chrome sur Android, notamment). Safari et Firefox chargeront donc toujours la vidéo, sauf si « réduire les animations » est activé.
4. **Version choisie** : portrait 4:5 si l'écran est en `(orientation: portrait)`, paysage 16:9 sinon. Le choix est fait une seule fois, à l'affichage.
5. **Attributs** : `muted playsInline loop preload="auto" disablePictureInPicture`, et `aria-hidden` (la vidéo est décorative, sans son, sans information propre). En JavaScript, `muted = true` est fixé avant l'appel à `play()`, car React ne pose pas l'attribut `muted` dans le HTML, ce qui peut bloquer la lecture automatique sur iOS. Si `play()` est refusé (mode économie d'énergie d'iOS, par exemple), le poster reste affiché, sans erreur.
6. **Apparition** : un fondu d'opacité de 0 à 1 sur 700 ms, déclenché par l'événement `playing`. Le poster reste dessous : jamais de flash noir.
7. **Pause automatique** quand le hero sort de l'écran (`IntersectionObserver`) ou que l'onglet est masqué (`visibilitychange`), pour épargner le processeur et la batterie.
8. **Bouton Pause / Lecture**, exigé par le critère WCAG 2.2.2 : tout contenu animé qui démarre seul et dure plus de 5 s doit pouvoir être arrêté. Cible de 44×44 px, libellé accessible qui change selon l'état. Placé en haut à droite sur mobile (le bas du hero est sous la barre de navigation) et en bas à droite sur desktop.

**Esquisse du composant** (à affiner à l'itération 3, ce n'est pas le code final) :

```tsx
import heroLandscape from "@/assets/video/hero-16x9.mp4";
import heroPortrait from "@/assets/video/hero-4x5.mp4";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

const videoAllowed = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  return !(c?.saveData || ["slow-2g", "2g", "3g"].includes(c?.effectiveType ?? ""));
};

const HeroVideo = () => {
  const [src, setSrc] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  // 1. Décision différée : après le chargement, quand le navigateur est libre
  useEffect(() => {
    const decide = () => videoAllowed() &&
      setSrc(window.matchMedia("(orientation: portrait)").matches ? heroPortrait : heroLandscape);
    // document.readyState === "complete" ? idle(decide) : addEventListener("load", …, { once: true })
  }, []);

  // 2. Lecture : muted posé en propriété avant play() (lecture automatique sur iOS)
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    v.muted = true;
    v.play().catch(() => { /* refusée : le poster reste */ });
  }, [src]);

  // 3. Pause hors écran / onglet masqué / bouton : IntersectionObserver + visibilitychange

  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        <StaticImage name="home/hero-poster" sizes="100vw" priority alt=""
                     className="w-full h-full object-cover" />
        {src && (
          <video ref={ref} src={src} muted playsInline loop preload="auto" disablePictureInPicture
                 onPlaying={() => setShown(true)}
                 className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700
                             ${shown ? "opacity-100" : "opacity-0"}`} />
        )}
      </div>
      {/* bouton Pause/Lecture, hors du bloc aria-hidden */}
    </>
  );
};
```

**Impact sur le poids, calculé à partir des mesures :**
- poster contre image actuelle : +9 Ko sur mobile (34 contre 25), +29 Ko sur desktop (129 contre 100) ;
- vidéo, **après `load`** et seulement si elle est autorisée : +475 Ko sur mobile (400 Ko → environ 875 Ko), +839 Ko sur desktop (553 Ko → environ 1,4 Mo) ;
- aux visites suivantes : 0 octet, grâce au cache d'un an.

Après `load`, la vidéo partage la bande passante avec le précache PWA existant (1,8 Mio au premier passage, voir annexe C).

#### c) Mise en page et message (itération 4)

- **Hauteur** : sur mobile, toute la hauteur visible moins la navbar et la barre du bas (`min-h: max(520px, 100svh − 8rem)`) ; sur desktop, toute la hauteur moins la navbar (`max(600px, 100svh − 4rem)`), avec un plafond d'environ 860 px. Une hauteur de repli est prévue pour les navigateurs sans `svh` (Safari < 15.4, Chrome < 108).
- **Supprimés** : l'effet Ken Burns (la vidéo apporte son propre mouvement), le logo et les badges flottants de la colonne droite. La vidéo montre déjà la bannière et le logo AMAME (plans 1 et 3), et les badges masqueraient les personnages. Sur mobile, les trois badges non cliquables font doublon avec la barre de navigation du bas.
- **Contenu, dans l'ordre de lecture** : l'accroche, le titre, une phrase et un bouton d'action.
- **Chiffres « 500+ / 200+ / 100+ » retirés** (décision D5), avec la ligne de séparation qui les précède.
- **Texte aligné à gauche** à toutes les tailles : il suit le bord du logo et de la grille, et se lit plus vite (balayage en F).
- **Voiles de lisibilité** : le dégradé gauche vers droite sur desktop et bas vers haut sur mobile est conservé, réglé pour garantir un contraste d'au moins 4,5:1 sur le sous-titre dans les trois plans.

**Texte retenu** (option A, décision D3) :

| Accroche | Titre (H1) | Phrase |
|---|---|---|
| « Soutenir aujourd'hui… Bâtir demain » (slogan déjà présent dans la vidéo) | « Bourses, concours et orientation » puis, en vert, « pour les élèves maliens » | « Les opportunités pour réussir vos études, réunies au même endroit. Gratuit et bénévole. » |

L'option B (conserver « Votre passerelle vers l'excellence ») est écartée.

**Boutons** :
- **visiteur** : « Rejoindre l'AMAME » (vers `/adhesion`), comme aujourd'hui. Le bouton « Explorer les bourses » reste retiré : ce retrait était volontaire (décision D4) ;
- **utilisateur connecté** (aujourd'hui, il ne voit aucun bouton) : on reprend la règle déjà appliquée par le menu de la navbar (décision D4 bis) :
  - rôle `USER` : « Adhérer à l'AMAME » (vers `/adhesion`) ;
  - membres et administrateurs : « Mon espace membre » (vers `/membre/dashboard`).

### 3.4 Cartes : un seul langage visuel

Les classes sont ajoutées dans `index.css`, couche `components`. Elles remplacent `.card-base` et `.card-hover`, inutilisées.

| Classe | Règle | Pourquoi |
|---|---|---|
| `.amame-card` | `bg-white rounded-2xl border border-amame-border shadow-card overflow-hidden flex flex-col h-full` | `2xl` est le rayon le plus utilisé (10 cartes sur 15) |
| `.amame-card-interactive` | survol : `shadow-card-hover` et soulèvement de 4 px ; focus clavier : anneau vert visible ; aucun mouvement si le système demande de réduire les animations | même réaction partout, accessible au clavier |
| `.amame-card-media` | photo `h-44 object-cover` ; variante `-portrait` en `h-56` (membres, témoignages) ; variante `-logo` en `h-32 object-contain p-5` (universités, partenaires) | 3 hauteurs au lieu de 6 |
| `.amame-card-body` | `p-5 flex flex-col flex-grow` | un seul padding |
| `.amame-card-title` | `font-nunito font-bold text-base leading-snug line-clamp-2 text-amame-charcoal` | une seule taille de titre |
| `.amame-card-text` | `text-sm text-amame-muted leading-relaxed line-clamp-3` | 14 px au lieu de 12 sur mobile, plus lisible |
| `.amame-card-footer` | `mt-auto px-5 py-4 border-t border-amame-border flex items-center justify-between` | informations à gauche, action « Voir … → » à droite |

- **Couleurs** : une couleur d'accent par domaine (or pour les bourses, bleu pour les concours, vert pour le reste), limitée à l'icône, au lien d'action et au titre au survol (D6).
- **Grilles** : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6` partout. Les membres gardent 4 colonnes à partir de `xl`, car les portraits sont étroits.
- **Squelettes** : mêmes rayons et mêmes hauteurs de média que les cartes, pour qu'aucun angle ni aucune hauteur ne change à l'arrivée des données.
- **Classes CSS plutôt qu'un composant React** : le changement reste minimal, s'adapte aux deux enveloppes existantes (`<Link>` et `<div>`), et suit le modèle déjà en place dans `index.css`. Un composant `<AmameCard>` pourra venir plus tard si le besoin se confirme.

---

## 4. Plan par itérations

### Commun à toutes les itérations

- **Vérifications locales** : `npm run lint`, `npx tsc --noEmit`, `npm run build`, puis le script de mesure Playwright (bords, centrage, débordement, captures) aux 7 largeurs, en visiteur et en connecté.
- **Livraison** : construire l'image frontend avec l'étiquette suivante (`frontend-v1.4`, puis `v1.5`…), la pousser sur Docker Hub, et mettre à jour l'étiquette par défaut dans `docker-compose.yml` et dans `deploy/portainer/amamestack.env.example`. En production : modifier `FRONTEND_IMAGE_TAG` dans la stack Portainer `amamestack`.
- **Retour arrière** : remettre l'étiquette précédente. Aucune itération ne touche au backend, à la base de données, aux variables d'environnement ni aux volumes. La PWA se met à jour seule (`autoUpdate`) à la visite suivante.
- **Suivi** : ce document est mis à jour après chaque itération (section 7).

### Itération 1 : conteneur unique de 1280 px

- **Fichiers** :
  - `index.css` : ajout de `.page-container` ;
  - `Navbar.tsx` (1 conteneur), `Footer.tsx` (3), `Hero.tsx` (1), `PageHero.tsx` (2), `BoursesList.tsx`, `ConcoursListing.tsx` ;
  - les pages publiques concernées (26 fichiers en tout) : remplacement mécanique de `container mx-auto px-4 sm:px-6 lg:px-8` par `page-container`, en gardant les classes supplémentaires ;
  - correction des 10 conteneurs non conformes.
  - En option : suppression de `App.css` et de `BoursesHero.tsx` (code mort).
- **Effet visible** : à partir de 1280 px de large, le contenu passe de 1336 px au plus à 1216 px (une carte sur trois colonnes perd environ 40 px). Navbar, hero, sections et footer partagent le même bord.
- **Critères d'acceptation** :
  - bord gauche du contenu identique pour la navbar, le hero, les sections et le footer : 16, 24, 32, 32, 112 et 352 px aux largeurs 390, 768, 1024, 1280, 1440 et 1920 ;
  - aucun débordement horizontal à 320 px ;
  - les 20 routes publiques vérifiées sur captures.
- **Risque** : faible (classes CSS uniquement, configuration Tailwind inchangée).

### Itération 2 : navbar centrée

- **Fichier** : `Navbar.tsx` uniquement.
- **Critères d'acceptation** :
  - écart au centre ≤ 1 px à partir de 1060 px, pour un visiteur comme pour un utilisateur connecté, et pendant le chargement ;
  - aucun chevauchement à 1024 px, y compris avec un prénom long (déjà tronqué à 100 px) ;
  - sous-menus accessibles à la touche Tab.
- **Risque** : faible.

### Itération 3 : hero vidéo (couche visuelle, textes inchangés)

- **Fichiers** :
  - original déplacé vers `video-sources/home/`, et `video-sources/` ajouté à `.dockerignore` ;
  - nouveau script `scripts/encode_hero_video.py`, qui produit les deux vidéos de `src/assets/video/` et le poster `image-sources/home/hero-poster.png`, puis lancement de `optimize_images.py` (nouvelle entrée `home/hero-poster` dans le manifeste) ;
  - nouveau composant `HeroVideo.tsx` (poster, vidéo, bouton Pause) ;
  - dans `Hero.tsx` : remplacement de la couche image et de l'effet Ken Burns, suppression de la colonne droite (logo et badges flottants) ;
  - suppression de `public/static/home/hero-section/` (fichiers non suivis par Git, déplacés) ;
  - `CLAUDE.md` : ajout d'un paragraphe « vidéos statiques » à côté de « Static images ».
- **Critères d'acceptation** :
  - chaque vidéo pèse moins de 1 Mo (839 et 475 Ko) ;
  - l'élément LCP est le poster ; FCP et LCP restent à ±10 % de la base (médiane de 3 passages, même script) ; CLS = 0 ;
  - aucune requête vidéo avant `load` ; aucune requête vidéo avec « réduire les animations » activé, ni en 2G ou 3G simulée, ni en économie de données (outils de développement de Chrome) ;
  - lecture en boucle sans flash noir à la jonction (décision D1) ;
  - lecture vérifiée sur Chromium, WebKit (moteur de Safari) et Firefox, et si possible sur un vrai téléphone Android et un iPhone : boucle sans flash noir, bouton utilisable au clavier (Entrée, Espace) et au doigt ;
  - vidéo en pause quand le hero sort de l'écran ;
  - PWA hors ligne : poster affiché, aucune erreur dans la console ;
  - liste de précache inchangée (aucun `.mp4`).
- **Risque** : moyen (nouveau composant). Aucune dépendance ajoutée.

### Itération 4 : hero, un message compris en 3 secondes

Décisions prises : texte A (D3), chiffres retirés (D5), « Explorer les bourses » laissé de côté (D4), bouton des utilisateurs connectés selon la règle de la navbar (D4 bis).

- **Fichier** : `Hero.tsx` (accroche, titre, phrase, bouton selon l'état de connexion, retrait des chiffres et des badges mobiles, hauteur, alignement, voiles).
- **Critères d'acceptation** :
  - à 360×560 (un téléphone de 360×640 avec sa barre d'adresse), l'accroche, le titre, la phrase et le bouton sont entièrement visibles au-dessus de la barre de navigation du bas, sans défiler ;
  - plus aucun chiffre dans le hero ;
  - un bouton d'action est présent pour les visiteurs et pour les utilisateurs connectés (« Adhérer à l'AMAME » pour le rôle `USER`, « Mon espace membre » pour les membres et les administrateurs) ;
  - contraste du sous-titre ≥ 4,5:1 sur les trois plans (mesuré sur des captures à 1, 4 et 7 s) ;
  - test des 5 secondes avec 5 élèves ou étudiants (montrer le hero 5 s, puis demander « Que propose ce site ? Est-ce payant ? ») : au moins 4 bonnes réponses sur 5.
- **Risque** : faible (textes et classes).

### Itération 5 : cartes, partie 1 (socle et cartes de listes)

- **Fichiers** : `index.css` (classes `.amame-card-*`, retrait de `.card-base` et `.card-hover`), `BourseCardItem.tsx` et `ConcoursCardItem.tsx` (utilisés par 6 routes), `Orientation.tsx`, `Universites.tsx`, `Partenaires.tsx`, `Membres.tsx`, ainsi que leurs squelettes de chargement.
- **Critères d'acceptation** :
  - même rayon, même bordure, même ombre, même survol et même focus sur ces pages ;
  - focus clavier visible sur chaque carte cliquable ;
  - squelettes aux mêmes dimensions que les cartes (CLS = 0 sur les listes) ;
  - captures avant/après de chaque page.

### Itération 6 : cartes, partie 2 (contenus, accueil, À propos, détails)

- **Fichiers** : `Articles.tsx`, `Galeries.tsx`, `GuideConseils.tsx`, `Postes.tsx`, `LiensUtiles.tsx`, `RessourcesAcademiques.tsx`, `Index.tsx` (fonctionnalités et témoignages), `About.tsx`, et les panneaux des pages de détail (rayon uniquement).
- **Critères d'acceptation** : les mêmes que pour l'itération 5. En plus, une recherche dans le code ne trouve plus de carte construite en dehors des classes `.amame-card-*` dans les pages publiques.

### Itération 7 : polices servies par le site (validée, D9, après l'itération 4)

**Constat.** L'`@import` Google Fonts placé dans `index.css` bloque le rendu. Il enchaîne trois étapes, chacune attendant la précédente : la feuille CSS de l'application, puis la feuille de Google (`fonts.googleapis.com`), puis les fichiers de polices (`fonts.gstatic.com`). Ce sont deux domaines de plus à joindre avant que le texte s'affiche. Lors d'un des essais, la page est restée blanche 26 s, le temps que Google réponde.

**Polices réellement utilisées** (recherche dans le code) :
- **Nunito** pour les titres (160 usages de `font-nunito`) et **Inter** pour le texte (règle `body` de `index.css`) ;
- graisses 400 (`font-normal`), 500 (`font-medium`), 600 (`font-semibold`), 700 (`font-bold`) et 900 (`font-black`) ;
- la requête Google demande aussi Inter 300 et Nunito 800, **utilisées nulle part** ;
- `roboto` est déclarée dans `tailwind.config.ts`, **utilisée nulle part** ;
- 7 textes en italique : aucune police italique n'est chargée aujourd'hui, le navigateur fabrique l'italique, et ce comportement est conservé.

Google sert déjà ces polices en version variable : un seul fichier par police couvre toutes les graisses (mesuré : Inter 48,8 Ko et Nunito 39,3 Ko pour l'alphabet latin).

**Proposition.**
- Placer dans `src/assets/fonts/` les fichiers variables `woff2` de Nunito et d'Inter, en deux jeux de caractères chacun :
  - `latin`, qui couvre le français ;
  - `latin-ext`, qui couvre notamment les lettres bambara ɛ, ɔ, ɲ et ŋ, possibles dans les contenus.
  Chaque fichier est déclaré par un `@font-face` avec sa plage `unicode-range` et `font-display: swap` : le navigateur ne télécharge `latin-ext` que si la page contient un de ces caractères.
- Vite ajoute une empreinte au nom de chaque fichier, et la règle Nginx existante sur les polices leur applique déjà un cache d'un an.
- Les polices sont sous licence SIL OFL, qui autorise la redistribution : le fichier `OFL.txt` est joint aux polices.
- Pas de nouvelle dépendance npm. Fontsource est une autre possibilité, mais elle copierait dans le build tous les jeux de caractères (cyrillique, grec, vietnamien…), que la PWA précacherait (`globPatterns` comprend `woff2`).

**Fichiers.**
- `index.css` : remplacement de l'`@import` par 4 `@font-face` ;
- `src/assets/fonts/` : 4 fichiers `woff2` et `OFL.txt` ;
- `index.html` : retrait des deux `preconnect` vers Google ;
- `tailwind.config.ts` : retrait de `roboto` (optionnel).

**Critères d'acceptation.**
- Plus aucune requête vers `fonts.googleapis.com` ni `fonts.gstatic.com` (journal réseau de Playwright).
- La page s'affiche normalement même si ces deux domaines sont bloqués.
- FCP mobile (médiane de 3 passages, même script) meilleur que la mesure faite juste avant l'itération.
- Rendu typographique identique sur captures à 390, 1024 et 1440 px (mêmes polices, mêmes graisses). Les accents français et les lettres ɛ, ɔ, ɲ, ŋ s'affichent dans la bonne police.
- Liste de précache : seuls les fichiers `woff2` ajoutés s'y trouvent en plus.

**Risque** : faible. Retour arrière par étiquette.

---

## 5. Décisions à valider

| # | Question | Décision (2026-11-19) |
|---|---|---|
| D1 | Vidéo : boucle sans couture, ou lecture unique qui s'arrête sur le dernier plan ? | **Boucle sans couture**, avec bouton Pause |
| D2 | Faut-il désactiver la vidéo aussi en 3G, en plus de l'économie de données et de la 2G ? | **Oui** : pas de vidéo en économie de données, `slow-2g`, `2g` ni `3g` |
| D3 | Texte du hero : proposition A, B, ou un autre texte ? | **A** |
| D4 | Le bouton « Explorer les bourses », en commentaire dans [Hero.tsx:124](../frontend/src/components/Hero.tsx#L124), a-t-il été retiré volontairement ? | **Oui, retiré volontairement** : il n'est pas remis |
| D5 | Les chiffres « 500+ / 200+ / 100+ » sont-ils vérifiés et à jour ? | **Retirés** du hero |
| D6 | Cartes : garder les couleurs par domaine (or, bleu, vert) en accent ? | **Oui** |
| D7 | Périmètre des cartes | **Pages publiques** pour le moment |
| D8 | Padding desktop : 32 px partout, ou 48 px ? | **32 px partout**, pour la cohérence |
| D9 | Planifier l'itération 7 (polices) ? | **Oui, après l'itération 4** |
| D4 bis | Bouton du hero pour un utilisateur connecté (aujourd'hui, il n'en voit aucun) | **Reprendre la règle du menu de la navbar** : rôle `USER`, « Adhérer à l'AMAME » ; membres et administrateurs, « Mon espace membre » |

**Appliquée par défaut, sauf avis contraire :**

| # | Question | Recommandation |
|---|---|---|
| D10 | Étiquettes d'image : `frontend-v1.4`, `v1.5`… à chaque itération ? | Oui |

---

## 6. Annexes

### A. Commandes ffmpeg testées (celles du futur script)

```bash
# Paysage 16:9, 1280×720 : on garde 0,52 → 8,44 s (sans les fondus noirs), puis les 0,6 dernières
# secondes se fondent dans les 0,6 premières, ce qui donne une boucle sans couture de 7,32 s
ffmpeg -ss 0.52 -to 8.44 -i amame-hero.mp4 -filter_complex \
  "[0:v]split[a][b];[a]trim=start=0.6,setpts=PTS-STARTPTS[main];[b]trim=end=0.6,setpts=PTS-STARTPTS[head];\
   [main][head]xfade=transition=fade:duration=0.6:offset=6.72,scale=1280:720[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 29 -profile:v high -pix_fmt yuv420p -g 50 \
  -movflags +faststart hero-16x9.mp4                                   # 838 543 octets

# Portrait 4:5, 576×720 : même boucle, recadrage centré (colonnes 528 à 1392 de l'original)
#   … identique, avec « crop=864:1080:528:0,scale=576:720 » à la place de « scale=1280:720 », et -crf 27
#                                                                      # 474 804 octets

# Poster : l'image de l'original 1080p où commence la boucle (0,52 + 0,6 = 1,12 s), en PNG
# (sans perte), puis passage dans optimize_images.py → hero-poster-{640,1280,1920}.webp
ffmpeg -ss 1.12 -i amame-hero.mp4 -frames:v 1 image-sources/home/hero-poster.png
```

### B. Mesures brutes de la navbar et des conteneurs

Bord gauche du conteneur, largeur et padding ; liens : bord gauche, largeur et écart au centre.

| Largeur | État | Navbar | Liens | Footer |
|---|---|---|---|---|
| 1024×768 | visiteur | 0, 1024, 32 px | 169, 623, −31 | 0, 1024 |
| 1024×768 | connecté | 0, 1024, 32 px | 182, 623, −18 | 0, 1024 |
| 1280×800 | visiteur | 0, 1280, 32 px | 314, 594, −29 | 0, 1280 |
| 1440×900 | visiteur | 20, 1400, 32 px | 377, 623, −31 | 80, 1280 |
| 1440×900 | connecté | 20, 1400, 32 px | 406, 594, −17 | 80, 1280 |
| 1920×1080 | visiteur | 260, 1400, 32 px | 634, 594, −29 | 320, 1280 |
| 1920×1080 | connecté | 260, 1400, 32 px | 646, 594, −17 | 320, 1280 |

La largeur du bloc de liens varie entre 594 et 623 px selon que les polices sont chargées ou non au moment de la mesure.

### C. Constats hors périmètre (pour information, non traités)

- **Précache PWA de 1,8 Mio au premier passage** (113 entrées). On y trouve tous les morceaux de JavaScript, y compris ceux de l'administration, et `web-app-manifest-512x512.png` (378 Ko). C'est un coût en données mobiles plus élevé que celui de la vidéo.
- **En-têtes Nginx** : les blocs `location /assets/`, `/images/` et les polices déclarent leur propre `add_header Cache-Control`. Nginx n'hérite alors plus des `add_header` du niveau `server` : les fichiers JS et CSS sont servis sans `X-Content-Type-Options` ni les autres en-têtes de sécurité. L'impact est faible, mais ce point est à traiter à part.
- **`npm run lint` ne fonctionne pas** : ESLint 9.38 plante au chargement de la règle `@typescript-eslint/no-unused-expressions` (« Cannot read properties of undefined (reading 'allowShortCircuit') »), avant même d'analyser un fichier. Constaté avant toute modification ; le lint ne peut donc pas servir de contrôle tant que les versions d'ESLint et de typescript-eslint ne sont pas réaccordées.
- **4 erreurs TypeScript déjà présentes** (`npx tsc --noEmit -p tsconfig.app.json`), dans des fichiers hors du périmètre : `LayoutMembre.tsx:164` (`pathname` absent de `NavItem`), et `LienUtileForm.tsx:23`, `MembreForm.tsx:29`, `PartenaireForm.tsx:20` (`find` appelé sur un `PageResponse`). Le build Vite ne vérifie pas les types : il passe malgré tout. Contrôle retenu pour chaque itération : ces 4 erreurs, ni plus ni moins.

---

## 7. Suivi de l'implémentation

| Itération | État | Étiquette | Date | Remarques |
|---|---|---|---|---|
| 1. Conteneur 1280 px | **en production** | `frontend-v1.4` | 2026-11-19 | commit `fcff420` ; voir le détail ci-dessous |
| 2. Navbar centrée | **en production** | `frontend-v1.5` | 2026-11-19 | commit `efb76f8` ; voir le détail ci-dessous |
| 3. Hero vidéo | **image publiée** ; en attente de déploiement | `frontend-v1.6` | 2026-11-19 | commit `d803a7d` ; boucle (D1) ; pas de vidéo en économie de données, 2G ni 3G (D2) ; voir le détail ci-dessous |
| 4. Message du hero | prête à démarrer | — | — | texte A (D3) ; « Explorer les bourses » non remis (D4) ; chiffres retirés (D5) ; bouton des connectés selon la navbar (D4 bis) |
| 5. Cartes, partie 1 | prête à démarrer | — | — | couleurs par domaine (D6) ; pages publiques (D7) |
| 6. Cartes, partie 2 | prête à démarrer | — | — | — |
| 7. Polices servies par le site | validée, après l'itération 4 | — | — | D9 |

### Itération 1 : détail (2026-11-19)

**Modifications** (28 fichiers, aucune dépendance, aucune modification de la configuration Tailwind) :
- `src/index.css` : nouvelle classe `.page-container` (`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`) ;
- 61 conteneurs remplacés par `page-container`, les autres classes de chaque ligne étant conservées :
  - 48 `container mx-auto px-4 sm:px-6 lg:px-8` ;
  - 3 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` du footer ;
  - les 10 conteneurs non conformes (8 en `px-4` seul, 2 en `lg:px-6`) ;
- fichiers concernés : `Navbar`, `Footer`, `Hero`, `PageHero`, `BoursesList`, `ConcoursListing`, et 21 pages publiques ;
- `CLAUDE.md` : la règle du conteneur de page est documentée (section Frontend).

**Laissé tel quel** : l'administration et l'espace membre (`DashboardMembre.tsx` garde `container`), les composants `ui/`, le code mort `App.css` et `BoursesHero.tsx`.

**Vérifications** :

| Contrôle | Résultat |
|---|---|
| Bords du contenu, 26 routes publiques × 7 largeurs (Playwright, visiteur, API simulée) | **avant** : à 1440 et 1920 px, deux bords par page (52 et 112 px ; 292 et 352 px) ; détails d'article et de filière à 16 px de 768 à 1280 px ; `/forgot-password` à 24 px sur desktop. **Après** : un seul bord par largeur sur les 24 routes qui ont un conteneur : 16 / 16 / 24 / 32 / 32 / 112 / 352 px de 320 à 1920 px (`/login` et `/reset-password` n'en ont pas) |
| Colonnes volontairement étroites (`/adhesion`) | identiques avant et après |
| Débordement horizontal (320 à 1920 px) | aucun, avant comme après |
| Captures avant/après à 1440 px (accueil, bourses) | navbar, hero, sections et footer alignés sur 112 px ; footer inchangé |
| `npx tsc --noEmit -p tsconfig.app.json` | les 4 erreurs déjà présentes, aucune nouvelle (annexe C) |
| `npm run lint` | inutilisable, plantage déjà présent avant l'itération (annexe C) |
| `vite build` (production) | réussi ; CSS généré : `max-width: 80rem`, padding 1rem, puis 1,5rem dès 640 px, puis 2rem dès 1024 px ; précache inchangé (113 entrées) |

**Effet visible** : à partir de 1280 px de large, la colonne de contenu passe de 1336 px au plus à 1216 px, et tout s'aligne sur le footer.

**Livraison** :
1. Fait : étiquette par défaut passée à `frontend-v1.4` dans `docker-compose.yml` et dans le tableau de `CLAUDE.md`, dans le même commit que le code.
2. Fait : image `frontend-v1.4` construite depuis `fcff420`, dans un `git worktree` propre (`docker build -t yayacode224/amame:frontend-v1.4 <worktree>/frontend`), worktree supprimé ensuite. Seuls les fichiers commités entrent dans l'image, pas le dossier non suivi `public/static/home/hero-section/`.
   - Image `1f358b9f9263`, 109 Mo (comme `frontend-v1.3`) ; build Vite réussi, précache de 113 entrées.
   - Vérifiée dans un conteneur de test (`amame-it1-front`, supprimé ensuite) : `40-runtime-config.sh` s'exécute (`/uploads/` servi depuis le disque) ; `/`, `/bourses`, `/config.js` et une image statique répondent `200` avec le bon type ; aucun `hero-section` dans `static/home/` ; 3 règles `.page-container` dans le CSS livré ; bords du contenu à 16 px (390 px) et 112 px (1440 px) sur `/`, `/bourses`, `/a-propos` et `/orientation/1`.
3. Fait : `docker push yayacode224/amame:frontend-v1.4`. L'empreinte sur Docker Hub est identique à celle de l'image vérifiée (`sha256:1f358b9f9263f72afa2a7321ba8afca80b6003b9594fcfca86dc7f16f61239ed`), plateforme `linux/amd64`. Commits publiés sur `main` (avance rapide).
4. Fait le 2026-11-19 : `FRONTEND_IMAGE_TAG=frontend-v1.4` dans la stack Portainer `amamestack`.
   Contrôle en production (lecture seule, appels `/api/` bloqués pour ne pas réveiller la base) :
   - le CSS servi est `index-D4EtrIhM.css`, le même que celui du build de `fcff420`, avec les 3 règles `.page-container` ;
   - sur `/`, `/bourses` et `/a-propos`, un seul bord de contenu par largeur : 16 / 32 / 112 / 352 px à 390 / 1024 / 1440 / 1920 px.
5. Fait : `deploy/portainer/amamestack.env.example` mis à `frontend-v1.4`.

Retour arrière : `frontend-v1.3`.

### Itération 2 : détail (2026-11-19)

**Modifications** (`Navbar.tsx` uniquement, 1 fichier) :
- **disposition desktop** : la ligne passe en grille `lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-4`. Le logo est calé à gauche (`lg:justify-self-start`), ce qui garde sa zone cliquable à 120 px au lieu de toute la colonne ; les actions sont calées à droite (`lg:justify-self-end`) ;
- **espacement des liens** : `px-2.5 xl:px-3` au lieu de `px-3`, soit 10 px entre 1024 et 1279 px, puis 12 px comme avant ;
- **clavier** : les sous-menus s'ouvrent quand le bouton ou l'un de leurs liens a le focus clavier (`group-has-[:focus-visible]:visible`, `opacity-100`, et la flèche pivote). Un clic de souris ne les garde pas ouverts : seul `:focus-visible` compte. Dans les navigateurs sans `:has()` (Firefox < 121, Safari < 15.4), le comportement reste celui d'avant ;
- **mobile et tablette** (< 1024 px) : inchangés, toujours en `flex`.

**Écart du bloc de liens au centre de la page** (en px ; mesuré après chargement des polices ; prénom de test « Mohamed-Lamine », tronqué à 100 px) :

| Largeur | Visiteur, avant → après | Connecté, avant → après | Chargement, avant → après |
|---|---|---|---|
| 1024 | −31,2 → −17,8 | −33 → −21,4 | +42 → 0 |
| 1060 | −31,2 → **0** | −33 → −3,4 | +42 → **0** |
| 1100 | −31,2 → **0** | −33 → **0** | +42 → **0** |
| 1280, 1440, 1920 | −31,2 → **0** | −33 → **0** | +42 → **0** |

**Conséquences :**
- **Déplacement des liens** quand l'état de l'utilisateur se résout (fin du chargement) : il était de 73 px à toutes les largeurs. Il est maintenant de 0 px à partir de 1100 px, et de 18 à 21 px au plus à 1024 px.
- **Critère « ≤ 1 px à partir de 1060 px »** : atteint pour un visiteur et pendant le chargement. Pour un utilisateur connecté au prénom long, il n'est atteint qu'à partir de 1100 px (−3,4 px à 1060).

**Vérifications :**

| Contrôle | Résultat |
|---|---|
| Chevauchement, de 1024 à 1920 px, dans les 3 états | aucun : au moins 16 px entre le logo, les liens et les actions |
| Zone cliquable du logo | 120 px, comme avant |
| Clavier, à 1440 px (2 passages) | **avant** : Tab atteint « À Propos », mais le sous-menu reste fermé et le Tab suivant saute à « Actualités ». **Après** : le sous-menu s'ouvre, et le Tab suivant entre dans le sous-menu (lien « À Propos ») |
| Souris | survol : ouvre ; clic puis sortie du pointeur : referme ; jamais deux sous-menus ouverts à la fois. Comme avant |
| Mobile et tablette (320, 390, 768, 1023 px), visiteur et connecté | ligne en `flex`, logo au bord gauche (16 ou 24 px), avatar au bord droit, hauteur 64 px, aucun débordement |
| Captures avant/après à 1024 et 1440 px | liens centrés sur l'axe de la page, aucun chevauchement |
| `npx tsc --noEmit -p tsconfig.app.json` | les 4 erreurs connues, aucune dans `Navbar.tsx` |
| `vite build` (production) | réussi ; règles `.group:has(:focus-visible)` et grille `1fr auto 1fr` présentes dans le CSS ; précache de 113 entrées |

**Constat en cours de test** : un passage du test clavier a échoué une fois, juste après une modification du fichier. Le rechargement à chaud de Vite était en cours. Deux passages complets ensuite, sans modification entre les deux, ont réussi.

**Pas traité** :
- la touche Échap ne referme pas un sous-menu ouvert au clavier (Tab hors du sous-menu le referme) ;
- les boutons n'ont pas d'attribut `aria-expanded`, qui demanderait un état React.

Ces deux points sont à prévoir si l'accessibilité devient un objectif à part entière.

**Livraison** :
1. Fait : étiquette par défaut passée à `frontend-v1.5` dans `docker-compose.yml` et dans le tableau de `CLAUDE.md`, dans le commit du code (`efb76f8`).
2. Fait : image `frontend-v1.5` construite depuis `efb76f8` dans un `git worktree` propre, supprimé ensuite. Image `e7d4decbd81d`, 109 Mo ; précache de 113 entrées.
   - Vérifiée dans un conteneur de test (`amame-it2-front`, supprimé ensuite) : `40-runtime-config.sh` s'exécute ; `/`, `/bourses`, `/config.js` et une image statique répondent `200` ; aucun `hero-section` dans l'image ; bords du contenu à 16 et 112 px.
   - Le test de la navbar donne, sur l'image, exactement les mesures du développement : écarts au centre, clavier, souris.
3. Fait : `docker push yayacode224/amame:frontend-v1.5`. L'empreinte sur Docker Hub est identique à celle de l'image vérifiée (`sha256:e7d4decbd81d64577e75d685604f0998ed5fcb22faa56684a048291c9d454191`), plateforme `linux/amd64`. Commits publiés sur `main` (avance rapide).
4. Fait le 2026-11-19 : `FRONTEND_IMAGE_TAG=frontend-v1.5` dans la stack Portainer `amamestack`.
   Contrôle en production (lecture seule, appels `/api/` interceptés par le navigateur de test) :
   - le CSS servi est `index-CNjqxaDG.css`, le même que celui du build de `efb76f8` ;
   - écart du bloc de liens au centre de la page : 0 px à 1100, 1440 et 1920 px (grille active) ;
   - au clavier, depuis le logo, deux Tab : le focus est sur « À Propos » (`:focus-visible`) et le sous-menu devient visible ; le Tab suivant entre dans le sous-menu.
   - **Constat** : lu juste après le Tab, le sous-menu est encore `hidden` (9 essais sur 10), parce que sa transition de 150 ms porte aussi sur `visibility` et vient de démarrer. Deux images plus tard (environ 33 ms), il est `visible` dans 10 essais sur 10. C'est un artefact de mesure, pas un défaut : un humain qui tape Tab de nouveau trouve toujours le sous-menu ouvert. Les tests suivants attendent deux images avant de lire l'état.
5. Fait : `deploy/portainer/amamestack.env.example` mis à `frontend-v1.5`.

Retour arrière : `frontend-v1.4`.

### Itération 3 : détail (2026-11-19)

**Modifications :**
- `video-sources/home/amame-hero.mp4` : l'original de 1,68 Mo, déplacé depuis `public/static/home/hero-section/`. Le poster fourni l'accompagne sous le nom `amame-hero-poster-fourni.webp`, conservé pour référence mais pas servi. `video-sources/` est ajouté à `.dockerignore`.
- `scripts/encode_hero_video.py` (nouveau) : réglages de l'annexe A, contrôle de la définition de l'original, échec si une vidéo atteint 1 Mo.
- `src/assets/video/hero-16x9.mp4` (838 543 octets) et `hero-4x5.mp4` (474 804 octets).
- `image-sources/home/hero-poster.png`, que `optimize_images.py` transforme en `public/static/home/hero-poster-{640,1280,1920}.webp` (33 956, 80 096 et 128 092 octets), plus une entrée dans le manifeste. Le script a laissé identiques, à l'octet près, les 70 autres WebP et le logo.
- `src/components/HeroVideo.tsx` (nouveau) : poster, vidéo et bouton Pause/Lecture.
- `src/components/Hero.tsx` :
  - l'image et l'effet Ken Burns sont remplacés par `<HeroVideo />` ;
  - la colonne droite est retirée (logo, badges flottants, points animés) ;
  - les badges mobiles restent jusqu'à l'itération 4.
- `CLAUDE.md` : paragraphe « Home hero video ».

**Ajouts par rapport au plan (section 3.3) :**
- la vidéo attend aussi le chargement du poster, pour ne pas lui disputer la bande passante lors d'une navigation interne vers l'accueil ;
- pas de vidéo hors ligne (`navigator.onLine`) ;
- `disableRemotePlayback` masque le bouton « Caster » que Chrome Android superpose aux vidéos ;
- `disablePictureInPicture` est posé par propriété, car les types React installés ne connaissent pas cet attribut.

**Vérifications des fichiers :**

| Contrôle | Résultat |
|---|---|
| Poids des vidéos | 838 543 et 474 804 octets, sous 1 Mo |
| Poster et première image de la vidéo | écart moyen de 3,0 sur 255 (bruit de compression seulement) |
| Jonction de boucle (dernière image vers première) | écart de 6,9, contre 2,5 entre deux images consécutives et 66,7 en coupe franche |
| Build de production | vidéos servies sous `/assets/` avec empreinte (`hero-16x9-Byha7RNK.mp4`, `hero-4x5-B3l9Ikdx.mp4`) ; `sw.js` ne mentionne aucun `.mp4` ; précache de 113 entrées, inchangé ; plus de `hero-section/` |
| `npx tsc --noEmit -p tsconfig.app.json` | les 4 erreurs connues, aucune dans `Hero.tsx` ni `HeroVideo.tsx` |

**Comportement** (script Playwright, build de production servi par `vite preview`, API simulée ; lecture H.264 dans Chrome) :

| Scénario | Résultat |
|---|---|
| Desktop 1440 px | version 16:9, demandée à 4 084 ms, après la fin de `load` (2 199 ms) ; muette, en boucle, sans PiP ni Cast, opacité 1 ; élément LCP : `hero-poster-1920.webp` |
| Bouton à la souris | pause, puis lecture ; le libellé passe de « Mettre la vidéo en pause » à « Lire la vidéo » |
| Bouton au clavier | Entrée met en pause, Espace relance |
| Hero hors écran ou onglet masqué | pause ; reprise au retour |
| Jonction de boucle, dans Chrome | sur 5 passages par 0 s, les 12 échantillons pris à ±1 s de la jonction ont une luminance de 135 à 146 : aucune chute. Une première version du test signalait une baisse à 63 : c'est le plan du tableau noir (75,6 dans le fichier lui-même à 3,24 s), pas un flash |
| Mobile 390 px, écran 3x | version 4:5, poster 1280 ; bouton en haut à droite, aligné à 16 px du bord ; le toucher met en pause |
| Réduction des animations, Save-Data, `slow-2g`, `2g`, `3g`, hors ligne | aucune requête vidéo, poster affiché, aucune erreur |
| Connexion `4g` | vidéo demandée et lue |
| Chromium de Playwright, sans H.264 | erreur média 4 : poster gardé, pas de bouton, aucune erreur JavaScript (chemin d'échec, comme une lecture refusée) |
| WebKit et Firefox (versions Playwright pour Windows) | vidéo lue, bouton présent, aucune erreur |
| PWA hors ligne (deux visites en ligne, puis rechargement hors ligne) | page et poster affichés depuis le cache, aucune requête vidéo, aucune erreur JavaScript |
| Erreurs JavaScript (tous scénarios) | aucune |

**Performance** (profil identique à la base : Chromium de Playwright, premier passage) :

| Mesure | Mobile (1,6 Mbit/s, 150 ms, processeur x4) | Desktop (20 Mbit/s) |
|---|---|---|
| Base, 5 passages (build de `efb76f8`) | LCP 5,81 s ; FCP 5,65 s | LCP 2,17 s ; FCP 2,06 s |
| Après, 5 passages, 30 min plus tard | LCP 7,24 s ; FCP 6,55 s | LCP 1,48 s ; FCP 1,44 s |
| **A/B alterné** (avant et après servis côte à côte, mesurés tour à tour) | 8 paires : FCP −11,8 %, LCP −13,2 % | 6 paires : FCP +3,8 %, LCP +5,1 % |
| CLS | 0 | 0 |

- **Lecture des chiffres** : les passages séparés varient trop (mobile de 5,4 à 8,6 s) pour conclure. L'A/B alterné donne des écarts dans la marge de ±10 %, ou en faveur de la nouvelle version : aucune dégradation mesurable. Le changement n'ajoute que 9 Ko au poster mobile (34 Ko contre 25) et 29 Ko sur desktop (129 contre 100).
- **Octets de la vidéo**, mesurés dans Chrome, après `load` :
  - mobile : 475 146 octets (page : 904 Ko au lieu d'environ 410) ;
  - desktop : 838 885 octets (page : 1,44 Mo au lieu de 0,58).
  Les visites suivantes ne la retéléchargent pas : `/assets/` est en cache un an.
- **Constat** : sous le bridage réseau simulé, Chrome annonce toujours `4g`. `effectiveType` vient de mesures du réseau réel, pas de l'émulation. La règle 2G/3G a donc été testée en forçant la valeur.

**Non vérifié** : appareils réels (iPhone avec Safari, Android avec Chrome) et mode économie d'énergie d'iOS. Le chemin « lecture refusée » est couvert par le scénario Chromium sans H.264, mais pas sur iOS lui-même. À contrôler sur un téléphone après le déploiement.

**Livraison** :
1. Fait : étiquette par défaut passée à `frontend-v1.6` dans `docker-compose.yml` et dans le tableau de `CLAUDE.md`, dans le commit du code (`d803a7d`).
2. Fait : image `frontend-v1.6` construite depuis `d803a7d` dans un `git worktree` propre, supprimé ensuite. Image `b2197610997e`, 112 Mo (109 pour `frontend-v1.5`, même base nginx 1.31.9) ; fichiers servis : 9,5 Mo contre 8,0. Build Vite : mêmes noms de vidéos qu'en local (`hero-16x9-Byha7RNK.mp4`, `hero-4x5-B3l9Ikdx.mp4`) ; précache de 113 entrées.
   Vérifiée dans un conteneur de test (`amame-it3-front`, supprimé ensuite) :
   - **contenu** : ni `video-sources/`, ni `hero-section/`, ni `.mp4` hors de `/assets/` ; `sw.js` ne mentionne aucun `.mp4` ; les vidéos servies sont identiques, à l'octet près, aux fichiers commités ;
   - **HTTP** : `/`, `/bourses`, `/config.js`, `sw.js` et le poster répondent `200` avec le bon type ; chaque vidéo répond `Content-Type: video/mp4`, `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges: bytes`, et `206` aux requêtes `Range` (début de fichier et fin de fichier, comme Safari) ; pas de compression gzip ;
   - **comportement** : le script de l'itération (`hero.py`) donne sur l'image les mêmes résultats qu'en local, scénarios A à I. Il affiche deux échecs, connus et sans défaut derrière : A2, une erreur d'affichage du script, alors que l'élément LCP est bien le poster ; A7, le plan sombre du tableau noir (63), déjà expliqué plus haut. Le test de jonction donne, sur 6 passages, une luminance de 133 à 146 à ±1 s de la jonction ;
   - **itérations 1 et 2** : bords du contenu à 16 / 32 / 112 / 352 px sur `/`, `/bourses` et `/a-propos` ; liens de la navbar à 0 px du centre à 1100, 1440 et 1920 px ; sous-menu visible au clavier après deux images, 10 essais sur 10.
3. Fait : `docker push yayacode224/amame:frontend-v1.6`. L'empreinte sur Docker Hub est identique à celle de l'image vérifiée (`sha256:b2197610997ea4c28b80f536f2c45a81f04dc89d77cbe504dd9a4c7e288c4013`), plateforme `linux/amd64`. Commits publiés sur `main` (avance rapide).
4. Après la bascule de la stack Portainer `amamestack` : contrôle en production, puis `deploy/portainer/amamestack.env.example` mis à `frontend-v1.6`.

Retour arrière : `frontend-v1.5`.
