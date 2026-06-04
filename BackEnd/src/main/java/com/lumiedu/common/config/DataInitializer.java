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
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Safe database migration for roles and payment methods
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
            jdbcTemplate.execute("UPDATE users SET role = 'USER' WHERE role IN ('STUDENT', 'INSTRUCTOR')");
            jdbcTemplate.execute("UPDATE users SET full_name = 'LumiEdu User' WHERE full_name = 'Student User'");
            jdbcTemplate.execute("UPDATE users SET full_name = 'LumiEdu User' WHERE full_name = 'Instructor User'");
            jdbcTemplate.execute("ALTER TABLE payments MODIFY COLUMN payment_method VARCHAR(50) NOT NULL");
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
                    .aiChatLimitPerDay(100)
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
                    .aiChatLimitPerDay(1000)
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
                if (updated) {
                    subscriptionPlanRepository.save(freePlan);
                    System.out.println("--- Sync: Updated Free Plan storage limit to 1024MB ---");
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
                if (updated) {
                    subscriptionPlanRepository.save(proPlan);
                    System.out.println("--- Sync: Updated Pro Plan to 200k VND and 5120MB ---");
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
                if (updated) {
                    subscriptionPlanRepository.save(enterprisePlan);
                    System.out.println("--- Sync: Updated Enterprise Plan to 300k VND, 30 days, and 51200MB ---");
                }
            });
        }
    }
}
