package com.lumiedu;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class LumiEduApplicationTests {

    @Test
    void contextLoads() {
    }

    @Test
    void testHash() {
        String key = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
        String data = "accessKey=klm05TvNBzhg7h7j&amount=200000";
        String hash = com.lumiedu.billing.config.MomoConfig.hmacSha256(key, data);
        System.out.println("TEST MOMO HASH RESULT: " + hash);
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
}
