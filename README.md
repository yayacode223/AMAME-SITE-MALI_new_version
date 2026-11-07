# AMAME-SITE-WEB

Plateforme web d'orientation educative (bourses, concours, etablissements, articles) composee de:
- un frontend React + Vite + TypeScript
- un backend Spring Boot + PostgreSQL
- des scripts Python de scraping

## Objectif du README
Ce document sert a:
- comprendre rapidement l'architecture
- lancer le projet en local (phase dev)
- exploiter/deployer le projet en production (phase prod)
- centraliser les commandes utiles de maintenance

## Stack technique
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Java 21, Spring Boot 3, Spring Security (JWT), JPA/Hibernate
- Base de donnees: PostgreSQL 15, schema versionne avec Flyway
- Scraping: Python 3.9, requests, BeautifulSoup, Playwright, pandas, psycopg2
- Conteneurisation: Docker + Docker Compose

## Structure du projet
```text
.
|-- frontend/      # application web (UI)
|-- backend/       # API REST + auth + metier
|-- scraper/       # scripts d'import/scraping
|-- docker-compose.yml
`-- README.md
```

## Architecture des services (Docker)
Le fichier `docker-compose.yml` (stack `amame`) definit l'application:
- `database`: PostgreSQL
- `backend`: API Spring Boot
- `frontend`: application servie par Nginx
- `pgadmin`: administration de la base, accessible sur `127.0.0.1` uniquement

La supervision (Prometheus, Grafana, postgres-exporter) a ete retiree de la stack pour le moment.

Le fichier `ops/docker-compose.yml` (stack `amame-ops`) definit l'exploitation:
- `backup`: sauvegardes planifiees de la base et des fichiers, tests de restauration
- `scraper`: conteneur en veille, pour lancer les scripts Python a la demande

Mode d'emploi de la stack d'exploitation: `ops/README.md`.

Port expose actuellement:
- Frontend: `80` (hote) -> `80` (conteneur)

Remarque:
- Le backend n'expose pas directement son port sur l'hote dans le compose actuel.
- La base n'expose pas son port non plus (accessible depuis le reseau Docker).

## Prerequis
- Git
- Docker Desktop (ou Docker Engine + Docker Compose)

Optionnel (si execution hors Docker):
- Node.js 22+
- Java 21
- Maven 3.9+
- Python 3.9+

## Phase DEV (developpement)

### 1) Cloner le projet
```bash
git clone <url-du-repo> AMAME-SITE-WEB
cd AMAME-SITE-WEB
```

### 2) Configurer les variables d'environnement
Copier `.env.example` en `.env` a la racine, puis remplir les valeurs. Ce fichier `.env` n'est jamais commite.

```bash
cp .env.example .env
```

Variables obligatoires pour `docker compose up`: `POSTGRES_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `PGADMIN_PASSWORD`. Le fichier `.env.example` explique chacune.

Premier administrateur: aucun compte par defaut n'est cree. Sur une base vide, renseigner `BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD` pour le premier demarrage, puis les retirer.

### 3) Lancer toute la plateforme avec Docker
```bash
docker compose up -d --build
```

### 4) Verifier l'etat des conteneurs
```bash
docker compose ps
```

### 5) Acceder a l'application
- Frontend: http://localhost

### Commandes utiles en dev
```bash
# voir les logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database

# arreter les services
docker compose down

# relancer avec rebuild
docker compose up -d --build
```

### Developpement hors Docker
Le backend et le frontend peuvent aussi tourner directement sur le poste (Windows compris), avec une base PostgreSQL locale.

```bash
# Backend: profil dev, base attendue sur localhost:5454 (amame_db, postgres/postgres)
cd backend
./mvnw spring-boot:run

# Frontend: http://localhost:3000, /api et /uploads sont relayes vers le backend local
cd frontend
npm ci
npm run dev
```

- Autre base: definir `DATABASE_URL` (URL JDBC), `DATABASE_USERNAME`, `DATABASE_PASSWORD`.
- Autre adresse de backend pour le frontend: `DEV_BACKEND_URL=http://...` avant `npm run dev`.
- Les fichiers uploades sont ecrits dans `backend/uploads/` (variable `UPLOAD_DIR` pour un autre dossier) et servis sous `/uploads/`.

## Schema de la base (Flyway)
Le schema appartient a Flyway. Hibernate ne le modifie plus (`ddl-auto=validate`): il verifie seulement, au demarrage, que le schema correspond aux entites.

- Migrations: `backend/src/main/resources/db/migration/V<n>__<description>.sql`, en SQL PostgreSQL standard.
- `V1__baseline.sql` decrit le schema existant. Il ne se modifie jamais.
- Base existante sans historique Flyway (la production): marquee "en V1" au premier demarrage, sans executer V1.
- Base vide (tests, nouveau poste): toutes les migrations sont executees.

