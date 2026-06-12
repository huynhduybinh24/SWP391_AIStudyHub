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
}
