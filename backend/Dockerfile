FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=build /app/target/siteAmame-0.0.1-SNAPSHOT.jar app.jar

# NE PAS créer /app/uploads ici - ça sera monté via le volume
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]