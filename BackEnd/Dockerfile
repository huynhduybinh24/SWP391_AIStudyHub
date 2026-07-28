# Stage 1: Build Java 21 Spring Boot App
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run Spring Boot Application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/lumiedu-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-XX:+UseG1GC", "-Dserver.port=8080", "-jar", "app.jar"]
