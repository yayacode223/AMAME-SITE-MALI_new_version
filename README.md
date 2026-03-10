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
Le fichier `docker-compose.yml` definit 4 services:
- `database`: PostgreSQL
- `backend`: API Spring Boot
- `frontend`: application servie par Nginx
- `scraper`: service ponctuel pour executer les scripts Python

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
Il n'y a pas de fichier `.env.example` versionne actuellement.

Les variables importantes pour le backend sont:
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `FRONTEND`

Exemple minimal PowerShell:
```powershell
$env:JWT_SECRET="change-me"
$env:JWT_EXPIRATION="2592000000"
$env:FRONTEND="http://localhost"
```

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

Attention:
- les scripts actuels pointent par defaut vers PostgreSQL en `localhost:5454`
- adapter `DB_CONFIG` avant execution selon votre environnement

Execution locale (hors Docker) exemple:
```bash
cd scraper
pip install -r requirements.txt
python scraper_etablissement.py
python scraper_opportunity.py
```

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
- ajouter un vrai `.env.example` a la racine
- separer clairement `docker-compose.dev.yml` et `docker-compose.prod.yml`
- externaliser les secrets (Vault, variables CI/CD, ou gestionnaire de secrets)
- documenter une strategie de sauvegarde/restauration PostgreSQL

## Contact / Contribution
Pour toute intervention, creez une branche feature/fix et ouvrez une PR avec:
- contexte
- changements
- impacts dev/prod
- procedure de verification
