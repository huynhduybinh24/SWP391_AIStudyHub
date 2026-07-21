package com.lumiedu;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class LumiEduApplicationTests {

    @Test
    void contextLoads() {
    }

    @Test
    void testStripeCheckoutDirectly() {
        try {
            com.stripe.Stripe.apiKey = "sk_test_51TeakuEnXkUB7pNOXwsD5YHPt10gSQqOQcr7vPjpyhapEjCW6QUVP4y2n1u0uLwnuFSZ3b3cJ82exJybWO5fUoaz00u706XYh4";
            com.stripe.param.checkout.SessionCreateParams params = com.stripe.param.checkout.SessionCreateParams.builder()
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:8386/success")
                    .setCancelUrl("http://localhost:8386/cancel")
                    .addLineItem(com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("vnd")
                                    .setUnitAmount(200000L)
                                    .setProductData(com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("Pro Plan")
                                            .setDescription("Billed monthly")
                                            .build())
                                    .build())
                            .build())
                    .build();
            com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(params);
            System.out.println("TEST STRIPE SESSION URL: " + session.getUrl());
        } catch (Exception e) {
            System.out.println("TEST STRIPE ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }


    @org.springframework.beans.factory.annotation.Autowired
    private com.lumiedu.billing.repository.UserSubscriptionRepository userSubscriptionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.lumiedu.billing.repository.PaymentRepository paymentRepository;

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testDatabaseState() {
        System.out.println("=== RECENT USER SUBSCRIPTIONS IN DATABASE ===");
        try {
            java.util.List<com.lumiedu.billing.entity.UserSubscription> subs = userSubscriptionRepository.findAll();
            int start = Math.max(0, subs.size() - 3);
            for (int i = start; i < subs.size(); i++) {
                com.lumiedu.billing.entity.UserSubscription sub = subs.get(i);
                System.out.println("Sub ID: " + sub.getId() + 
                                   ", User: " + sub.getUser().getEmail() + 
                                   ", Plan: " + sub.getSubscriptionPlan().getPlanName() + 
                                   ", Status: " + sub.getStatus() +
                                   ", Start: " + sub.getStartDate() +
                                   ", End: " + sub.getEndDate());
            }
        } catch (Exception e) {
            System.out.println("Error reading user_subscriptions: " + e.getMessage());
        }

        System.out.println("=== RECENT PAYMENTS IN DATABASE ===");
        try {
            java.util.List<com.lumiedu.billing.entity.Payment> pays = paymentRepository.findAll();
            int start = Math.max(0, pays.size() - 3);
            for (int i = start; i < pays.size(); i++) {
                com.lumiedu.billing.entity.Payment pay = pays.get(i);
                System.out.println("Payment ID: " + pay.getId() + 
                                   ", User: " + pay.getUser().getEmail() + 
                                   ", Amount: " + pay.getAmount() + 
                                   ", Status: " + pay.getPaymentStatus() + 
                                   ", Code: " + pay.getTransactionCode());
            }
        } catch (Exception e) {
            System.out.println("Error reading payments: " + e.getMessage());
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.lumiedu.user.repository.UserRepository userRepository;

    @Test
    @org.springframework.transaction.annotation.Transactional
    void testCheckBinhSub() {
        System.out.println("=== BINH USER SUBSCRIPTION STATUS ===");
        userRepository.findByEmail("huynhduybinh2k5@gmail.com").ifPresentOrElse(user -> {
            System.out.println("User ID: " + user.getId());
            System.out.println("User Email: " + user.getEmail());
            System.out.println("User Role: " + user.getRole());
            System.out.println("User Storage Limit: " + user.getStorageLimitMb());
            
            var subs = userSubscriptionRepository.findByUserId(user.getId());
            System.out.println("Subscriptions count: " + subs.size());
            for (var sub : subs) {
                String planName = sub.getSubscriptionPlan() != null ? sub.getSubscriptionPlan().getPlanName() : "NULL";
                String planType = sub.getSubscriptionPlan() != null && sub.getSubscriptionPlan().getPlanType() != null 
                        ? sub.getSubscriptionPlan().getPlanType().name() : "NULL";
                System.out.println("  Sub ID: " + sub.getId() +
                                   ", PlanName: " + planName +
                                   ", PlanType: " + planType +
                                   ", Status: " + sub.getStatus() +
                                   ", Start: " + sub.getStartDate() +
                                   ", End: " + sub.getEndDate());
            }
        }, () -> System.out.println("User huynhduybinh2k5@gmail.com not found!"));
    }



    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    void testPrintDocuments() {
        System.out.println("=== DOCUMENTS VIA JDBC ===");
        try {
            jdbcTemplate.query("SELECT id, title, file_name, file_url, added_by_id, deleted FROM documents", (rs, rowNum) -> {
                System.out.printf("Repository Doc ID: %d | Title: %s | FileName: %s | FileUrl: %s | AddedBy: %d | Deleted: %b\n",
                        rs.getLong("id"), rs.getString("title"), rs.getString("file_name"), rs.getString("file_url"), rs.getLong("added_by_id"), rs.getBoolean("deleted"));
                return null;
            });
        } catch (Exception e) {
            System.out.println("Error reading documents: " + e.getMessage());
        }

        System.out.println("=== WORKSPACES VIA JDBC ===");
        try {
            jdbcTemplate.query("SELECT id, name, owner_id FROM shared_workspaces", (rs, rowNum) -> {
                System.out.printf("Workspace ID: %d | Name: %s | Owner ID: %d\n",
                        rs.getLong("id"), rs.getString("name"), rs.getLong("owner_id"));
                return null;
            });
        } catch (Exception e) {
            System.out.println("Error reading workspaces: " + e.getMessage());
        }

        System.out.println("=== WORKSPACE DOCUMENTS VIA JDBC ===");
        try {
            jdbcTemplate.query("SELECT id, workspace_id, document_id FROM workspace_documents", (rs, rowNum) -> {
                System.out.printf("WS Doc ID: %d | Workspace ID: %d | Document ID: %d\n",
                        rs.getLong("id"), rs.getLong("workspace_id"), rs.getLong("document_id"));
                return null;
            });
        } catch (Exception e) {
            System.out.println("Error reading workspace documents: " + e.getMessage());
        }
    }

    @Test
    void cleanupTestAccounts() {
        System.out.println("=== DIAGNOSING & CLEANING UP TEST ACCOUNTS ===");
        
        System.out.println("--- USERS BEFORE CLEANUP ---");
        jdbcTemplate.query("SELECT id, email, full_name, role FROM users", (rs, rowNum) -> {
            System.out.printf("ID: %d | Email: %s | Name: %s | Role: %s\n",
                    rs.getLong("id"), rs.getString("email"), rs.getString("full_name"), rs.getString("role"));
            return null;
        });

        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        try {
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
            int deletedCount = jdbcTemplate.update("DELETE FROM users WHERE email LIKE 'test_%' OR email LIKE 'testuser_%' OR full_name LIKE 'Test User%'");
            
            System.out.println("=== CLEANUP SUCCESSFUL, deleted users count: " + deletedCount + " ===");
        } catch (Exception e) {
            System.err.println("Cleanup error: " + e.getMessage());
        } finally {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        }

        System.out.println("--- USERS AFTER CLEANUP ---");
        jdbcTemplate.query("SELECT id, email, full_name, role FROM users", (rs, rowNum) -> {
            System.out.printf("ID: %d | Email: %s | Name: %s | Role: %s\n",
                    rs.getLong("id"), rs.getString("email"), rs.getString("full_name"), rs.getString("role"));
            return null;
        });
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.lumiedu.admin.service.AdminDashboardService adminDashboardService;

    @Test
    void testAdminDashboardStatsResponse() {
        System.out.println("=== TESTING ADMIN DASHBOARD STATS RESPONSE ===");
        try {
            com.lumiedu.admin.dto.response.AdminDashboardStatsResponse response = adminDashboardService.getStats();
            System.out.println("Engagement Rate: " + response.getEngagementRate());
            System.out.println("Avg AI Response: " + response.getAvgAiResponseTime());
            System.out.println("Storage Efficiency: " + response.getStorageEfficiency());
            System.out.println("Pro Conversion Rate: " + response.getProConversionRate());
            System.out.println("Monthly Labels: " + response.getMonthlyTrafficLabels());
            System.out.println("Monthly Page Views: " + response.getMonthlyPageViews());
            System.out.println("Monthly AI Queries: " + response.getMonthlyAiQueries());
            System.out.println("AI Chat Interactions: " + response.getAiChatInteractions());
            System.out.println("File Storage Interactions: " + response.getFileStorageInteractions());
            System.out.println("Study Plan Interactions: " + response.getStudyPlanInteractions());
            System.out.println("Quiz Interactions: " + response.getQuizInteractions());
            System.out.println("Free Plan Users Count: " + response.getFreePlanUsersCount());
            System.out.println("Pro Plan Users Count: " + response.getProPlanUsersCount());
            System.out.println("Premium Plan Users Count: " + response.getPremiumPlanUsersCount());
            
            org.junit.jupiter.api.Assertions.assertNotNull(response);
            org.junit.jupiter.api.Assertions.assertTrue(response.getEngagementRate() >= 0.0);
            org.junit.jupiter.api.Assertions.assertTrue(response.getAvgAiResponseTime() > 0.0);
        } catch (Exception e) {
            System.out.println("Error testing stats: " + e.getMessage());
            e.printStackTrace();
            org.junit.jupiter.api.Assertions.fail(e);
        }
    }
}


