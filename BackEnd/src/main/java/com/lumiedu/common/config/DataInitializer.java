package com.lumiedu.common.config;

import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.notification.entity.Notification;
import com.lumiedu.notification.enums.NotificationType;
import com.lumiedu.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

import com.lumiedu.admin.repository.SystemTrafficRepository;
import com.lumiedu.admin.entity.SystemTraffic;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.lumiedu.document.repository.DocumentRepository documentRepository;
    private final com.lumiedu.storage.repository.StorageRepository storageRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.lumiedu.workspace.repository.SharedWorkspaceRepository sharedWorkspaceRepository;
    private final com.lumiedu.workspace.repository.WorkspaceMemberRepository workspaceMemberRepository;
    private final com.lumiedu.workspace.repository.WorkspaceDocumentRepository workspaceDocumentRepository;
    private final com.lumiedu.document.repository.DocumentReportRepository documentReportRepository;
    private final SystemTrafficRepository systemTrafficRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
            jdbcTemplate.execute("UPDATE users SET role = 'USER' WHERE role IN ('STUDENT', 'INSTRUCTOR')");
            jdbcTemplate.execute("UPDATE users SET full_name = 'Huỳnh Duy Bình' WHERE email = 'student@lumiedu.com'");
            jdbcTemplate.execute("UPDATE users SET full_name = 'LumiEdu User' WHERE full_name = 'Student User'");
            jdbcTemplate.execute("UPDATE users SET full_name = 'LumiEdu User' WHERE full_name = 'Instructor User'");
            jdbcTemplate.execute("ALTER TABLE payments MODIFY COLUMN payment_method VARCHAR(50) NOT NULL");
            jdbcTemplate.execute("ALTER TABLE user_subscriptions MODIFY COLUMN status VARCHAR(50) NOT NULL");
        } catch (Exception e) {
            System.err.println("Failed to run database migration: " + e.getMessage());
        }

        // Auto-hash any plaintext passwords in the database
        try {
            userRepository.findAll().forEach(user -> {
                String pwdHash = user.getPasswordHash();
                if (pwdHash != null && !pwdHash.startsWith("$2a$") && !pwdHash.startsWith("$2b$")
                        && !pwdHash.startsWith("$2y$")) {
                    user.setPasswordHash(passwordEncoder.encode(pwdHash));
                    userRepository.save(user);
                    System.out.println("Auto-hashed password for user: " + user.getEmail());
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to auto-hash plaintext passwords: " + e.getMessage());
        }

        if (userRepository.findByEmail("student@lumiedu.com").isEmpty()) {
            User student = User.builder()
                    .fullName("Huỳnh Duy Bình")
                    .email("student@lumiedu.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(UserRole.USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            userRepository.save(student);
            System.out.println("--- Seeded student@lumiedu.com successfully ---");
        }

        if (userRepository.findByEmail("instructor@lumiedu.com").isEmpty()) {
            User instructor = User.builder()
                    .fullName("LumiEdu User")
                    .email("instructor@lumiedu.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(UserRole.USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            userRepository.save(instructor);
            System.out.println("--- Seeded instructor@lumiedu.com successfully ---");
        }

        if (userRepository.findByEmail("admin@lumiedu.com").isEmpty()) {
            User admin = User.builder()
                    .fullName("Admin User")
                    .email("admin@lumiedu.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(UserRole.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .storageLimitMb(51200L)
                    .build();
            userRepository.save(admin);
            System.out.println("--- Seeded admin@lumiedu.com successfully ---");
        }

        if (userRepository.findByEmail("huynhduybinh242k5@gmail.com").isEmpty()) {
            User personalAdmin = User.builder()
                    .fullName("Duy Binh Admin")
                    .email("huynhduybinh242k5@gmail.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(UserRole.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .storageLimitMb(51200L)
                    .build();
            userRepository.save(personalAdmin);
            System.out.println("--- Seeded huynhduybinh242k5@gmail.com successfully ---");
        }

        if (userRepository.findByEmail("huynhduybinh242h5@gmail.com").isEmpty()) {
            User personalUser = User.builder()
                    .fullName("Duy Binh User")
                    .email("huynhduybinh242h5@gmail.com")
                    .passwordHash(passwordEncoder.encode("123456"))
                    .role(UserRole.USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .storageLimitMb(1024L)
                    .build();
            userRepository.save(personalUser);
            System.out.println("--- Seeded huynhduybinh242h5@gmail.com successfully ---");
        }

        if (subscriptionPlanRepository.count() == 0) {
            SubscriptionPlan freePlan = SubscriptionPlan.builder()
                    .planName("Free Plan")
                    .planType(PlanType.FREE)
                    .price(BigDecimal.ZERO)
                    .durationDays(30)
                    .storageLimitMb(1024L)
                    .maxDocuments(20)
                    .aiChatLimitPerDay(10)
                    .quizLimitPerDay(3)
                    .description("Gói miễn phí cho học sinh học tập cơ bản")
                    .active(true)
                    .build();

            SubscriptionPlan proPlan = SubscriptionPlan.builder()
                    .planName("Pro Plan")
                    .planType(PlanType.PRO)
                    .price(new BigDecimal("200000"))
                    .durationDays(30)
                    .storageLimitMb(5120L) // 5GB
                    .maxDocuments(200)
                    .aiChatLimitPerDay(50)
                    .quizLimitPerDay(30)
                    .description("Gói chuyên nghiệp nâng cao trải nghiệm AI")
                    .active(true)
                    .build();

            SubscriptionPlan enterprisePlan = SubscriptionPlan.builder()
                    .planName("Enterprise Plan")
                    .planType(PlanType.ENTERPRISE)
                    .price(new BigDecimal("300000"))
                    .durationDays(30)
                    .storageLimitMb(51200L) // 50GB
                    .maxDocuments(2000)
                    .aiChatLimitPerDay(500)
                    .quizLimitPerDay(300)
                    .description("Gói doanh nghiệp, tổ chức và nhà trường")
                    .active(true)
                    .build();

            subscriptionPlanRepository.saveAll(List.of(freePlan, proPlan, enterprisePlan));
            System.out.println("--- Seeded default subscription plans successfully ---");
        }

        // One-time targeted cleanup of mock data
        try {
            System.out.println("--- DB Cleanup: Removing seeded mock records ---");
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
            jdbcTemplate.update(
                    "DELETE FROM workspace_documents WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM document_reports WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM notifications WHERE action_url = '/dashboard/shared-files/research-materials' OR action_url = '/dashboard/notifications/summary'");
            jdbcTemplate.update("DELETE FROM storage_analytics_snapshots");
            jdbcTemplate.update(
                    "DELETE FROM document_chunks WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM document_tags WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM quiz_question WHERE quiz_id IN (SELECT id FROM quiz WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'))");
            jdbcTemplate.update(
                    "DELETE FROM quiz WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM study_plan_documents WHERE study_plan_id IN (SELECT id FROM study_plans WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'))");
            jdbcTemplate.update(
                    "DELETE FROM study_plans WHERE document_id IN (SELECT id FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update(
                    "DELETE FROM documents WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'");
            jdbcTemplate.update("UPDATE users SET storage_used_mb = 0");
            jdbcTemplate.update("UPDATE users SET storage_limit_mb = 1024 WHERE storage_limit_mb = 500");
            jdbcTemplate.update(
                    "UPDATE users SET storage_limit_mb = 51200 WHERE role = 'ADMIN' AND storage_limit_mb != 51200");

            // Delete only generated test accounts (whose emails start with test_ or testuser_ or whose full names start with Test User)
            String selectTestUsersSubquery = "SELECT id FROM users WHERE email LIKE 'test_%' OR email LIKE 'testuser_%' OR full_name LIKE 'Test User%'";
            jdbcTemplate.update("DELETE FROM workspace_members WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM shared_workspaces WHERE owner_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM ai_chat_sessions WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM quiz_attempt WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM ai_usage_logs WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM user_subscriptions WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM payments WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM notifications WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM documents WHERE user_id IN (" + selectTestUsersSubquery + ")");
            jdbcTemplate.update("DELETE FROM users WHERE email LIKE 'test_%' OR email LIKE 'testuser_%' OR full_name LIKE 'Test User%'");

            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        } catch (Exception e) {
            System.err.println("DB Cleanup failed: " + e.getMessage());
        }

        // Seed historical system traffic data if empty
        try {
            if (systemTrafficRepository.count() == 0) {
                java.time.LocalDate today = java.time.LocalDate.now();
                // We seed data for the last 5 months (not including the current month)
                for (int i = 5; i >= 1; i--) {
                    java.time.LocalDate checkMonth = today.minusMonths(i);
                    // Generate weekly page views for that month (e.g. 4 entries per month to look realistic)
                    for (int w = 1; w <= 4; w++) {
                        java.time.LocalDate trafficDate = checkMonth.withDayOfMonth(w * 7 - 3);
                        long seedViews = 80 + ((5 - i) * 35) + (w * 10) + (trafficDate.getDayOfMonth() % 5);
                        systemTrafficRepository.save(SystemTraffic.builder()
                                .trafficDate(trafficDate)
                                .pageViews(seedViews)
                                .build());
                    }
                }
                System.out.println("--- Seeded historical system traffic successfully ---");
            }
        } catch (Exception e) {
            System.err.println("Failed to seed historical traffic: " + e.getMessage());
        }
    }
}
