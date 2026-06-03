Bạn là Senior Spring Boot Architect. Hãy thiết lập cấu trúc dự án BackEnd Spring Boot chuẩn, sạch, dễ mở rộng cho hệ thống LumiEdu / AI Study Hub.

MỤC TIÊU CHÍNH:
Tôi muốn làm dự án theo hướng CODE FIRST, nhưng ở giai đoạn này CHỈ TẠO CẤU TRÚC DỰ ÁN trước để team có thể chia nhau code từng module nhỏ.

KHÔNG ĐƯỢC generate toàn bộ code nghiệp vụ ngay.
KHÔNG ĐƯỢC generate toàn bộ Entity chi tiết ngay.
KHÔNG ĐƯỢC generate toàn bộ Repository, Service, Controller chi tiết ngay.
KHÔNG ĐƯỢC tự tạo các class như AiChatMessage, Quiz, Flashcard, Document, Payment, Workspace... ở giai đoạn này.
Chỉ tạo project setup, package structure, BaseEntity dùng chung, file cấu hình, README hướng dẫn module.

CÔNG NGHỆ SỬ DỤNG:
- Java 21
- Spring Boot 3.3.0
- Maven
- MySQL
- Spring Data JPA / Hibernate
- Lombok
- Code First approach
- Root package: com.lumiedu
- Database name: lumiedu
- MySQL port: 3306
- MySQL username: root
- MySQL password: 12345
- Server port: 8080

QUAN TRỌNG:
Nếu trước đó đã generate quá nhiều file code ở các module như ai, document, workspace, storage, studyplan, billing, admin, notification thì hãy dọn lại.
Chỉ giữ lại:
- pom.xml
- application.properties
- LumiEduApplication.java
- common/entity/BaseEntity.java
- package/folder cho từng module
- README.md trong từng module

Hãy xóa hoặc revert các file Entity/Repository/Service/Controller đã tạo quá sớm, ví dụ:
- AiChatMessage.java
- AiChatSession.java
- Quiz.java
- QuizQuestion.java
- Flashcard.java
- FlashcardSet.java
- Document.java
- Payment.java
- Workspace*.java
- các Repository/Service/Controller chi tiết chưa cần thiết

Sau khi dọn xong, project phải compile được.

CẤU TRÚC THƯ MỤC CẦN TẠO:

BackEnd
├── pom.xml
├── README.md
├── src
│   └── main
│       ├── java
│       │   └── com
│       │       └── lumiedu
│       │           ├── LumiEduApplication.java
│       │           ├── common
│       │           │   ├── entity
│       │           │   │   └── BaseEntity.java
│       │           │   ├── exception
│       │           │   ├── response
│       │           │   ├── enums
│       │           │   └── README.md
│       │           ├── auth
│       │           │   └── README.md
│       │           ├── user
│       │           │   └── README.md
│       │           ├── notification
│       │           │   └── README.md
│       │           ├── document
│       │           │   └── README.md
│       │           ├── ai
│       │           │   └── README.md
│       │           ├── workspace
│       │           │   └── README.md
│       │           ├── storage
│       │           │   └── README.md
│       │           ├── studyplan
│       │           │   └── README.md
│       │           ├── billing
│       │           │   └── README.md
│       │           └── admin
│       │               └── README.md
│       └── resources
│           └── application.properties
└── src
    └── test
        └── java
            └── com
                └── lumiedu
                    └── LumiEduApplicationTests.java

YÊU CẦU FILE pom.xml:
Tạo pom.xml chuẩn Spring Boot 3.3.0.

Dependencies cần có:
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- mysql-connector-j
- lombok
- spring-boot-starter-test

Cấu hình Java version là 21.
Cấu hình Maven compile được.
Cấu hình Lombok annotation processor nếu cần.

YÊU CẦU FILE application.properties:
Tạo file tại:
src/main/resources/application.properties

Nội dung phải dùng đúng password MySQL của máy tôi là 12345:

spring.application.name=lumiedu

spring.datasource.url=jdbc:mysql://localhost:3306/lumiedu?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=12345

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.port=8080

Ghi chú:
- Database lumiedu đã được tạo rỗng trước trong MySQL.
- Vì dùng Code First nên Hibernate sẽ tự sinh bảng sau khi team code Entity.

YÊU CẦU FILE LumiEduApplication.java:
Tạo class main:

package com.lumiedu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LumiEduApplication {
    public static void main(String[] args) {
        SpringApplication.run(LumiEduApplication.class, args);
    }
}

YÊU CẦU FILE BaseEntity.java:
Tạo file:
src/main/java/com/lumiedu/common/entity/BaseEntity.java

Yêu cầu:
- Dùng @MappedSuperclass
- Có createdAt
- Có updatedAt
- Dùng LocalDateTime
- Dùng @PrePersist để set createdAt và updatedAt
- Dùng @PreUpdate để update updatedAt
- Dùng Lombok @Getter và @Setter

Code mẫu:

package com.lumiedu.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

README CHÍNH Ở BackEnd/README.md:
Tạo README.md mô tả dự án backend.

Nội dung cần có:

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