Changer le modele:
1. modifier l'entite JPA;
2. ajouter le script `V<n+1>__<description>.sql` qui fait la meme chose en base;
3. lancer `./mvnw test`: le test de demarrage applique toutes les migrations sur un PostgreSQL vide et echoue si entites et schema divergent.

Base de developpement creee avant Flyway: si le backend refuse de demarrer sur une erreur de validation du schema, la base locale est en retard sur les entites. La supprimer et la recreer vide suffit: Flyway la reconstruit.

## Fichiers uploades et URL des medias
- La base ne stocke que la cle d'un fichier (`uploads/<dossier>/<uuid>.<ext>`), jamais une URL.
- Le backend calcule l'URL (`fileUrl`, `coverImageUrl`, `imageUrl`, `cvUrl`) a partir de `MEDIA_BASE_URL`. Vide: URL relatives `/uploads/...`.
- Le frontend n'ecrit aucun nom de domaine: il affiche l'URL recue, par `<MediaImage>` ou `mediaUrl()` (`frontend/src/utils/media.ts`).
- `MEDIA_BASE_URL` est lue au demarrage des conteneurs backend et frontend. La changer dans la stack puis mettre la stack a jour suffit: aucune image n'est a reconstruire.
- Le type d'un fichier envoye est verifie d'apres son contenu. Formats acceptes: JPEG, PNG, GIF, WebP, PDF, Word, Excel.

## Phase PROD (production)
Le projet est deja en production. Cette section formalise la procedure de deploiement et de maintenance.

### 1) Preparation serveur
- Installer Docker + Docker Compose
- Cloner le depot sur le serveur
- Creer les secrets d'environnement cote serveur (ne pas committer)

### 2) Variables obligatoires a securiser
A minima:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `FRONTEND` (URL du frontend de production)

Recommandations:
- utiliser des secrets longs et uniques
- restreindre les acces reseau (DB non exposee publiquement)
- activer sauvegardes regulieres du volume PostgreSQL

### 3) Lancement/maj en production
```bash
docker compose pull
docker compose up -d --build
```

### 4) Verification post-deploiement
```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
```

Checklist rapide:
- l'application est accessible
- les appels API repondent sans erreur 5xx
- authentification JWT operationnelle
- upload de fichiers fonctionnel

### 5) Rollback (approche simple)
- remettre les tags d'image precedents (`BACKEND_IMAGE_TAG`, `FRONTEND_IMAGE_TAG`) dans les variables de la stack
- mettre la stack a jour
- verifier logs + smoke tests

## Scraping (import de donnees)
Scripts disponibles dans `scraper/`:
- `scraping_site_web_mina7.py`
- `scraper_etablissement.py`
- `scraper_opportunity.py`

Les scripts lisent la connexion dans la variable d'environnement `DATABASE_URL`. Aucun identifiant n'est ecrit dans le code.

Execution locale (hors Docker) exemple:
```bash
cd scraper
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:<mot de passe>@localhost:5454/amame_db"
python scraper_etablissement.py
python scraper_opportunity.py
```

En production, les scripts se lancent depuis la console du conteneur `amame-scraper` (voir `ops/README.md`).

## Images statiques du site
Les images du site (heroes, illustrations) ne sont pas deposees a la main dans `public/`.

- Originaux: `frontend/image-sources/<groupe>/<nom>.png` (noms en minuscules, sans accent ni espace)
- Fichiers servis: `frontend/public/static/`, generes en WebP et en plusieurs largeurs
- Affichage: composant `<StaticImage name="<groupe>/<nom>" sizes="..." />`

Apres avoir ajoute ou remplace un original:
```bash
cd frontend
pip install Pillow
python scripts/optimize_images.py
```

Le script regenere `public/static/` et `src/generated/staticImages.ts`. Les deux se commitent.

## Tests et qualite
Backend (Docker doit tourner: le test de demarrage lance un PostgreSQL jetable avec Testcontainers):
```bash
cd backend
./mvnw test

# sans Docker: tout sauf le test de demarrage
./mvnw test -Dtest='!SiteAmameApplicationTests'
```

Frontend:
```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Points d'amelioration recommandes
- separer clairement `docker-compose.dev.yml` et `docker-compose.prod.yml`
- externaliser les secrets (Vault, variables CI/CD, ou gestionnaire de secrets)
- documenter une strategie de sauvegarde/restauration PostgreSQL

## Contact / Contribution
Pour toute intervention, creez une branche feature/fix et ouvrez une PR avec:
- contexte
- changements
- impacts dev/prod
- procedure de verification
