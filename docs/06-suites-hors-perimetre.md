# Suites hors périmètre : lisibilité, pages publiques, cache de Nginx Proxy Manager

Rapport et suivi des points laissés hors des rapports 04 (design) et 05 (e-mails, retour après connexion, erreurs). Rédigé le 20 novembre 2026, après la mise en production de `backend-v1.7` et `frontend-v1.14`. Même méthode que les rapports précédents : analyse, décisions de l'équipe, puis une itération déployable à la fois.

---

## 1. Résumé

| # | Point | Constat | Proposition |
| --- | --- | --- | --- |
| S1 | Bandeau de la page Adhésion (A5) et panneau photo de la connexion (A6) peu lisibles | **Le voile vert n'existe pas.** Les opacités `/72`, `/58`, `/42` (et `/82` sur Mot de passe oublié) sont hors de l'échelle de Tailwind 3.4 : aucune classe n'est générée, le dégradé est invalide et le navigateur l'ignore. Et même le voile prévu ne suffirait pas (mesures, section 2.1). | Voile de verts foncés, texte blanc plein ; critère WCAG AA mesuré. Itération **R1**. |
| S2 | Champ masqué après une erreur, sur iPhone | La barre de navigation est collante (64 px) et la page n'a pas de `scroll-padding-top`. Sur WebKit (Safari, donc tous les navigateurs d'iPhone), un champ qui reçoit le focus se place au bord haut, **sous la barre** (mesuré : −10 px) ; Chromium et Firefox le centrent. Ce n'est pas un décalage au chargement : CLS mesuré à 0 sur `/adhesion` et `/login`. | `scroll-padding-top` sur la page. **R1**. |
| S3 | `sw.js` et `config.js` gardés en cache par Nginx Proxy Manager | Option *Cache Assets* : `/sw.js`, `/config.js`, le JS, le CSS et les images reçoivent `Expires` à 00:30 UTC, le `Cache-Control` du site est retiré ; une nouvelle version peut mettre jusqu'à 30 min à être détectée, un changement de `MEDIA_BASE_URL` jusqu'à un jour. | **Action de l'équipe** : désactiver *Cache Assets* (section 2.3). Dans le dépôt : `no-cache` explicite sur `sw.js` et `registerSW.js` (**R1**). |
| S4 | Pages publiques en échec de chargement | Aucune des 17 pages publiques qui chargent des données ne traite l'échec : une liste affiche « Aucune bourse trouvée », une fiche « introuvable », alors que le serveur ou le réseau est en cause. | `QueryError` (déjà utilisé dans l'administration). Itération **R2**. |
| S5 | `Register.tsx` (A2) | 1 159 lignes, importé nulle part ; `/register` redirige vers `/adhesion`. L'adresse backend `/visitor/register` reste utilisée par le formulaire « Nouvel utilisateur » de l'administration. | Supprimer le fichier (pas l'adresse backend). **R1**, si l'équipe confirme. |
| S6 | Adresse du pied de page | Commitée (`352c38b`) après la construction de `frontend-v1.14`. | Entre avec **R1**. |

---

## 2. Analyse

### 2.1 S1 — voiles sur les photos

Classes générées par Tailwind (CSS servi par Vite, vérifié) : `/55`, `/35`, `/45`, `/90` existent ; `/72`, `/58`, `/42`, `/82` n'existent pas. Zones touchées :

| Zone | Classes | Effet |
| --- | --- | --- |
| Adhésion, bandeau (`Adhesion.tsx`) | `from-…/72 via-…/58 to-…/42` | aucune des trois : **pas de voile** |
| Connexion, panneau photo, ordinateur (`Authentication.tsx`) | `from-…/72 via-…/55 to-…/35` | sans `from`, le dégradé est invalide : **pas de voile** |
| Connexion, bandeau, téléphone | `from-…/72 to-…/45` | **pas de voile** |
| Mot de passe oublié, fond | `from-…/90 via-…/82 to-…/65` | voile présent, sans le point du milieu (lisible) |

Mesure du contraste (`overlay_contrast.py`, image `frontend-v1.14`, API simulée) : chaque texte est rendu transparent, on photographie le fond sous sa boîte et on compare sa couleur au **pixel le plus clair** (99e centile). Seuils WCAG AA : 4,5:1, 3:1 pour un grand titre.

| Zone | Actuel (sans voile) | Voile prévu (72/58/42) | Proposé : verts foncés 85/80/75, texte blanc |
| --- | --- | --- | --- |
| Adhésion, 390 px | paragraphe 1,0 ; titre 1,1 | 1,9 ; 2,2 | **4,7 ; 4,8** |
| Adhésion, 1440 px | 1,0 ; 1,2 | 1,9 ; 2,5 | **4,6 ; 5,2** |
| Connexion, panneau, 1440 px | copyright 1,0 ; titre 1,0 | 1,3 ; 2,7 | copyright 3,9 ; titre **5,5** |
| Connexion, bandeau, 390 px | « AMAME » 1,0 | 3,2 | **5,8** |

Pourquoi le voile prévu ne suffit pas : il finit sur le vert de la marque (`#16a34a`), avec lequel du blanc ne dépasse jamais 3,3:1, et le paragraphe est en `green-100` à 90 %. Le copyright du panneau est en blanc à 35 % : illisible quel que soit le voile. Proposé : voile de `amame-green-darker` et `amame-green-dark` seulement, texte blanc plein, copyright en blanc à 80 % et un bas de panneau un peu plus sombre (à régler à la mesure). **Conséquence visuelle : la photo devient une texture sombre**, moins visible qu'avec l'intention d'origine.

Constat voisin, hors de ce plan : le texte blanc sur un fond `bg-amame-green` (boutons, badges : 87 occurrences) donne 3,3:1, sous le seuil de 4,5:1 pour un texte normal. Corriger demande de choisir une teinte de bouton (par exemple `amame-green-dark`, 5,0:1) : décision de design à part.

### 2.2 S2 — champ sous la barre de navigation

`Navbar` : `sticky top-0`, hauteur 64 px ; `index.css` : `scroll-behavior: smooth`, aucun `scroll-padding-top`. Mesure (`focus_ab.py`, page Adhésion, 390 px, champ e-mail placé au-dessus de l'écran puis focus) : Chromium et Firefox centrent le champ (402 px) ; **WebKit l'amène au bord haut, à −10 px, sous la barre**. Les positions variables de `p3a.py` (Chromium : −10, 74, 402 px) venaient d'autre chose : une mesure prise à 900 ms, pendant le défilement animé. Correctif : `scroll-padding-top: 5rem` ; WebKit place alors le champ à 70 px, sous la barre (bas à 65 px). Il vaut aussi pour une future ancre ou un `scrollIntoView` (aucun aujourd'hui).

### 2.3 S3 — *Cache Assets* de Nginx Proxy Manager

Relevé le 14 novembre (docs/03, notes de l'étape 1) et le 20 novembre (docs/04, itération 6). Sans *Cache Assets*, le conteneur frontend pose déjà les bons en-têtes : `/assets/` et polices un an `immutable`, images 7 jours, `config.js` et `index.html` jamais en cache. `sw.js` et `registerSW.js` n'ont pas d'en-tête explicite (les navigateurs revalident le script du service worker, mais un `no-cache` explicite évite toute ambiguïté).

Action proposée à l'équipe (interface de Nginx Proxy Manager, hôte `amame.ml`, onglet *Details*) : décocher **Cache Assets**, enregistrer. Contrôle ensuite, en lecture seule : `Cache-Control` de `/config.js` = `no-store…`, de `/assets/index-*.js` = `public, max-age=31536000, immutable`. Retour arrière : recocher la case. Alternative, moins simple : garder *Cache Assets* et ajouter des *Custom locations* pour `/sw.js`, `/registerSW.js` et `/config.js`.

### 2.4 S4 — pages publiques

Pages concernées (requêtes React Query sans traitement d'erreur) : Articles, ArticleDetail, Bourses, BoursesDetail, Concours, ConcoursDetail, Galeries, GuideConseils, LiensUtiles, Membres, Orientation, OrientationDetail, Partenaires, Postes, RessourcesAcademiques, Universites, et le formulaire Adhésion (statut). Composants de l'accueil avec données : `BoursesList`, `ConcoursListing`. Proposé : une liste en échec affiche `QueryError` (« La liste n'a pas pu être chargée », raison traduite, « Réessayer ») à la place de l'état vide ; une fiche distingue « introuvable » (404, phrase du serveur depuis `backend-v1.7`) d'une panne (`QueryError`) ; une section de l'accueil en échec se masque ou affiche un message court (à trancher à la mesure). Les erreurs 4xx ne sont plus réessayées (P3b), l'affichage est immédiat.

---

## 3. Plan

| Itération | Contenu | Image | Critères d'acceptation |
| --- | --- | --- | --- |
| **R1** — lisibilité et détails | S1 (4 zones), S2, `no-cache` de `sw.js` / `registerSW.js` dans `nginx.conf`, S5 (si confirmé), S6 | `frontend-v1.15` | chaque texte des 4 zones ≥ 4,5:1 (≥ 3:1 grand titre) au pire endroit, à 390, 768 et 1440 px ; champ en erreur jamais sous la barre (390 px) ; `nginx -t` correct, en-têtes de `sw.js` ; `tsc` sans erreur |
| **R2** — pages publiques | S4 | `frontend-v1.15` (avec R1, voir E5) | pour chaque page : réponse 500 et réseau coupé → message et « Réessayer », jamais l'état vide ; fiche 404 → « introuvable » ; aucun écran vide (390 et 1440 px) |
| Action de l'équipe | S3 : désactiver *Cache Assets* | aucune | en-têtes de `/config.js` et `/assets/` relus à travers `https://amame.ml` |

Aucune itération ne touche le backend.

---

## 4. Décisions à prendre

| # | Question | Recommandation |
| --- | --- | --- |
| E1 | Voiles : accepter une photo plus sombre (verts foncés ~85 %) pour atteindre le contraste AA ? | **oui** ; l'intention d'origine (photo bien visible) ne permet pas un texte lisible sur ces photos |
| E2 | Supprimer `Register.tsx` (l'adresse backend `/visitor/register` reste) ? | **oui** |
| E3 | Nginx Proxy Manager : désactiver *Cache Assets* sur `amame.ml` ? | **oui** (plus simple que des *Custom locations*) |
| E4 | Ajouter à R1 la correction des en-têtes de sécurité perdus dans les `location` de `nginx.conf` qui posent leur propre `add_header` (docs/04, annexe C) ? | **oui** : même fichier, contrôle par `curl` |
| E5 | Deux images (R1 puis R2) ? | **oui** : R1 est court et visible, R2 touche 17 pages. *Révisé le 20 novembre par l'équipe : « On continue avec le reste du correctif. À la fin, on fera un build et push » : R1 et R2 dans une seule image, `frontend-v1.15`.* |

Hors de ce plan, à décider plus tard : teinte des boutons verts à texte blanc (3,3:1, section 2.1) ; précache PWA de 1,9 Mio (environ 1 Mio transféré), dont la moitié pour l'icône de 512 px (mesure du 21 novembre, journal) ; en-têtes `Cache-Control` en double dans 5 `location` de `nginx.conf` ; `npm run lint` inutilisable (docs/04, annexe C).

---

## 5. Suivi

| Itération | État | Image | Date | Notes |
| --- | --- | --- | --- | --- |
| R1 | **en production** (décidé : E1, E2, E4, E5) | `frontend-v1.15` | 2026-11-20 | commit `a3494fc`, voir le journal |
| R2 | **en production** ; même image que R1 (E5 révisé) | `frontend-v1.15` | 2026-11-20 | commit `a3494fc`, voir le journal |
| S3 (équipe) | **fait** : *Cache Assets* décoché sur `amame.ml` | — | 2026-11-21 | confirmé par l'équipe ; contrôle des en-têtes laissé à l'équipe |

### Journal

**2026-11-20 — Analyse.** Mesures sur l'image `frontend-v1.14` servie en local (API simulée par Playwright, aucune requête vers la production) : CLS (`cls_adhesion.py`) et contraste (`overlay_contrast.py`), scripts dans le dossier temporaire de la session. Classes Tailwind vérifiées dans le CSS servi par Vite.

**2026-11-20 — Décisions.** L'équipe retient toutes les recommandations (E1 à E5).

**2026-11-20 — R1 : lisibilité et détails.**

- **S1, voiles.** Nouvelle classe `.amame-photo-veil` (`index.css`) : dégradé de `#14532d` à 90 % et 85 % vers `#15803d` à 82 %, un seul réglage pour les 4 zones (Adhésion, panneau et bandeau de la connexion, Mot de passe oublié). Texte du bandeau Adhésion en blanc plein (au lieu de `green-100` à 90 %) ; copyright du panneau de connexion en blanc (au lieu de 35 %) avec un bas de panneau assombri ; « vers l'Excellence » en or clair `amber-300` (l'or de la marque `#ca8a04` plafonnait à 1,8:1 sur le voile) ; lien « Retour à la connexion » de Mot de passe oublié en blanc (texte quasi noir du bouton « ghost » : 3,0:1 sur le voile).
- **S2.** `scroll-padding-top: 5rem` sur `html`.
- **S3 et E4, `nginx.conf`.** En-têtes de sécurité dans `docker/security-headers.conf`, inclus au niveau `server` et dans les 14 `location` qui posent leur propre `add_header` (ainsi que dans `uploads-disk.conf`) ; `location = /sw.js` et `= /registerSW.js` en `Cache-Control: no-cache` ; `Dockerfile` copie le fragment.
- **S5.** `Register.tsx` supprimé (aucun import ; `/register` redirige toujours vers `/adhesion` ; l'adresse backend `/visitor/register` reste).
- **S6.** Nouvelle adresse du pied de page (`352c38b`), déjà dans le dépôt.
- **Vérifié.** Contraste (`overlay_check.py`, serveur Vite, API simulée ; boutons pleins écartés) : **9/9** zones conformes, pire texte par zone : Adhésion 5,0 à 5,3:1 (390, 768, 1440 px), panneau de connexion 5,7:1 (copyright), bandeau de connexion 3,9:1 (« vers l'excellence », grand texte, seuil 3) et 6,9:1, Mot de passe oublié 6,3 à 6,4:1. Focus sous la barre (`focus_ab.py`, champ placé au-dessus de l'écran) : WebKit −10 px avant, **70 px** après (bas de la barre à 65 px) ; Chromium et Firefox centrent le champ dans les deux cas. Nginx (conteneur `nginx:alpine` avec les fichiers du dépôt) : `nginx -t` correct ; `/`, `/index.html`, `/adhesion`, `/sw.js`, `/registerSW.js`, `/config.js`, `/assets/…js`, `/logo-192.webp` portent tous `X-Content-Type-Options`, `X-Frame-Options` et `Referrer-Policy` (avant : absents de `/assets/`, des images et des polices) ; `sw.js` et `registerSW.js` en `no-cache`. `tsc` sans erreur. Non-régression : `p3a.py` **40/40**, `p2.py` **38/38**.

**2026-11-20 — R2 : pages publiques en échec de chargement.** L'équipe demande de poursuivre et de construire une seule image à la fin (E5 révisé : R1 et R2 dans `frontend-v1.15`).

- **Listes** (Bourses, Concours, Articles, Postes, Galeries, Orientation, Universités, Guide et conseils, Liens utiles, Ressources, Membres, Partenaires, et les composants `BoursesList` / `ConcoursListing` des pages Bourses d'études, Bourses de recherche, Concours nationaux et internationaux) : `<QueryError>` (titre propre à la page, raison traduite, « Réessayer ») quand `isLoadingError`, à la place de « Aucun… trouvé ». Une erreur de rechargement en arrière-plan garde la liste affichée. Les pages à trois requêtes (liste, recherche, filtre) lisent les données, le chargement et l'erreur de la requête active (`activeQuery`), au lieu de combiner les trois.
- **Fiches** (bourse, concours, article, filière) : 404 ou identifiant invalide → l'écran « … non trouvé » de la page ; toute autre erreur → nouveau composant `DetailLoadError` (raison, « Réessayer », retour à la liste). Avant : toute erreur affichait « Bourse non trouvée » / « Concours non trouvé », et une panne de l'article ou de la filière aussi. Fonction `isNotFound` dans `apiError.ts`.
- **Adhésion** (connecté) : statut de la demande en panne → message et « Réessayer », au lieu du formulaire de nouvelle demande (qui laissait croire qu'aucune demande n'était en cours).
- **Hors ligne : `networkMode: "always"`** (`queryClient.ts`, requêtes et envois). Constat en vérifiant : après l'événement `offline` du navigateur, React Query met les requêtes en pause sans erreur ; une fiche affichait « … non trouvé », une recherche rien, un formulaire restait sur « Envoi… », et le service worker ne pouvait pas répondre avec sa copie `api-public` puisque rien n'était envoyé. Désormais la requête part ; à défaut de copie, l'échec réseau s'affiche.
- Hors de R2, inchangé : l'accueil ne charge aucune donnée de l'API ; les listes secondaires (articles récents, articles similaires) se masquent quand elles échouent.
- **Vérifié** (serveur Vite, API simulée par Playwright, scripts du dossier temporaire de la session) :
  - `r2_check.py` **81/81** : pour les 16 listes, 500 → message avec la référence et « Réessayer », jamais l'état vide ; « Réessayer » relance la requête et recharge la liste ; réseau coupé (390 px) → « Connexion impossible », encadré dans l'écran. Pour les 4 fiches, 500 → message, « Réessayer », lien de retour, puis la fiche s'affiche ; 404 (390 px) → « … non trouvé » sans « Réessayer » ; identifiant invalide → « non trouvé ». Adhésion connectée, statut en 500 → message sans formulaire, puis formulaire après « Réessayer ». Les 16 listes sans erreur : aucun message, aucun plantage.
  - `r2_offline.py` **5/5** : événement `offline` et requêtes en échec, 4 fiches et une recherche → « Connexion impossible » (3 essais envoyés), jamais « non trouvé » ni l'état vide. Contre-épreuve sans `networkMode: "always"` : **0/5**, aucune requête envoyée, les 4 fiches affichent « … non trouvé ».
  - `tsc` sans erreur. Non-régression (le réglage `networkMode` vaut pour tout le site) : `p3a.py` **40/40** (formulaires publics), `p2.py` **38/38** (retour après connexion), `p3b.py` **14/14** (administration et espace membre).

**2026-11-20 — `frontend-v1.15` construite et publiée.** Commit `a3494fc` (R1 et R2), construite depuis un worktree propre, étiquette absente de Docker Hub auparavant. Contrôle de l'image : `nginx -t` correct ; `/`, `/sw.js`, `/registerSW.js`, `/config.js` et `/assets/…js` portent les en-têtes de sécurité ; `sw.js` et `registerSW.js` en `no-cache` ; le bundle contient le code R2, `networkMode: "always"`, `.amame-photo-veil` et la nouvelle adresse du pied de page. Poussée : empreinte `sha256:0f3e095e4d586b3a5d7ce877f61b54fc1b5421072c08c6a81e6cadf0053d12b0`, identique sur Docker Hub et en local. À faire par l'équipe : déployer (`FRONTEND_IMAGE_TAG=frontend-v1.15`, backend inchangé `backend-v1.7`) et décocher *Cache Assets* (S3). Retour arrière : `frontend-v1.14`. Relevé en passant, déjà présent en v1.14 et sans effet gênant : `/assets/` envoie deux `Cache-Control` (`expires 365d` et `add_header`), tous deux d'un an.

**2026-11-20 — `frontend-v1.15` en production.** Déploiement confirmé par l'équipe (`FRONTEND_IMAGE_TAG=frontend-v1.15`, `backend-v1.7` inchangé) ; `deploy/portainer/amamestack.env.example` passe à `frontend-v1.15`. Contrôle en production laissé à l'équipe. Restent : la désactivation de *Cache Assets* (S3) à confirmer, et les points hors plan de la section 4.

**2026-11-21 — S3 fait.** L'équipe a décoché *Cache Assets* dans Nginx Proxy Manager (hôte `amame.ml`). Les en-têtes du conteneur s'appliquent désormais (`config.js` jamais en cache, `sw.js` en `no-cache`, `/assets/` un an). Contrôle possible, en lecture seule : `curl -sI https://amame.ml/config.js` doit montrer `Cache-Control: no-store…` et aucun `Expires`. Reste à observer : le rechargement automatique après un déploiement (D9 du rapport 05), jamais constaté en production.

**2026-11-21 — Rechargement automatique constaté.** Test de l'équipe : un appareil qui avait ouvert `amame.ml` avant le déploiement de `frontend-v1.15` s'est rechargé de lui-même et affiche la nouvelle adresse du pied de page. D9 (rapport 05) fonctionne en production. Tous les points de ce rapport sont faits ; restent seulement les sujets hors plan de la section 4.

**2026-11-21 — Mesure du précache (hors plan).** Build de `a3494fc` dans le dossier temporaire de la session : 117 entrées, 113 adresses distinctes (4 icônes listées deux fois, téléchargées une seule fois). Environ 1,9 Mio de fichiers, soit environ 1 Mio transféré grâce à la compression gzip de Nginx. Répartition du transfert : icônes PNG/ICO **526 Kio** (dont `web-app-manifest-512x512.png` seule 368 Kio, puis l'icône de 192 px 65 Kio et `apple-touch-icon.png` 58 Kio) ; JS et CSS publics et communs 336 Kio ; polices 85 Kio ; administration 58 Kio (31 fichiers) ; espace membre 14 Kio. Correction de l'analyse du 20 novembre : l'administration ne pèse qu'environ 7 % ; le poste principal, ce sont les icônes, jamais compressées. Constat voisin : dans `nginx.conf`, 5 `location` (`/assets/`, `/images/`, `/amame-uploads/`, icônes et images, polices) posent à la fois `expires` et `add_header Cache-Control` ; le navigateur reçoit deux `Cache-Control` de même durée, plus un `Expires`. Sans effet gênant.
