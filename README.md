# AMAME - Plateforme d'Orientation Éducative

## 📖 Description

**AMAME** est une application web full-stack conçue pour aider les étudiants à trouver des opportunités éducatives (établissements, bourses, concours). Elle se compose d'une API backend robuste développée avec **Spring Boot**, d'une interface utilisateur réactive construite avec **React**, et de scripts de scraping en **Python** pour l'agrégation de données.

L'ensemble de l'architecture est conteneurisé avec **Docker** et orchestré par **Docker Compose** pour garantir un environnement de développement et de déploiement cohérent et fiable.

### Technologies Utilisées
- **Frontend :** React (avec Vite), TypeScript, Axios, Tailwind CSS
- **Backend :** Java 21, Spring Boot 3, Spring Security (JWT), JPA/Hibernate
- **Base de Données :** PostgreSQL
- **Scraping :** Python, Playwright, BeautifulSoup, Pandas
- **Infrastructure :** Docker, Docker Compose, Caddy (Reverse Proxy)

---

## 🚀 Démarrage Rapide (Environnement de Développement)

Suivez ces étapes pour lancer l'application complète sur votre machine locale.

### Prérequis
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Docker Compose sur Linux)

### Installation

1.  **Cloner le dépôt :**
    ``` terminal bash 
    git clone https://github.com/yayacode223/AMAME-SITE-MALI.git AMAME-SITE-WEB
    cd AMAME-SITE-WEB
    ```

2.  **Configurer l'environnement :**
    Le projet utilise un fichier `.env` pour gérer les variables. Créez le vôtre à partir de l'exemple fourni.
    ``` terminal bash 
    cp .env.example .env
    ```
    *Les valeurs par défaut dans `.env.example` sont suffisantes pour démarrer en développement.*

3.  **Lancer l'application :**
    Cette commande va construire les images Docker (la première fois peut être longue) et démarrer tous les services de l'application web (Frontend, Backend, Base de Données, Reverse Proxy).
    ``` terminal bash 
    docker-compose up -d 
    ```
    *Pour vérifier que tout a bien démarré, utilisez la commande `docker-compose ps`. Tous les services devraient avoir le statut `Up` ou `healthy`.*

### Accès à l'Application
- **Site Web :** Ouvrez votre navigateur et allez sur **[http://localhost:8081](http://localhost:8081)** (ou le port que vous avez configuré dans le fichier `.env`).
- **Base de Données (via un client SQL comme DBeaver) :**
  - **Host :** `localhost`
  - **Port :** `5433` (configurable dans `.env`)
  - **Database :** `amame_db`
  - **User :** `postgres`
  - **Password :** `postgres`

---

## 🛠️ Commandes Utiles au Quotidien

- **Arrêter tous les services :**
  ``` terminal bash 
  docker-compose down

# Voir les logs d'un service en temps réel (ex: backend) :
# docker-compose logs -f backend
# Reconstruire les images après une modification du code :
# Arrêter l'environnement avant de reconstruire
docker-compose down

# Reconstruire et redémarrer
docker-compose up -d --build


# Scripts de Scraping
# Les scripts Python permettent de peupler la base de données. Ils sont définis dans un profil Docker tools pour être lancés à la demande.
# Important : Assurez-vous que l'application principale est en cours d'exécution (docker-compose up -d) avant de lancer un scraper


# Lancer le scraper d'établissements :

docker-compose --profile tools run --rm scraper-etablissement python scraper_etablissement.py

# Lancer le scraper d'opportunités :
docker-compose --profile tools run --rm scraper-opportunity python scraper_opportunity.py


# Déploiement en Production (Exemple sur un VPS)
# Le déploiement en production est similaire au lancement en développement.
# Préparation du Serveur :
# Connectez-vous à votre VPS.
# Installez Git, Docker, et Docker Compose.
# Installation de l'Application :
# Clonez le dépôt sur le serveur.
# Créez le fichier .env à partir de .env.example.
# IMPORTANT : Modifiez le fichier .env et remplacez les valeurs par défaut par des secrets de production robustes (notamment POSTGRES_PASSWORD). Changez les ports CADDY_HTTP_PORT à 80 et DATABASE_PORT à 5432 pour une configuration standard.
# Ouvrez le fichier Caddyfile.
# Remplacez http://localhost par votre vrai nom de domaine (ex: www.votredomaine.com). Caddy gérera automatiquement le certificat HTTPS pour vous.
# Lancement :
# Assurez-vous d'être dans le dossier du projet sur le serveur
docker-compose up -d --build

# Votre application sera alors accessible et sécurisée sur https://www.votredomaine.com.