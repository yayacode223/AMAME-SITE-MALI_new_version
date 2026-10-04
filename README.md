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
- Base de donnees: PostgreSQL 15
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
- `pgadmin`, `prometheus`, `grafana`, `postgres-exporter`: outils, accessibles sur `127.0.0.1` uniquement

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

Variables obligatoires pour `docker compose up`: `POSTGRES_PASSWORD`, `JWT_SECRET`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `PGADMIN_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`. Le fichier `.env.example` explique chacune.

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
- revenir au commit precedent stable
- relancer `docker compose up -d --build`
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
Backend:
```bash
cd backend
./mvnw test
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
