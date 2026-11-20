# Rapport — Sigle dans les e-mails, retour à la page après connexion, messages d'erreur (AMAME)

| | |
| --- | --- |
| **Date** | 20 novembre 2026 |
| **Base** | branche `deploiement/v1.3`, commit `a2c3046` (production au départ : `backend-v1.4`, `frontend-v1.10`) |
| **Demande** | trois points de l'équipe, implémentés et déployés **un par un** : (1) le sigle AMAME mal développé dans les e-mails ; (2) après une connexion, revenir à la page qui l'exigeait ; (3) des messages d'erreur compréhensibles par un élève, sans outil de développement |
| **Nature** | analyse du code, plan par itération **et fichier de suivi** (section 6) : le lire en premier à chaque session, le mettre à jour après chaque itération |

---

## 1. Résumé

| Point | Constat | Itération | Images |
| --- | --- | --- | --- |
| 1. Sigle | Les e-mails développent AMAME en « Association Malienne pour l'**Avancement du Mérite Éducatif** » (en-tête de **tous** les e-mails, corps de l'e-mail d'approbation). La page Adhésion fait la même erreur. Le site, lui, dit partout « Association Malienne d'Appui aux Meilleurs Élèves ». | **P1** : corrigé (avec le nouveau titre de l'accueil, D6, et la limite de débit de l'inscription, D8), à publier | `backend-v1.5`, `frontend-v1.11` |
| 2. Retour après connexion | Les deux gardes (admin, espace membre) envoient vers `/login` sans retenir la page demandée ; la connexion ramène toujours à `/`. Une session expirée en cours de navigation n'est pas détectée. | **P2** : décisions prises, à faire après le déploiement de P1 | `frontend-v1.12` |
| 3. Erreurs | Le backend renvoie bien « Un compte existe déjà avec cet email. » (409), mais le site ne l'affiche que dans un toast de 5 s, loin du champ, qui disparaît ; rien ne propose de se connecter. Ailleurs : messages techniques (500 avec le texte de l'exception), messages faux (« Email ou mot de passe incorrect » quand le serveur est en panne), erreurs avalées sans message. | **P3a** puis **P3b** : décisions prises, à faire après P2 | `backend-v1.6`, `frontend-v1.13`, puis `frontend-v1.14` (et `backend-v1.7` si besoin) |

---

## 2. Analyse du code

### 2.1 Point 1 — le sigle dans les e-mails

Tous les e-mails sont construits par [`EmailService.java`](../backend/src/main/java/com/example/siteamame/service/EmailService.java) (aucun gabarit externe) ; ils sont déclenchés par `AdhesionService` (demande → administrateurs, approbation, rejet) et `PasswordResetService` (réinitialisation du mot de passe).

| Endroit | Avant | Portée |
| --- | --- | --- |
| `layout()`, en-tête vert | « Association Malienne pour l'Avancement du Mérite Éducatif » | les **4** e-mails |
| `sendAdhesionApprovalToUser()` | « …à l'Association Malienne pour l'Avancement du Mérite Éducatif (AMAME) » | e-mail d'approbation |
| `Adhesion.tsx`, bandeau | « Rejoignez l'Association Malienne pour l'Avancement du Mérite Éducatif » | page publique `/adhesion` |
| `layout()`, pied | « © 2025 AMAME » écrit en dur | les 4 e-mails (faux depuis le 1er janvier 2026) |

Constat de sécurité dans le même fichier : le prénom, le nom, l'e-mail du visiteur et le motif de rejet étaient insérés **sans échappement** dans le HTML. Un visiteur qui s'inscrit avec le nom `<a href="https://…">Cliquez ici</a>` faisait apparaître un vrai lien dans l'e-mail envoyé aux administrateurs (hameçonnage depuis l'adresse officielle de l'association).

### 2.2 Point 2 — revenir à la page demandée après la connexion

| Élément | Constat |
| --- | --- |
| [`ProtectedRoute.tsx`](../frontend/src/components/ProtectedRoute.tsx) (routes `/admin/*`) | `<Navigate to="/login" replace />` : la page demandée est perdue. |
| [`LayoutMembre.tsx`](../frontend/src/components/membre/LayoutMembre.tsx) (routes `/membre/*`) | garde écrite à part, dans un `useEffect` : `navigate("/login")` **sans** `replace` (le bouton Retour ramène sur la page protégée, qui renvoie aussitôt vers `/login`), et la page membre est rendue un instant avant la redirection. |
| [`Authentication.tsx`](../frontend/src/pages/Authentication.tsx) (`/login`) | après succès : `navigate("/")`, toujours. Un utilisateur déjà connecté qui ouvre `/login` voit le formulaire. |
| Liens « Connexion » (Navbar, BottomNav, page Adhésion) | simples `<Link to="/login">` : on ne revient pas non plus à la page publique d'où l'on venait. |
| [`axiosInstance.ts`](../frontend/src/utils/axiosInstance.ts) | si le renouvellement de session échoue (session expirée après 7 jours, ou révoquée), la requête est rejetée mais l'utilisateur reste « connecté » dans le cache React Query (`staleTime: Infinity`) : les gardes ne redirigent pas, les écrans affichent des erreurs. |

Constat reproduit (Playwright, API simulée) : `/membre/profil` → `/login` → connexion → `/` ; idem pour `/admin/bourses`.

### 2.3 Point 3 — gestion des erreurs

**Le parcours cité (création de compte avec un e-mail existant).** L'inscription publique passe par `POST /api/visitor/adhesion/register` (`AdhesionService.registerAndSubmitAdhesion`), qui répond bien `409` « Un compte existe déjà avec cet email. ». [`Adhesion.tsx`](../frontend/src/pages/Adhesion.tsx) l'affiche dans un **toast** titré « Erreur ». Mesuré :

- ordinateur (1440 px) : toast en bas à droite, à l'opposé du formulaire ; disparu au bout de 5 s ;
- téléphone (390 px) : toast en haut, champ e-mail **hors de l'écran** (y = −428 px) ;
- le champ n'est pas marqué en erreur (`aria-invalid=false`), aucun lien « Se connecter » ou « Mot de passe oublié ».

Le message existe donc, mais on le rate facilement, et il n'aide pas à corriger. Les critères WCAG 3.3.1 (erreur identifiée dans le texte, près du champ) et 3.3.3 (suggestion de correction) ne sont pas remplis.

