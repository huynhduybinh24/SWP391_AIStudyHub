package com.lumiedu.common.config;

import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
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

        if (userRepository.count() == 0) {
            User student = User.builder()
                    .fullName("LumiEdu User")
                    .email("student@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();

            User instructor = User.builder()
                    .fullName("LumiEdu User")
                    .email("instructor@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.USER)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();

            User admin = User.builder()
                    .fullName("Admin User")
                    .email("admin@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .storageLimitMb(51200L)
                    .build();

            userRepository.saveAll(List.of(student, instructor, admin));
            System.out.println("--- Seeded sample users successfully ---");
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

        userRepository.findByEmail("student@lumiedu.com").ifPresent(student -> {
            if (documentRepository.count() == 0) {
                com.lumiedu.document.entity.Document doc1 = com.lumiedu.document.entity.Document.builder()
                        .title("Lecture_Notes_Week1.pdf")
                        .fileSize(4718592L) // 4.5 MB
                        .fileUrl("https://storage.lumiedu.com/files/lecture_notes_week1.pdf")
                        .fileType("PDF")
                        .checksum("5d41402abc4b2a76b9719d911017c592")
                        .user(student)
                        .build();

                com.lumiedu.document.entity.Document doc2 = com.lumiedu.document.entity.Document.builder()
                        .title("Lecture_Notes_Week1_Backup.pdf")
                        .fileSize(4718592L) // 4.5 MB (Duplicate checksum!)
                        .fileUrl("https://storage.lumiedu.com/files/lecture_notes_week1_backup.pdf")
                        .fileType("PDF")
                        .checksum("5d41402abc4b2a76b9719d911017c592")
                        .user(student)
                        .build();

                com.lumiedu.document.entity.Document doc3 = com.lumiedu.document.entity.Document.builder()
                        .title("Course_Intro_Video.mp4")
                        .fileSize(15728640L) // 15 MB (Large file!)
                        .fileUrl("https://storage.lumiedu.com/files/course_intro_video.mp4")
                        .fileType("VIDEO")
                        .checksum("7d41402abc4b2a76b9719d911017c593")
                        .user(student)
                        .build();

                com.lumiedu.document.entity.Document doc4 = com.lumiedu.document.entity.Document.builder()
                        .title("Meeting_Audio_Record.mp3")
                        .fileSize(2097152L) // 2 MB
                        .fileUrl("https://storage.lumiedu.com/files/meeting_audio_record.mp3")
                        .fileType("AUDIO")
                        .checksum("8d41402abc4b2a76b9719d911017c594")
                        .user(student)
                        .build();

                com.lumiedu.document.entity.Document doc5 = com.lumiedu.document.entity.Document.builder()
                        .title("Profile_Picture.png")
                        .fileSize(1048576L) // 1 MB
                        .fileUrl("https://storage.lumiedu.com/files/profile_picture.png")
                        .fileType("IMAGE")
                        .checksum("9d41402abc4b2a76b9719d911017c595")
                        .user(student)
                        .build();

                documentRepository.saveAll(java.util.List.of(doc1, doc2, doc3, doc4, doc5));

                long totalBytes = doc1.getFileSize() + doc2.getFileSize() + doc3.getFileSize() + doc4.getFileSize() + doc5.getFileSize();
                long totalMb = Math.round((double) totalBytes / (1024.0 * 1024.0));
                student.setStorageUsedMb(totalMb);
                userRepository.save(student);
                System.out.println("--- Seeded sample documents for student user successfully ---");
            }

            if (storageRepository.count() == 0) {
                java.time.LocalDate today = java.time.LocalDate.now();
                com.lumiedu.storage.entity.StorageAnalyticsSnapshot snap1 = com.lumiedu.storage.entity.StorageAnalyticsSnapshot.builder()
                        .user(student)
                        .totalUsedMb(10.0)
                        .limitMb(1024.0)
                        .fileCount(3)
                        .documentCount(2)
                        .mediaCount(1)
                        .otherCount(0)
                        .snapshotDate(today.minusDays(2))
                        .build();

                com.lumiedu.storage.entity.StorageAnalyticsSnapshot snap2 = com.lumiedu.storage.entity.StorageAnalyticsSnapshot.builder()
                        .user(student)
                        .totalUsedMb(18.0)
                        .limitMb(1024.0)
                        .fileCount(4)
                        .documentCount(2)
                        .mediaCount(2)
                        .otherCount(0)
                        .snapshotDate(today.minusDays(1))
                        .build();

                storageRepository.saveAll(java.util.List.of(snap1, snap2));
                System.out.println("--- Seeded default storage snapshots successfully ---");
            }
        });
    }
}