CREATE DATABASE lumiedu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

README TỪNG MODULE:

1. common/README.md
# Common Module

This module contains shared classes used by the whole backend.

Future contents:
- BaseEntity
- ApiResponse
- ErrorResponse
- GlobalExceptionHandler
- Custom exceptions
- Common enums
- Utility classes

2. user/README.md
# User Module

This module manages user profile and account information.

Future contents:
- User entity
- UserRole enum
- AccountStatus enum
- UserRepository
- UserService
- UserController
- DTOs for profile update and user response

Main features:
- View my profile
- Update profile details
- Change avatar
- Manage user role and account status

3. auth/README.md
# Auth Module

This module manages authentication and account security.

Future contents:
- Register
- Login
- Logout
- Forgot password
- Password reset token
- Change password
- Two-factor authentication
- Third-party account linking such as Google login

Future classes:
- AuthController
- AuthService
- PasswordResetToken
- ThirdPartyAccount
- ProviderType enum

4. document/README.md
# Document Module

This module manages personal learning documents.

Future contents:
- Document entity
- DocumentTag entity
- DocumentDownload entity
- AudioRecord entity
- DocumentRepository
- DocumentService
- DocumentController

Main features:
- Upload document file
- Upload media file
- Record audio
- View document list
- View document details and preview
- Edit document details
- Add or remove tags
- Download document
- Delete document
- Search and filter documents

5. ai/README.md
# AI Study Assistant Module

This module manages AI-powered study features.

Future contents:
- AI document summary
- AI chat session
- AI chat messages
- Flashcards
- Quiz
- Quiz attempts
- AI recommendations

Main features:
- Generate AI document summary
- Chat with AI about document
- Voice input for AI chat
- Search chat history
- Copy or regenerate AI response
- Select AI model mode
- Generate flashcards
- Review flashcards
- Generate quiz
- Complete quiz and view score
- View AI recommendations

6. notification/README.md
# Notification Module

This module manages personal and broadcast notifications.

Future contents:
- Notification entity
- BroadcastNotification entity
- NotificationType enum
- NotificationRepository
- NotificationService
- NotificationController

Main features:
- View notifications
- Mark notification as read
- Delete notification
- Admin broadcast notification

7. workspace/README.md
# Workspace Module

This module manages shared workspace and collaboration.

Future contents:
- SharedWorkspace entity
- WorkspaceMember entity
- WorkspaceDocument entity
- WorkspaceAiReport entity
- WorkspaceAccessType enum
- WorkspaceMemberRole enum

Main features:
- Create shared folder or workspace
- View shared folders list
- Invite members by email
- Set member permissions
- Update shared folder access
- Block download or print for viewers
- Import shared file to personal workspace
- View workspace AI report

8. storage/README.md
# Storage Module

This module manages cloud storage usage and analytics.

Future contents:
- StorageCleanupScan entity
- StorageAnalyticsSnapshot entity
- CleanupScanType enum
- StorageRepository
- StorageService
- StorageController

Main features:
- View cloud storage usage
- View storage analytics
- Run duplicate file cleanup
- Run large file cleanup

9. studyplan/README.md
# Study Plan Module

This module manages study plans and learning progress.

Future contents:
- StudyPlan entity
- StudyPlanItem entity
- StudyProgressLog entity
- StudyPlanStatus enum
- StudyPlanItemStatus enum

Main features:
- Create study plan
- View active and completed study plans
- Edit study plan
- View study progress dashboard

10. billing/README.md
# Billing Module

This module manages subscription and payment.

Future contents:
- SubscriptionPlan entity
- UserSubscription entity
- Payment entity
- InstitutionalRequest entity
- PaymentStatus enum
- SubscriptionStatus enum
- PaymentMethod enum

Main features:
- View pricing plans
- Checkout and upgrade to Pro
- Download invoice receipt
- Submit institutional plan request

11. admin/README.md
# Admin Module

This module manages administrative features.

Future contents:
- FlaggedDocument entity
- ActivityLog entity
- SystemSetting entity
- Admin controllers and services

Main features:
- View admin dashboard KPIs
- View user list
- View user details
- Lock or unlock user account
- Reset user password
- Update user role
- Delete user account
- View flagged documents
- Approve or reject flagged document
- Update package configuration
- Broadcast notification
- View activity logs
- Filter activity logs

SAU KHI TẠO XONG:
1. Chạy:
mvn clean compile

2. Nếu compile thành công, dừng lại.

3. Không tự động generate thêm module.

4. Không tự động tạo Entity, Repository, Service, Controller cho các module.

5. Chỉ khi tôi yêu cầu "Start Module 1" thì mới bắt đầu tạo code cho user/auth.

YÊU CẦU CUỐI CÙNG:
Hãy thực hiện đúng theo yêu cầu:
- Setup project Spring Boot chuẩn.
- Tạo cấu trúc module.
- Tạo README cho từng module.
- Tạo BaseEntity.
- Không generate code nghiệp vụ.
- Không generate entity chi tiết.
- Không generate repository/service/controller chi tiết.
- Đảm bảo project compile được.