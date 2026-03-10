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

ENV JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+UseContainerSupport -XX:MaxGCPauseMillis=200 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
