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
# - Le tas est un pourcentage de la limite, jamais une valeur fixe : -Xmx2g dépassait la limite
#   et exposait à un arrêt brutal par le noyau (OOM kill).
# - 40 % et pas davantage : le hors-tas (métaspace, code, symboles, tampons) occupe environ
#   230 Mo à lui seul, alors que l'application n'utilise réellement que 50 Mo de tas.
# - Ramasse-miettes série : G1 ajoutait 55 Mo de mémoire native et amenait le total à 500 Mo ;
#   avec le ramasse-miettes série il est de 440 Mo. G1 ne se justifie qu'avec plusieurs Go de tas.
# Pour donner plus de mémoire au backend, relever la limite du conteneur : le pourcentage suit.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=40.0 -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -XX:+UseContainerSupport -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