**Backend** ([`GlobalHandlerException.java`](../backend/src/main/java/com/example/siteamame/exception/GlobalHandlerException.java)) :

| Problème | Effet |
| --- | --- |
| Le gestionnaire de dernier recours renvoie `ex.getMessage()` au navigateur | textes techniques à l'écran (« could not execute statement… », « Transaction silently rolled back… », écart C15 du suivi 03), parfois des données. |
| … et ne journalise rien | une erreur 500 en production ne laisse **aucune trace** dans les journaux. |
| `UserService.register` lève `RuntimeException("L'utilisateur existe deja")` | **500** au lieu de 409 (formulaire admin « Nouvel utilisateur ») ; l'exception `UserAlreadyExistsException` existe mais n'est pas utilisée. |
| Pas de gestionnaire pour : contrainte d'unicité (`DataIntegrityViolationException`), fichier trop gros (`MaxUploadSizeExceededException`), JSON illisible, partie ou paramètre manquant, mauvais type d'identifiant, méthode non permise | tous sortent en **500** avec le message technique. |
| `@ExceptionHandler(DataAccesException.class)` reçoit un `DataAccessException` (Spring) | signature incohérente : le gestionnaire échouerait s'il était appelé. |
| Erreurs de validation : `message` = « Données invalides », détails `"email : Adresse email invalide"` | le site n'affiche que « Données invalides » ; les champs fautifs ne sont pas signalés. |

**Frontend** (36 fichiers attrapent des erreurs, chacun à sa façon) :

| Façon de faire | Exemples | Effet |
| --- | --- | --- |
| message fixe, quel que soit le cas | `Authentication.tsx` : « Email ou mot de passe incorrect. » | **faux** quand le serveur est en panne ou le réseau coupé (vérifié : 500 et hors-ligne affichent ce message). |
| message du backend tel quel | `Adhesion.tsx`, `Parametres.tsx`, `ForgotPassword.tsx` | bon pour un 409, technique pour un 500 ; vide pour une erreur Nginx (502/504 en HTML) → « Une erreur est survenue. » |
| message d'Axios | `permissionService.ts` : `err.message` | « Request failed with status code 403 ». |
| générique | formulaires admin, `Don.tsx`, `Profil.tsx` | « Une erreur est survenue. » sans dire quoi faire. |
| rien | `ArticleForm`, `BourseForm`, `ConcoursForm` (`console.error` seul) | l'administrateur clique, rien ne se passe. |
| pas d'`ErrorBoundary` | toute l'application | une erreur de rendu donne une **page blanche**. |

### 2.4 Constats annexes (hors des trois points)

