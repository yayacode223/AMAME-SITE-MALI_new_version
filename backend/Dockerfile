# FROM maven:3.9-eclipse-temurin-21 AS builder
# WORKDIR /app
# COPY pom.xml .
# RUN mvn dependency:resolve
# COPY src ./src
# RUN mvn clean package -DskipTests

# FROM eclipse-temurin:21-jre-jammy
# WORKDIR /app
# COPY --from=builder /app/target/*.jar app.jar
# EXPOSE 8080
# ENTRYPOINT ["java", "-jar", "app.jar"]

FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:resolve

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# Réglages mémoire, mesurés sous charge dans un conteneur limité à 512 Mo (valeur du compose).
# Ce qui compte est la mémoire du CONTENEUR (docker stats, /sys/fs/cgroup/memory.stat), pas le
# total que la JVM déclare : il lui manque 40 à 100 Mo de mémoire native. Mesures du 5 octobre
# 2026, même charge (18 inscriptions avec un CV de 7 Mo, puis 24 lectures de ce CV) :
#   tas 40 %, sans les deux bornes ci-dessous : 505 Mo sur 512 ;
#   tas 40 %, avec elles                      : 447 Mo ;
#   tas 30 %, avec elles                      : 396 Mo, et le conteneur n'atteint jamais sa limite.
# - Le tas est un pourcentage de la limite, jamais une valeur fixe : -Xmx2g dépassait la limite
#   et exposait à un arrêt brutal par le noyau (OOM kill).
# - 30 % (environ 150 Mo) : l'application en occupe 50 après un ramassage complet. Le reste de la
#   limite va au hors-tas (métaspace, code compilé, symboles, threads), qui grossit avec le temps.
# - Ramasse-miettes série : G1 ajoute une cinquantaine de Mo de mémoire native et ne se justifie
#   qu'avec plusieurs Go de tas.
# - jdk.nio.maxCachedBufferSize : sans cette borne, chaque thread garde en réserve un tampon natif
#   aussi grand que sa plus grosse lecture ou écriture de fichier (jusqu'à 10 Mo par thread ici).
# - MALLOC_ARENA_MAX : l'allocateur natif crée sinon une zone par thread et ne rend pas la mémoire.
# Pour donner plus de mémoire au backend, relever la limite du conteneur : le pourcentage suit.
ENV MALLOC_ARENA_MAX=2
ENV JAVA_OPTS="-XX:MaxRAMPercentage=30.0 -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -XX:+UseContainerSupport -Djdk.nio.maxCachedBufferSize=262144 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
