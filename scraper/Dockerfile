# mon-projet-scraper/Dockerfile

# Utiliser une image Python officielle et légère
FROM python:3.9-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app
 
# Copier le fichier des dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Commande pour installer les navigateurs headless
RUN playwright install --with-deps chromium 
# '--with-deps' installe aussi les dépendances système nécessaires
# On spécifie 'chromium' pour ne pas télécharger les 3 navigateurs et garder l'image légère

# Copier tous les scripts .py dans le conteneur
COPY *.py ./

# La commande par défaut ne fait rien.
# On lancera le script que l'on veut manuellement.
CMD ["echo", "Conteneur de scraping prêt. Spécifiez un script à lancer."]