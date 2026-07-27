# Optimized Fast Dockerfile for Railway Java 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy compiled JAR artifact
COPY target/lumiedu-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Xmx384m -XX:+UseG1GC -Dserver.port=${PORT:-8080} -jar app.jar"]