| # | Constat | Proposition |
| --- | --- | --- |
| A1 | Le débit de l'inscription est limité par Nginx sur `/api/visitor/register` (ancien formulaire, plus utilisé), mais l'inscription réelle passe par `/api/visitor/adhesion/register`, **sans limite** ; chaque inscription envoie un e-mail à chaque SUPERADMIN (`notifyAdmins`). Même absence de limite sur `/api/visitor/auth/forgot-password` (un e-mail par appel, vers n'importe quel compte existant) et sur `/api/auth/login` (essais de mots de passe). Un script peut ainsi créer des milliers de faux comptes, inonder les boîtes des administrateurs, et épuiser le quota d'envoi du compte d'expédition (Gmail : quelques centaines de destinataires par jour), ce qui bloquerait les vrais e-mails (approbations, réinitialisations). | **inscription : faite dans P1** (D8) ; mot de passe oublié et connexion : dans P3a, avec la réponse `429` traduite en message clair partout. |
| A2 | `Register.tsx` (1 159 lignes) n'est plus routé (`/register` redirige vers `/adhesion`). | le supprimer quand l'équipe le confirme. |
| A3 | Écart C15 (suivi 03) : `@Transactional` sur des méthodes de contrôleur → « Transaction silently rolled back… » à l'écran. | le corriger dans P3b (même famille : message technique affiché). |
| A5 | Bandeau de `/adhesion` : texte `green-100` sur une photo chargée, peu lisible sur téléphone (constat antérieur à P1, vu sur la capture de vérification). | voile plus sombre sous le texte, à traiter avec les itérations de design (suivi 04). |
| A6 | Page `/login` sur ordinateur : sur le panneau photo, « AMAME » et le copyright sont presque illisibles ; le voile vert (`from-amame-green-darker/72 via-…/55 to-…/35`) ne semble pas appliqué. Cause probable : l'opacité `/72` hors de l'échelle de Tailwind, donc dégradé non généré (vu le 20 novembre pendant P2, antérieur). | à traiter avec le design (suivi 04), pas dans ce rapport. |
| A4 | Modification locale de `Hero.tsx` (titre = nom complet de l'association) : dans aucun commit ni aucune image. | **intégrée à P1** (D6). Mesurée : voir le journal. |

---

## 3. Plan par itération

Chaque itération est livrable seule : commit, images, vérification, déploiement dans Portainer, contrôle en production. La suivante ne commence qu'après le déploiement de la précédente.

### P1 — Sigle dans les e-mails (fait dans le dépôt, à publier)

- `EmailService` : constante unique `ASSOCIATION_NAME = "Association Malienne d'Appui aux Meilleurs Élèves"`, utilisée dans l'en-tête et dans l'e-mail d'approbation ; année du pied calculée (`Year.now()`) ; valeurs saisies échappées (`HtmlUtils.htmlEscape`, UTF-8 : les accents restent tels quels).
- `Adhesion.tsx` : même correction dans le bandeau.
- `Hero.tsx` (D6) : titre de l'accueil = « Association Malienne d'Appui aux Meilleurs Élèves » (sans point final), modification de l'équipe ; accroche, ligne verte et phrase en commentaire.
- `nginx.conf` (D8) : `location = /api/visitor/adhesion/register` avec la même limite que l'ancien formulaire (zone `register` partagée : 5 par minute et par adresse, marge de 5, réponse `429`) ; `Adhesion.tsx` affiche alors « Trop de tentatives. Patientez une minute avant de réessayer. ».
- Test : `EmailServiceTest` (3 tests) — nom complet dans les 4 e-mails, plus aucune trace de l'ancien développement, année courante, balises échappées, accents conservés.
- Images : `backend-v1.5` (e-mails) et `frontend-v1.11` (page Adhésion, titre de l'accueil). Aucune migration, aucune variable nouvelle.
- Contrôle en production : demander une réinitialisation de mot de passe sur un compte de l'équipe et lire l'en-tête de l'e-mail reçu ; ouvrir `/adhesion`.

### P2 — Revenir à la page demandée après la connexion (`frontend-v1.12`)

1. Une seule garde, `RequireAuth`, pour `/admin/*` et `/membre/*` (la garde de `LayoutMembre` disparaît) : non connecté → `/login?redirect=<chemin + paramètres>` avec `replace`.
2. `/login` : après succès, retour à `redirect` s'il est sûr, sinon `/`. « Sûr » = chemin interne commençant par un seul `/`, jamais `//`, `/\`, une URL complète, ni `/login`, `/forgot-password`, `/reset-password` (pas de redirection ouverte). Bandeau d'information : « Connectez-vous pour accéder à cette page. » Déjà connecté sur `/login` → envoyé directement à la destination.
3. Session expirée en cours de navigation : si le renouvellement échoue, l'intercepteur vide l'utilisateur du cache ; sur une page protégée, la garde redirige vers `/login?redirect=…&raison=session` (« Votre session a expiré. Reconnectez-vous pour continuer. »), puis revient à la page.
4. Déconnexion volontaire : retour à l'accueil, sans paramètre `redirect`.
5. Liens « Connexion » (Navbar, BottomNav, page Adhésion) : emportent la page courante (décision D2).

Critères : pour `/membre/profil`, `/membre/cotisation?x=1`, `/admin/bourses/edit/3` → connexion → même page ; `redirect=//exemple.test`, `redirect=https://exemple.test` → `/` ; Retour du navigateur après connexion ne revient pas sur `/login` ; déconnexion → `/` ; 7 largeurs d'écran.

### P3a — Contrat d'erreur et formulaires publics (`backend-v1.6`, `frontend-v1.13`)

**Backend** : `ApiError` garde ses champs (compatibilité) et gagne `code` (stable, ex. `EMAIL_ALREADY_USED`, `VALIDATION_FAILED`, `FILE_TOO_LARGE`, `INTERNAL_ERROR`) et `fieldErrors` (champ → message). `message` est **toujours** une phrase pour l'utilisateur. Le gestionnaire de dernier recours journalise l'exception avec un numéro d'incident court et répond « Une erreur inattendue est survenue. Réessayez dans quelques instants. (réf. 7F3A2C) ». Gestionnaires ajoutés pour les cas de la section 2.3 ; `UserService.register` lève `UserAlreadyExistsException` (409).

**Frontend** : un seul traducteur `src/utils/apiError.ts` (réseau coupé, délai dépassé, 401, 403, 404, 409, 413, 429, 5xx, 502/503/504 de Nginx) ; les erreurs de formulaire s'affichent **dans le formulaire** (sous le champ ou dans un encadré `role="alert"` au-dessus du bouton), plus dans un toast ; le toast reste pour les confirmations.

| Situation | Message proposé |
| --- | --- |
| Inscription, e-mail déjà utilisé (sous le champ e-mail, focus sur le champ) | « Cet e-mail est déjà utilisé. **Connectez-vous** ou saisissez une autre adresse. » + liens « Se connecter » (e-mail prérempli) et « Mot de passe oublié ? » |
| Connexion, identifiants faux (401) | « E-mail ou mot de passe incorrect. » |
| Pas de réseau | « Connexion impossible. Vérifiez votre connexion Internet, puis réessayez. » |
| Serveur indisponible (500, 502, 503, 504) | « Le service est momentanément indisponible. Réessayez dans quelques minutes. » |
| Trop de tentatives (429) | « Trop de tentatives. Patientez une minute avant de réessayer. » |
| Champ refusé par le serveur (400) | le message du serveur, sous le champ concerné |

Formulaires couverts : inscription/adhésion, demande d'adhésion (connecté), connexion, mot de passe oublié, réinitialisation. Plus A1 pour mot de passe oublié et connexion (l'inscription est limitée depuis P1).

### P3b — Autres formulaires (`frontend-v1.14`, `backend-v1.7` si C15)

Espace membre (Profil, Paramètres, Don, Cotisation), formulaires et listes admin (dont `ArticleForm`, `BourseForm`, `ConcoursForm` qui n'affichent rien, et `permissionService`), erreurs d'upload (413, format refusé par `UploadValidator`), `ErrorBoundary` global (page « Un problème est survenu » avec bouton Recharger au lieu d'une page blanche), C15.

---

## 4. Décisions

Toutes prises par l'équipe le **20 novembre 2026** : les recommandations sont retenues, et D6 est acceptée.

| # | Question | Décision |
| --- | --- | --- |
| D1 | P1 contient aussi l'échappement des noms, l'année du pied et la page Adhésion. D'accord ? | **oui** |
| D2 | Les liens « Connexion » de la barre de navigation ramènent-ils aussi à la page publique d'où l'on vient (ex. une bourse) ? | **oui** |
| D3 | Session expirée sur une page protégée : redirection automatique vers la connexion, avec message, puis retour ? | **oui** |
| D4 | Erreurs de formulaire dans le formulaire (sous le champ / encadré), toast réservé aux confirmations ? | **oui** |
| D5 | Découper le point 3 en P3a (inscription, connexion, contrat d'erreur backend) et P3b (le reste) ? | **oui** |
| D6 | Le titre de `Hero.tsx` modifié localement entre-t-il dans `frontend-v1.11` ? | **oui** : intégré à P1 |
| D8 | Limite de débit de l'inscription réelle, et point final du titre | **limite appliquée dès P1** au formulaire « Adhérer » (`/api/visitor/adhesion/register`) ; **point final retiré** du titre de l'accueil |
| D9 | Après un déploiement, le navigateur garde l'ancienne version jusqu'au chargement suivant (service worker) | **intégré à P3a** (décision du 20 novembre) : recharger quand une nouvelle version est active, sans perdre une saisie en cours ; exclure `sw.js` et `registerSW.js` du cache de NPM reste une action de l'équipe |
| D7 | Tests | l'équipe ne fait pas lancer la suite backend complète (trop longue sur ce poste) : **implémenter et compiler suffit**. Les tests ciblés et rapides restent écrits ; ce qui n'est pas vérifié est listé dans le journal. |

---

## 5. Vérification — méthode

- Backend : test unitaire ciblé (`./mvnw -o test -Dtest=…`, sans Docker), puis l'image construite démarrée en local si le changement touche la configuration.
- Frontend : `npx tsc --noEmit -p tsconfig.app.json` (4 erreurs connues : LayoutMembre et 3 formulaires admin ; « mêmes 4, aucune nouvelle ») ; Playwright avec une **API simulée** (aucun appel à la vraie API, Neon reste endormi) ; images construites depuis un `git worktree` propre (la modification locale de `Hero.tsx` n'y entre pas).
- Production : contrôles en lecture seule ; pour les e-mails, un e-mail réel envoyé à un compte de l'équipe.

---

## 6. Suivi de l'implémentation

| Itération | État | Images | Date | Commit / notes |
| --- | --- | --- | --- | --- |
| P1. Sigle dans les e-mails (+ titre de l'accueil, D6 ; limite de débit de l'inscription, D8) | **en production** | `backend-v1.5`, `frontend-v1.11` | 2026-11-20 | commit `04a46c4` ; contrôle en production fait par l'équipe ; `EmailService`, `EmailServiceTest`, `Adhesion.tsx`, `Hero.tsx`, `nginx.conf` |
| P2. Retour après connexion | **en production** (contrôlé par l'équipe après rechargement) | `frontend-v1.12` | 2026-11-20 | commit `e977a39` ; `RequireAuth.tsx`, `authRedirect.ts`, `authKeys.ts`, `axiosInstance.ts`, `Authentication.tsx`, `App.tsx`, `LayoutMembre.tsx`, `Navbar.tsx`, `BottomNav.tsx`, `Adhesion.tsx` ; `ProtectedRoute.tsx` supprimé |
| P3a. Erreurs : contrat + formulaires publics + limite de débit (A1) + mise à jour automatique (D9) | **en production** (contrôle par l'équipe) | `backend-v1.6`, `frontend-v1.13` | 2026-11-20 | commit `4c1aed2` ; `ApiErrorCode`, `ApiError`, `GlobalHandlerException`, `apiError.ts`, `FormAlert.tsx`, `appUpdate.ts`, `Adhesion.tsx`, `Authentication.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `form.tsx`, `nginx.conf` |
| P3b. Erreurs : administration, espace membre, `ErrorBoundary`, C15 | **en production** (contrôle par l'équipe) | `backend-v1.7`, `frontend-v1.14` | 2026-11-20 | commit `bd3350c` ; voir le journal |

### Journal

**2026-11-20 — Analyse et P1.**

- Constat initial reproduit avec Playwright (API simulée, serveur Vite local) : doublon d'e-mail (toast seul, 5 s), redirection après connexion (toujours `/`), connexion en panne serveur et hors-ligne (« Email ou mot de passe incorrect »). Captures et script dans le dossier temporaire de la session (`baseline.py`).
- P1 écrit : `EmailService.java` (constante `ASSOCIATION_NAME`, en-tête, approbation, `Year.now()`, `esc()`), `Adhesion.tsx` (bandeau), nouveau `EmailServiceTest.java`.
- Vérifié : `./mvnw -o test -Dtest=EmailServiceTest` → 3 tests, 0 échec ; HTML des 4 e-mails rendu à 600 px (nom complet sur une ligne) et 360 px (deux lignes, sans débordement) ; `tsc` : mêmes 4 erreurs connues ; plus aucune occurrence de « Avancement » ni « Mérite Éducatif » dans `backend/src`, `frontend/src`, `frontend/index.html`.
- Décisions D1 à D7 prises par l'équipe (section 4). D6 : la modification de `Hero.tsx` entre dans P1. Mesurée aux 12 tailles de l'itération 4 du suivi 04 (API simulée, script `hero_d6.py`) : titre sur 3 lignes (4 à 320 px), bouton visible sans défiler, sans débordement horizontal ni chevauchement du bouton Pause, sauf en téléphone paysage 844×390 (bouton sous le pli de 124 px, contre 132 px avant : pas une régression). Couleur du titre inchangée (blanc, contraste déjà mesuré à l'itération 4).
- D7 : suite complète lancée puis **arrêtée à la demande de l'équipe** ; avant l'arrêt, 115 tests passés, 0 échec (dont `EmailServiceTest`, `AuthRefreshIntegrationTest`, `FileLifecycleIntegrationTest`, `BunnyStorageIntegrationTest`). Non exécuté : `SiteAmameApplicationTests` (schéma), sans objet pour P1 qui ne touche pas au schéma. Non vérifié : e-mail réel reçu (après déploiement).
- Remarques de design transmises à l'équipe : le point final dans un titre est inhabituel ; sans la phrase d'accroche, le hero ne dit plus ce que propose le site (bourses, concours, orientation) — le test des 5 secondes du suivi 04 le vérifierait.
- D8 (même jour, avec « commit et build ») : point final du titre retiré ; limite de débit ajoutée sur `/api/visitor/adhesion/register` et message `429` sur la page Adhésion. Étiquettes par défaut passées à `backend-v1.5` et `frontend-v1.11` (`docker-compose.yml`, `CLAUDE.md`).
- Commit `04a46c4` (9 fichiers, dont `Hero.tsx`, étiquettes par défaut et ce rapport).
- Images construites depuis `04a46c4` dans un `git worktree` propre, supprimé ensuite :
  - `backend-v1.5` : `sha256:8661891f937fc93cd73b6c2c550bb6c75098772b8a0dc4eba31f0d62563b11f7`, `linux/amd64` ; Maven `BUILD SUCCESS` (tests sautés par le Dockerfile, comme toujours). Dans le jar, `EmailService` contient le nom correct et `HtmlUtils`, plus « Avancement » ; `EmailServiceTest` n'y est pas.
  - `frontend-v1.11` : `sha256:a927af71232e44425f6bc4d0339fe3dc19a6cd426c44d3c4fb3147a0500dec37`, `linux/amd64` ; précache de 115 entrées (1 894 Kio), comme `frontend-v1.10`. `nginx -t` correct. Dans le bundle : nom correct dans l'accueil, À propos, Adhésion et `index.html`, titre sans point final, 0 fichier avec l'ancien nom, message `429` présent.
- Limite de débit vérifiée sur l'image (réseau Docker de test, faux `backend` qui refuse la connexion) : 8 envois en 6 s sur `/api/visitor/adhesion/register` → `502 ×6` (passés vers le backend), puis `429 429` ; l'ancienne adresse `/api/visitor/register` répond ensuite `429` (quota partagé) ; `/api/visitor/bourses` n'est pas limitée. Un premier essai sans faux backend était trompeur : chaque échec DNS durait 4 s, le quota se rechargeait (1 envoi toutes les 12 s) ; le journal Nginx montrait pourtant le refus au 9e envoi (`excess: 5.054`).
- Page Adhésion servie par l'image, quota épuisé : l'envoi du formulaire reçoit `429` et le toast affiche « Trop de tentatives. Patientez une minute avant de réessayer. » ; titre de l'accueil « Association Malienne d'Appui aux Meilleurs Élèves ».
- Publication (« publie et pousse ») : étiquettes absentes de Docker Hub avant l'envoi ; `docker push` des deux images ; empreintes sur Docker Hub identiques aux images vérifiées (`backend-v1.5` `sha256:8661891f…`, `frontend-v1.11` `sha256:a927af71…`, `linux/amd64`). Commits publiés sur `main` par avance rapide (`a2c3046..c0681d8`).
- **Déploiement** (équipe, Portainer, stack `amamestack`) : `BACKEND_IMAGE_TAG=backend-v1.5`, `FRONTEND_IMAGE_TAG=frontend-v1.11`, mise à jour de la stack avec nouveau téléchargement des images. Aucune migration, aucune variable nouvelle. Retour arrière : `backend-v1.4`, et la version frontend en service avant (`frontend-v1.10` si elle a été déployée, sinon `frontend-v1.9`).
- **Déployé** le 20 novembre (confirmé par l'équipe ; la version précédente en service était `frontend-v1.10`). Le contrôle en production est fait par l'équipe, à sa demande (aucun contrôle de ma part, ni de la limite de débit). `deploy/portainer/amamestack.env.example` passé à `backend-v1.5` et `frontend-v1.11`. Retour arrière : `backend-v1.4`, `frontend-v1.10`.

**2026-11-20 — P2 : retour à la page demandée après la connexion.**

- `src/utils/authRedirect.ts` (nouveau) : `loginPath(page, raison)` construit `/login?redirect=<chemin + paramètres + ancre>&raison=acces|session` (sans paramètre depuis l'accueil) ; `safeRedirectPath` n'accepte qu'un chemin du site (refuse `//hôte`, `/\hôte`, URL complète, `javascript:`, et les pages `/login`, `/forgot-password`, `/reset-password`) en comparant l'origine après analyse par le navigateur ; indicateur « session terminée ».
- `src/components/RequireAuth.tsx` (nouveau) : garde unique de `/admin/*` (permission `DASHBOARD_ACCESS`, sinon `/forbidden`) et de `/membre/*` (MEMBER, ADMIN, SUPERADMIN, EDITOR, sinon `/adhesion`), redirections en `replace`. `ProtectedRoute.tsx` supprimé ; la garde de `LayoutMembre` (dans un `useEffect`, sans `replace`, page rendue un instant avant la redirection) retirée.
- `src/utils/axiosInstance.ts` : si le renouvellement de session est refusé (401, 403, 404) alors qu'un utilisateur est affiché, il est oublié et la garde renvoie vers `/login?…&raison=session` ; une coupure réseau ou une erreur serveur ne déconnecte personne. `authKeys` déplacé dans `src/service/authKeys.ts` (évite une dépendance circulaire avec `userService`, qui le réexporte).
- `src/pages/Authentication.tsx` : retour à la page demandée (`replace`), accueil par défaut ; bandeau « Connectez-vous pour accéder à cette page. » (vert) ou « Votre session a expiré. Reconnectez-vous pour continuer. » (ambre), `role="status"` ; déjà connecté → directement à la destination.
- Liens « Connexion » de la navbar, de la BottomNav et de la page Adhésion : emportent la page courante (D2).
- Vérifié (`p2.py`, serveur Vite local, API entièrement simulée) : **38/38**. Garde membre et admin (avec paramètres et ancre) puis retour exact ; bouton Retour après connexion → page précédente, pas `/login` ; 9 tentatives de redirection extérieure ou vers une page d'authentification → accueil ; déjà connecté → destination directe ; session expirée en naviguant dans l'espace membre → bandeau « session » → retour à la page ; liens navbar (ordinateur), BottomNav (390 px) et Adhésion ; accueil → `/login` sans paramètre ; déconnexion depuis l'espace membre → accueil sans passer par `/login` ; USER → `/adhesion`, MEMBER sur `/admin` → `/forbidden` ; renouvellement impossible faute de réseau → reste sur la page ; bandeau visible sans débordement à 320, 390, 768 et 1440 px. `tsc` : mêmes 4 erreurs connues.
- Pendant les essais : `/bourses` avec une réponse d'API de forme inattendue (fausse réponse de l'essai, sans `bourseSummaryDtos`) donne une **page blanche** — confirme le besoin de l'`ErrorBoundary` prévu dans P3b ; sans lien avec P2.
- Non vérifié : un vrai renouvellement de session refusé par le backend (simulé ici) ; il le sera en production par l'équipe.
- « commit et build » : étiquette par défaut `frontend-v1.12` (`docker-compose.yml`, `CLAUDE.md`) ; `CLAUDE.md` décrit la garde `RequireAuth`, `loginPath` et le traitement d'une session refusée. Commit `e977a39` (15 fichiers).
- Image `frontend-v1.12` construite depuis `e977a39` dans un `git worktree` propre, supprimé ensuite : `sha256:c91c27be1ca0a58746b5568857ce4fd7bb92d36b583b711e3f635e7c6d7d4ffe` ; précache de 115 entrées (1 896 Kio). `nginx -t` correct ; limite de débit de l'inscription (P1) toujours présente ; repli SPA de `/membre/profil` en `200`. Scénario `p2.py` rejoué **contre l'image** servie par Nginx (port 8112, API simulée par Playwright) : **38/38**, mêmes résultats qu'avec le serveur Vite.
- Publication (« publie et pousse ») : étiquette absente de Docker Hub avant l'envoi ; `docker push` ; empreinte sur Docker Hub identique à l'image vérifiée (`sha256:c91c27be…`, `linux/amd64`). Commits publiés sur `main` par avance rapide (`715dcb8..` ce commit).
- **Déploiement** (équipe, Portainer, stack `amamestack`) : `FRONTEND_IMAGE_TAG=frontend-v1.12`, le backend reste `backend-v1.5` ; aucune variable nouvelle. Retour arrière : `frontend-v1.11`.
- Reste pour P2 : contrôle en production par l'équipe (dont : deux onglets de l'espace membre, se déconnecter dans l'un, cliquer dans l'autre → « Votre session a expiré », puis retour à la page après reconnexion), puis `amamestack.env.example`.

**2026-11-20 — P2 en production : retour signalé comme absent, diagnostic.**

- Signalé par l'équipe après le déploiement : pas de retour à la page initiale après la reconnexion ; gestion d'erreur du tableau de bord inopérante (normal : P3b n'est pas encore livré), pages publiques correctes.
- Constaté en lecture seule : la production sert bien `frontend-v1.12` (script d'entrée `index-Bp-haN_h.js`, celui de l'image). Le scénario `p2.py` rejoué **contre la production** (API simulée par Playwright : aucune requête vers le backend ni la base) : **38/38**, retour à la page initiale compris. Le code déployé fonctionne.
- Cause la plus probable : le navigateur de l'équipe exécutait encore `frontend-v1.11`, servie par le service worker depuis son cache. `registerType: 'autoUpdate'` installe la nouvelle version en arrière-plan, mais rien ne recharge la page : la nouvelle version ne s'exécute qu'au chargement suivant. De plus, Nginx Proxy Manager (« Cache Assets ») sert `sw.js` et `registerSW.js` avec `Expires` à 00:30 GMT (`max-age` d'environ 11 h) ; d'après la configuration connue de NPM, il les garde aussi en cache environ 30 min, ce qui retarde la détection de la nouvelle version. Au moment du contrôle, `sw.js` en production était déjà celui de `frontend-v1.12`. Non reproduit en local : dans l'essai (profil Chromium persistant, `frontend-v1.11` puis `frontend-v1.12` sur le même port), le service worker n'a jamais pris le contrôle de la page.
- Proposé à l'équipe : recharger le site deux fois (ou fermer tous ses onglets) avant de retester ; à corriger ensuite (D9) : rechargement automatique quand une nouvelle version est active, et `sw.js` / `registerSW.js` exclus du cache de NPM (décision NPM déjà en attente, suivis 03 et 04).
- Retest de l'équipe après rechargement : **le retour à la page initiale fonctionne en production**. Cause confirmée : ancienne version servie depuis le cache du navigateur. D9 intégré à P3a. `deploy/portainer/amamestack.env.example` passé à `frontend-v1.12`.

**2026-11-20 — P3a : contrat d'erreur, formulaires publics, limite de débit, mise à jour automatique (D9).**

- **Backend.** `ApiError` gagne `code` (stable, `ApiErrorCode`) et `fieldErrors` (champ → message) ; `message` est toujours une phrase pour l'utilisateur. `GlobalHandlerException` réécrit : erreur imprévue → journalisée (`ERROR`, méthode, adresse, pile) avec une référence de 8 caractères, réponse « Une erreur inattendue est survenue. Réessayez dans quelques instants. (réf. XXXXXXXX) », plus aucun texte technique ; `ResponseStatusException` 5xx traitée de même ; nouveaux cas avec leur vrai code : contrainte de la base (409), fichier trop gros (413), JSON illisible, partie ou paramètre manquant, identifiant mal typé, type de contenu (400), méthode (405) ; validation → 400 `VALIDATION_FAILED` avec `fieldErrors` ; connexion fermée par le client → ni réponse ni erreur journalisée ; signature du gestionnaire `DataAccesException` corrigée. E-mail en double → `UserAlreadyExistsException.forEmail()` (409 `EMAIL_ALREADY_USED`, « Un compte existe déjà avec cet e-mail. ») dans l'inscription publique (`AdhesionService`) et dans la création par un administrateur (`UserService.register`, qui sortait en **500**).
- **Frontend.** `src/utils/apiError.ts` : `toUserError` / `userMessage` (réseau coupé, délai, 401, 403, 413, 429, 5xx, réponses HTML de Nginx ; message du serveur affiché pour une 4xx, ou une 500 au nouveau contrat seulement), `isEmailAlreadyUsed` (compatible avec l'ancien backend), `applyFieldErrors`. `src/components/FormAlert.tsx` : encadré `role="alert"` dans le formulaire. Page Adhésion : e-mail déjà utilisé → sous le champ, focus, « Cet e-mail est déjà utilisé. » puis « **Connectez-vous** ou saisissez une autre adresse. **Mot de passe oublié ?** » (e-mail prérempli sur les deux pages, retour à `/adhesion` après la connexion) ; autres erreurs dans l'encadré au-dessus du bouton, plus de toast d'erreur ; demande d'adhésion d'un connecté : erreur dans le formulaire. Connexion : « E-mail ou mot de passe incorrect. » seulement pour un vrai refus (401), sinon message réseau / panne / trop d'essais ; e-mail prérempli depuis Adhésion. Mot de passe oublié et réinitialisation : même traducteur.
- **Accessibilité, constaté et corrigé pendant les essais** : sur la page Adhésion, les deux champs mot de passe portaient `FormControl` sur leur conteneur (étiquette, `aria-invalid` et message d'erreur rattachés au conteneur, pas au champ) ; corrigé, bouton « œil » nommé (« Afficher / Masquer le mot de passe »). Texte des erreurs sous les champs (`FormMessage`, 28 usages) : `#ef4444` = 3,76:1 sur blanc, sous le minimum WCAG AA (4,5:1) → `red-700` (6,47:1), dans `components/ui/form.tsx`.
- **Nginx** (A1, reste) : `location = /api/auth/login` (zone `login`, 10/min, marge 20) et `location = /api/visitor/auth/forgot-password` (zone `password_reset`, 3/min, marge 3), réponse `429`.
- **D9.** `src/utils/appUpdate.ts`, appelé par `main.tsx` : au `controllerchange` d'une mise à jour (pas d'une première installation), rechargement immédiat si rien n'a été saisi, sinon au changement de page suivant (`App.tsx`) ; recherche d'une nouvelle version au retour sur l'onglet (lecture de `/sw.js`, ni API ni base) ; `vite:preloadError` (morceau de l'ancienne version introuvable) → un rechargement, pas deux en 10 s.
- **Vérifié.** Backend : compilation et `GlobalHandlerExceptionTest` (6 tests) + `EmailServiceTest` (3) : 0 échec. Frontend, serveur Vite, API simulée : `p3a.py` **40/40** (doublon sur ordinateur, téléphone et avec l'ancien backend ; liens et préremplissage ; message retiré quand l'adresse change ; 500 au nouveau contrat, 500 de l'ancien backend (texte technique masqué), 502 HTML, 429, réseau coupé ; validation du serveur sous le champ et reliée pour les lecteurs d'écran ; connexion à 1440 et 390 px ; mot de passe oublié ; demande d'adhésion) ; `d9.py` **5/5** (rechargement sans saisie ; saisie conservée puis nouvelle version au changement de page ; pas de rechargement à la première installation ; `vite:preloadError` une seule fois).
- **Limite de l'essai D9** : les signaux du navigateur (`controllerchange`, `vite:preloadError`) sont émis par le test ; le service worker lui-même n'a pas pu être exercé (dans le Chromium piloté, il reste à l'état « installing », alors que les 115 fichiers de sa liste répondent tous). La bascule réelle se vérifiera au prochain déploiement.
- Non-régression : `p2.py` rejoué après P3a, **38/38** (un premier passage interrompu pendant une modification de `form.tsx` : rechargement à chaud de Vite, sans lien avec le code).
- « commit et build » : étiquettes par défaut `backend-v1.6` et `frontend-v1.13` (`docker-compose.yml`, `CLAUDE.md`) ; `CLAUDE.md` décrit le contrat d'erreur (backend), `toUserError` / `FormAlert` (frontend) et `appUpdate.ts` (PWA). Commit `4c1aed2` (21 fichiers).
- Images construites depuis `4c1aed2` dans un `git worktree` propre, supprimé ensuite : `backend-v1.6` = `sha256:f941e1fc90cc636f743689e896b4e2560e3756d967afbf6e7e0e6acd7df4de23` ; `frontend-v1.13` = `sha256:64c1acc464b0d2b3ef0ddcf6425e322407a17cf2435212d3d080191c2691481c`, précache de 115 entrées (1 900 Kio).
- Contrôle des images. Jar : `ApiErrorCode` présent, référence dans le message 500, `forEmail` dans `UserService` et `AdhesionService`, nom complet de l'association toujours dans les e-mails (P1), aucune classe de test. Frontend : `nginx -t` correct ; textes d'erreur, `controllerchange` et `vite:preloadError` présents dans le bundle. Limites de débit, avec un faux backend qui refuse la connexion (`502` = requête transmise, `429` = refusée) : connexion 22 × `502` puis 2 × `429` sur 24 envois (la marge de 20 + 1, plus un jeton rendu pendant les ~6 s de l'envoi : 10/min) ; mot de passe oublié 4 × `502` puis 2 × `429` sur 6 ; inscription 6 × `502` puis 2 × `429` sur 8 ; liste des bourses non limitée. Scénarios rejoués **contre l'image** servie par Nginx (port 8115, API simulée par Playwright) : `p3a.py` **40/40**, `d9.py` **5/5**, `p2.py` **38/38**.
- Publication (« publie et pousse ») : étiquettes absentes de Docker Hub avant l'envoi ; `docker push` des deux images ; empreintes sur Docker Hub identiques aux images vérifiées (`sha256:f941e1fc…` et `sha256:64c1acc4…`, `linux/amd64`). Commits publiés sur `main` par avance rapide (`76ae2d8..` ce commit).
- **Déployé** le 20 novembre (confirmé par l'équipe ; Portainer, stack `amamestack` : `BACKEND_IMAGE_TAG=backend-v1.6`, `FRONTEND_IMAGE_TAG=frontend-v1.13`, aucune variable nouvelle). Le contrôle en production est fait par l'équipe. `deploy/portainer/amamestack.env.example` passé à `backend-v1.6` et `frontend-v1.13`. Retour arrière : `backend-v1.5`, `frontend-v1.12`. Le premier passage à `frontend-v1.13` s'est fait sans rechargement automatique (c'était l'ancienne version qui tournait) ; la bascule automatique (D9) se vérifiera au déploiement de `frontend-v1.14`.

**2026-11-20 — P3b : administration, espace membre, `ErrorBoundary`, C15.**

- **Constats de l'analyse** (en plus de la section 2.3) : dans les 12 listes de l'administration, une suppression refusée ne disait rien (`mutate` sans gestion d'erreur) et un chargement en échec affichait « Aucune donnée disponible » ; 7 formulaires (Article, Bourse, Concours, Filière, Galerie, Poste, Utilisateur) n'affichaient rien en cas d'échec et étaient **remplacés par un squelette pendant l'enregistrement** (le fichier choisi disparaissait de l'écran) ; **modifier un lien utile, un membre du bureau ou un partenaire plantait la page** (`.find` sur un objet page : les 3 erreurs `tsc` connues), et une ressource ou un établissement au-delà des 10 premiers s'ouvrait en **formulaire vide**, qu'un clic sur « Mettre à jour » aurait enregistré ; le panneau des permissions, s'il ne se chargeait pas, montrait tout décoché ; la page Cotisation montrait l'année « non payée » ; le tableau de bord, des 0 ; un élément introuvable donnait une erreur 500 « inattendue » (`RuntimeException("… non trouvé …")` dans 6 services).
- **Backend.** C15 : `@Transactional` retiré des 6 méthodes d'écriture d'`ArticleController` et `GalerieController` (le service, en `rollbackFor = Exception.class`, porte la transaction ; un envoi refusé par Bunny arrive maintenant au gestionnaire global, journalisé avec sa cause et une référence). `ArticleService.getArticleBySlug` passe en `@Transactional` (il écrit le compteur de vues ; il ne fonctionnait que grâce à l'annotation du contrôleur, gardée sur les lectures). `PermissionController` garde ses annotations : il fait lui-même le travail et ne reçoit aucun fichier. Élément introuvable → `RessourceNotFoundException` (404, « Cet article est introuvable : il a peut-être été supprimé. ») dans les services Article, Bourse, Concours, Filière, Galerie, Utilisateur ; messages des services Établissement, Lien utile, Membre du bureau, Partenaire, Ressource et Adhésion rendus lisibles (plus d'identifiant technique). Nouvelle `InvalidFieldException(champ, message)` → 400 `VALIDATION_FAILED` avec `fieldErrors` : « Mot de passe actuel incorrect. » arrive sous le champ. `GlobalHandlerExceptionTest` : 2 tests ajoutés (8).
- **Frontend, briques communes.** `ErrorBoundary` : page entière (`App.tsx`) ou contenu seul (layouts admin et membre, le menu reste utilisable) ; « Un problème est survenu », « Recharger la page », « Retour à l'accueil » ; titre ciblé au clavier ; erreur oubliée au changement de page ; morceau de page introuvable après un déploiement → un rechargement (`reloadOnce`, partagé avec `vite:preloadError`, qui ne dépend plus du service worker). `QueryError` : chargement impossible, message traduit, « Réessayer » (sauf refus de droits). `FormAlert` accepte une erreur complète (phrase + messages par champ, pour les formulaires sans react-hook-form). `ConfirmDialog` affiche l'erreur et reste ouvert ; `DataTable` attend la suppression (`mutateAsync`) et affiche l'échec du chargement ; `FormWrapper` : erreur près des boutons, squelette seulement pendant le chargement de l'élément (et sans boutons, pour ne jamais enregistrer un formulaire vide), erreur de chargement à la place du formulaire. Requêtes : plus de nouvel essai après un refus 4xx (l'erreur s'affiche tout de suite), 2 essais pour le réseau et les 5xx.
- **Frontend, pages.** 12 listes et Adhésions (approbation : toast avec la vraie raison ; rejet et suppression : erreur dans la fenêtre) ; 12 formulaires (dont `UserForm` : plus d'`alert()` du navigateur) ; Lien utile, Membre, Partenaire, Ressource, Établissement lus par leur identifiant (5 hooks `useGet…ById`) ; fiche utilisateur (chargement, suppression dans la fenêtre puis retour à la liste) ; panneau des permissions ; tableau de bord (« — » et bandeau) ; espace membre : Profil, Paramètres, Don (erreurs dans le formulaire, sous les champs), Cotisation, Activité, tableau de bord (chargement) ; `permissionService` (plus de « Request failed with status code 403 »), `userService` (plus de toast d'erreur en double), déconnexion. Texte des erreurs sous les champs de l'espace membre en `red-700` (contraste).
- **Vérifié.** Backend : compilation des sources et des tests (D7 : tests non lancés). Frontend : `tsc` **sans aucune erreur** (les 4 erreurs connues ont disparu : 3 corrigées par la lecture par identifiant, 1 dans `LayoutMembre` : `n.pathname` → `n.href`). `p3b.py` (serveur Vite, API simulée) **14/14** : liste en échec puis « Réessayer » ; suppression refusée dans la fenêtre puis réussie ; formulaire visible pendant l'envoi, erreur et message du champ ; élément à modifier introuvable (pas de formulaire vide) ; lien utile modifiable ; erreur d'affichage dans l'administration avec le menu, effacée au changement de rubrique ; page publique sans page blanche (390 px) ; mot de passe actuel incorrect sous le champ avec le focus ; cotisations ; tableau de bord. Non-régression : `d9.py` **5/5**, `p2.py` **38/38**, `p3a.py` **40/40** à deux passages (un premier à 39/40 : sur téléphone, champ e-mail à −10 px du haut de l'écran après le focus ; aux passages suivants 74 px puis 402 px : la page Adhésion se décale encore pendant le chargement de ses images, antérieur à P3b, à voir avec le design, suivi 04).
- **Ordre de déploiement** : les deux images ensemble (ou le frontend d'abord). `backend-v1.7` avec `frontend-v1.13` afficherait pour un mot de passe actuel incorrect « Certains champs sont invalides… » au lieu du message précis.
- Non couvert : les listes des pages publiques en échec de chargement (hors du périmètre de P3b ; l'`ErrorBoundary` évite déjà la page blanche) ; `Register.tsx` (A2, non routé).
- « commit et build » (sans rejouer les vérifications contre les images, à la demande de l'équipe) : étiquettes par défaut `backend-v1.7` et `frontend-v1.14` (`docker-compose.yml`, `CLAUDE.md`) ; `CLAUDE.md` complété (introuvable en 404, `InvalidFieldException`, pas de `@Transactional` sur un contrôleur qui délègue, `QueryError`, `DataTable` / `FormWrapper`, formulaire de modification lu par identifiant, `ErrorBoundary`). Après les essais, seule modification : espace insécable avant « ; » dans le texte de l'`ErrorBoundary`. Commit `bd3350c` (75 fichiers).
- Images construites depuis `bd3350c` dans un `git worktree` propre, supprimé ensuite : `backend-v1.7` = `sha256:8b16363f5303540b9868b2b8b891571bfc86f422d3056066d0e39fc7ab6bf9d5` (BUILD SUCCESS) ; `frontend-v1.14` = `sha256:9b6b8b18d343295fc0affbf4b2376ed6f279e4ca784dbc2581655ce9d6f39930`, précache de 116 entrées (1 911 Kio). **Non vérifié sur les images** (à la demande de l'équipe) : ni contrôle du jar et de Nginx, ni scénarios rejoués contre l'image ; les essais ont été faits sur le serveur de développement (voir plus haut).
- Publication : un premier essai de déploiement a échoué (`manifest for yayacode224/amame:backend-v1.7 not found`) : les images étaient construites mais pas encore envoyées. Étiquettes absentes de Docker Hub vérifiées, puis `docker push` (le frontend au second essai : coupure DNS passagère de Docker Desktop) ; empreintes sur Docker Hub identiques aux images construites (`sha256:8b16363f…`, `sha256:9b6b8b18…`, `linux/amd64`). La nouvelle adresse du pied de page (`352c38b`, commitée après la construction) n'est pas dans `frontend-v1.14` : elle entrera dans la prochaine image.
- **Déployé** le 20 novembre (confirmé par l'équipe ; Portainer, stack `amamestack` : `BACKEND_IMAGE_TAG=backend-v1.7`, `FRONTEND_IMAGE_TAG=frontend-v1.14`, aucune variable nouvelle). Le contrôle en production est fait par l'équipe. `deploy/portainer/amamestack.env.example` passé à `backend-v1.7` et `frontend-v1.14`. Retour arrière : `backend-v1.6`, `frontend-v1.13`. Bascule automatique (D9) : premier déploiement où elle pouvait se produire ; non constatée de mon côté (pas de contrôle en production), à confirmer par l'équipe.
- **Les trois points du rapport sont en production** (P1, P2, P3a, P3b). Restent, hors de ces points : nouvelle adresse du pied de page (`352c38b`, prochaine image frontend) ; listes des pages publiques en échec de chargement ; `Register.tsx` à supprimer (A2) ; A5, A6 et le décalage de la page Adhésion pendant le chargement des images sur téléphone (design, suivi 04) ; `sw.js` et `registerSW.js` à exclure du cache de Nginx Proxy Manager (action de l'équipe, D9).
