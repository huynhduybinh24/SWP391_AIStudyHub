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


    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
            jdbcTemplate.execute("UPDATE users SET role = 'USER' WHERE role IN ('STUDENT', 'INSTRUCTOR')");
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
                if (pwdHash != null && !pwdHash.startsWith("$2a$") && !pwdHash.startsWith("$2b$") && !pwdHash.startsWith("$2y$")) {
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
                    .fullName("LumiEdu User")
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
        } else {
            // Synchronize FREE plan
            subscriptionPlanRepository.findByPlanType(PlanType.FREE).ifPresent(freePlan -> {
                boolean updated = false;
                if (freePlan.getStorageLimitMb() != 1024L) {
                    freePlan.setStorageLimitMb(1024L);
                    updated = true;
                }
                if (freePlan.getAiChatLimitPerDay() == null || freePlan.getAiChatLimitPerDay() != 10) {
                    freePlan.setAiChatLimitPerDay(10);
                    updated = true;
                }
                if (updated) {
                    subscriptionPlanRepository.save(freePlan);
                    System.out.println("--- Sync: Updated Free Plan ---");
                }
            });

            // Synchronize PRO plan
            subscriptionPlanRepository.findByPlanType(PlanType.PRO).ifPresent(proPlan -> {
                boolean updated = false;
                if (proPlan.getPrice().compareTo(new BigDecimal("200000")) != 0) {
                    proPlan.setPrice(new BigDecimal("200000"));
                    updated = true;
                }
                if (proPlan.getStorageLimitMb() != 5120L) {
                    proPlan.setStorageLimitMb(5120L);
                    updated = true;
                }
                if (proPlan.getAiChatLimitPerDay() == null || proPlan.getAiChatLimitPerDay() != 50) {
                    proPlan.setAiChatLimitPerDay(50);
                    updated = true;
                }
                if (updated) {
                    subscriptionPlanRepository.save(proPlan);
                    System.out.println("--- Sync: Updated Pro Plan ---");
                }
            });

            // Synchronize ENTERPRISE/PREMIUM plan
            subscriptionPlanRepository.findByPlanType(PlanType.ENTERPRISE).ifPresent(enterprisePlan -> {
                boolean updated = false;
                if (enterprisePlan.getPrice().compareTo(new BigDecimal("300000")) != 0) {
                    enterprisePlan.setPrice(new BigDecimal("300000"));
                    updated = true;
                }
                if (enterprisePlan.getDurationDays() != 30) {
                    enterprisePlan.setDurationDays(30);
                    updated = true;
                }
                if (enterprisePlan.getStorageLimitMb() != 51200L) {
                    enterprisePlan.setStorageLimitMb(51200L);
                    updated = true;
                }
                if (enterprisePlan.getAiChatLimitPerDay() == null || enterprisePlan.getAiChatLimitPerDay() != 500) {
                    enterprisePlan.setAiChatLimitPerDay(500);
                    updated = true;
                }
                if (updated) {
                    subscriptionPlanRepository.save(enterprisePlan);
                    System.out.println("--- Sync: Updated Enterprise Plan ---");
                }
            });
        }

        // One-time targeted cleanup of mock data
        try {
            System.out.println("--- DB Cleanup: Removing seeded mock records ---");
            jdbcTemplate.update("DELETE FROM workspace_document WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM document_report WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM notification WHERE action_url = '/dashboard/shared-files/research-materials' OR action_url = '/dashboard/notifications/summary'");
            jdbcTemplate.update("DELETE FROM storage_analytics_snapshot");
            jdbcTemplate.update("DELETE FROM document_chunk WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM document_tag WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM quiz_question WHERE quiz_id IN (SELECT id FROM quiz WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'))");
            jdbcTemplate.update("DELETE FROM quiz WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM study_plan_documents WHERE study_plan_id IN (SELECT id FROM study_plans WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'))");
            jdbcTemplate.update("DELETE FROM study_plans WHERE document_id IN (SELECT id FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%')");
            jdbcTemplate.update("DELETE FROM document WHERE file_url LIKE '%storage.lumiedu.com%' OR file_url LIKE '%giao_trinh%' OR file_url LIKE '%slide_bai_giang%'");
            jdbcTemplate.update("UPDATE users SET storage_used_mb = 0");
        } catch (Exception e) {
            System.err.println("DB Cleanup failed: " + e.getMessage());
        }
    }
}
