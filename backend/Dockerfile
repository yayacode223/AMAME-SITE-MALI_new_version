# Dockerfile pour Spring Boot

# --- Phase 1: Build ---
# On utilise une image contenant Maven et le JDK pour compiler notre application
# Nouvelle ligne :
FROM maven:3.9.6-eclipse-temurin-21 AS build

# On définit le répertoire de travail
WORKDIR /app

# On copie d'abord les fichiers de dépendances pour profiter du cache Docker
COPY pom.xml .
RUN mvn dependency:go-offline

# On copie le reste du code source
COPY src ./src

# On compile l'application et on crée le fichier .jar exécutable
RUN mvn package -DskipTests

# --- Phase 2: Run ---
# On utilise une image beaucoup plus légère contenant uniquement l'environnement d'exécution Java (JRE)
#FROM openjdk:17-jre-slim
# Nouvelle ligne :
# Nouvelle ligne :
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Ajoutez curl pour les healthchecks
RUN apk add --no-cache wget
# On copie uniquement le .jar compilé depuis la phase de build
# Assurez-vous que le nom du .jar correspond à celui généré par Maven
COPY --from=build /app/target/siteAmame-0.0.1-SNAPSHOT.jar app.jar

# On expose le port sur lequel l'application Spring Boot tourne (par défaut 8080)
EXPOSE 8080

# La commande pour lancer l'application au démarrage du conteneur
ENTRYPOINT ["java", "-jar", "app.jar"]
