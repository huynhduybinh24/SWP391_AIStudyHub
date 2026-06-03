# LumiEdu BackEnd

This is the Spring Boot backend for LumiEdu / AI Study Hub.

## Technology Stack
- Java 21
- Spring Boot 3.3.0
- Maven
- MySQL
- Spring Data JPA / Hibernate
- Lombok
- Code First approach

## Database
Create an empty MySQL database before running the project:

```sql
CREATE DATABASE lumiedu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hibernate will generate tables from Entity classes later.

## Module Development Order
The team should develop modules step by step:

1. common
2. user
3. auth
4. document
5. ai
6. notification
7. workspace
8. storage
9. studyplan
10. billing
11. admin

## Team Rule
- Do not code all modules at once.
- Each member should work inside their assigned module.
- Avoid modifying other members' modules without discussion.
- Each module should contain its own entity, enum, repository, service, controller, dto folders when implementation starts.
- At this setup stage, modules only contain README.md placeholders.
