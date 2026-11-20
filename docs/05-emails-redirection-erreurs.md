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
| P2. Retour après connexion | **en cours** (décidé : D2, D3) | `frontend-v1.12` | 2026-11-20 | |
| P3a. Erreurs : contrat + formulaires publics + limite de débit (A1) | décidé (D4, D5) ; après P2 | `backend-v1.6`, `frontend-v1.13` | | |
| P3b. Erreurs : autres formulaires | décidé (D5) ; après P3a | `frontend-v1.14` (+ `backend-v1.7`) | | |

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
