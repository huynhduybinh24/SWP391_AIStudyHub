package com.lumiedu.billing.service;

import com.lumiedu.billing.config.StripeConfig;
import com.lumiedu.billing.dto.*;
import com.lumiedu.billing.entity.InstitutionalRequest;
import com.lumiedu.billing.entity.Payment;
import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.InstitutionalRequestStatus;
import com.lumiedu.billing.enums.PaymentMethod;
import com.lumiedu.billing.enums.PaymentStatus;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.InstitutionalRequestRepository;
import com.lumiedu.billing.repository.PaymentRepository;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.ApiResource;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final InstitutionalRequestRepository institutionalRequestRepository;
    private final UserRepository userRepository;
    private final StripeConfig stripeConfig;

    @org.springframework.beans.factory.annotation.Value("${stripe.bypass-checkout:false}")
    private boolean bypassCheckout;

    public List<SubscriptionPlanResponse> getActivePlans() {
        return subscriptionPlanRepository.findByActiveTrue().stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    public UpgradeEstimateResponse getUpgradeEstimate(Long userId, Long targetPlanId) {
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(targetPlanId)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found with id: " + targetPlanId));

        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(userId, SubscriptionStatus.ACTIVE);

        if (activeSubOpt.isEmpty()) {
            return UpgradeEstimateResponse.builder()
                    .currentPlanName("None (Free)")
                    .targetPlanName(targetPlan.getPlanName())
                    .targetPlanPrice(targetPlan.getPrice())
                    .remainingDays(0L)
                    .discountAmount(BigDecimal.ZERO)
                    .finalPrice(targetPlan.getPrice())
                    .isUpgradeAllowed(true)
                    .message("No active subscription, full price applies.")
                    .build();
        }

        UserSubscription activeSub = activeSubOpt.get();
        SubscriptionPlan currentPlan = activeSub.getSubscriptionPlan();

        // Check if target plan is actually an upgrade (higher price than current plan)
        if (targetPlan.getPrice().compareTo(currentPlan.getPrice()) <= 0) {
            return UpgradeEstimateResponse.builder()
                    .currentPlanName(currentPlan.getPlanName())
                    .targetPlanName(targetPlan.getPlanName())
                    .targetPlanPrice(targetPlan.getPrice())
                    .remainingDays(0L)
                    .discountAmount(BigDecimal.ZERO)
                    .finalPrice(targetPlan.getPrice())
                    .isUpgradeAllowed(false)
                    .message("Chỉ hỗ trợ nâng cấp lên gói có giá trị cao hơn!")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(activeSub.getEndDate())) {
            return UpgradeEstimateResponse.builder()
                    .currentPlanName(currentPlan.getPlanName())
                    .targetPlanName(targetPlan.getPlanName())
                    .targetPlanPrice(targetPlan.getPrice())
                    .remainingDays(0L)
                    .discountAmount(BigDecimal.ZERO)
                    .finalPrice(targetPlan.getPrice())
                    .isUpgradeAllowed(true)
                    .message("Current subscription has expired, full price applies.")
                    .build();
        }

        long remainingDays = ChronoUnit.DAYS.between(now, activeSub.getEndDate());
        if (remainingDays <= 0) {
            return UpgradeEstimateResponse.builder()
                    .currentPlanName(currentPlan.getPlanName())
                    .targetPlanName(targetPlan.getPlanName())
                    .targetPlanPrice(targetPlan.getPrice())
                    .remainingDays(0L)
                    .discountAmount(BigDecimal.ZERO)
                    .finalPrice(targetPlan.getPrice())
                    .isUpgradeAllowed(true)
                    .message("Less than a day remaining, full price applies.")
                    .build();
        }

        // Daily price of current plan
        BigDecimal dailyPrice = currentPlan.getPrice().divide(
                BigDecimal.valueOf(currentPlan.getDurationDays()),
                2,
                RoundingMode.HALF_UP
        );
        BigDecimal remainingValue = dailyPrice.multiply(BigDecimal.valueOf(remainingDays));

        // Deduct remaining value from the new plan price
        BigDecimal finalPrice = targetPlan.getPrice().subtract(remainingValue);
        if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
            finalPrice = BigDecimal.ZERO;
        }

        return UpgradeEstimateResponse.builder()
                .currentPlanName(currentPlan.getPlanName())
                .targetPlanName(targetPlan.getPlanName())
                .targetPlanPrice(targetPlan.getPrice())
                .remainingDays(remainingDays)
                .discountAmount(remainingValue)
                .finalPrice(finalPrice)
                .isUpgradeAllowed(true)
                .message("Upgrade estimate calculated successfully.")
                .build();
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Subscription plan not found with id: " + request.getPlanId()));

        // Calculate dynamic upgrade price if they have an active plan
        BigDecimal planPrice = plan.getPrice();
        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);

        if (activeSubOpt.isPresent()) {
            UpgradeEstimateResponse estimate = getUpgradeEstimate(user.getId(), plan.getId());
            if (!estimate.isUpgradeAllowed()) {
                throw new RuntimeException(estimate.getMessage());
            }
            planPrice = estimate.getFinalPrice();
        }

        UserSubscription userSubscription = UserSubscription.builder()
                .user(user)
                .subscriptionPlan(plan)
                .status(SubscriptionStatus.PENDING)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(plan.getDurationDays()))
                .autoRenew(false)
                .build();

        userSubscription = userSubscriptionRepository.save(userSubscription);

        String timestamp = String.valueOf(System.currentTimeMillis());
        String invoiceCode = "INV-" + timestamp;

        Payment payment = Payment.builder()
                .user(user)
                .userSubscription(userSubscription)
                .amount(planPrice)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .transactionCode("TXN-" + timestamp)
                .invoiceCode(invoiceCode)
                .build();

        payment = paymentRepository.save(payment);

        // Edge case: If upgraded price is 0 (due to large remaining credit or 0 price), bypass Stripe.
        if (planPrice.compareTo(BigDecimal.ZERO) <= 0) {
            userSubscription.setStatus(SubscriptionStatus.ACTIVE);
            userSubscriptionRepository.save(userSubscription);

            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionCode("FREE-UPGRADE-" + timestamp);
            payment.setPaymentGatewayResponse("COMPLETED_BYPASS_STRIPE");
            paymentRepository.save(payment);

            // Sync User storage limit
            user.setStorageLimitMb(plan.getStorageLimitMb());
            userRepository.save(user);

            // Mark old active plans as upgraded
            if (activeSubOpt.isPresent()) {
                UserSubscription oldSub = activeSubOpt.get();
                oldSub.setStatus(SubscriptionStatus.UPGRADED);
                userSubscriptionRepository.save(oldSub);
            }

            return CheckoutResponse.builder()
                    .paymentUrl("FREE_UPGRADE_SUCCESS")
                    .invoiceCode(invoiceCode)
                    .build();
        }

        if (bypassCheckout) {
            processSuccessfulPayment(invoiceCode, "MOCK_STRIPE_SESSION_" + timestamp);
            
            String successRedirectUrl = stripeConfig.getSuccessUrl()
                    .replace("{CHECKOUT_SESSION_ID}", "MOCK_STRIPE_SESSION_" + timestamp);
            
            return CheckoutResponse.builder()
                    .paymentUrl(successRedirectUrl)
                    .invoiceCode(invoiceCode)
                    .build();
        }

        try {
            System.out.println("DEBUG CHECKOUT - Starting Stripe Session creation");
            System.out.println("DEBUG CHECKOUT - API Key: " + com.stripe.Stripe.apiKey);
            System.out.println("DEBUG CHECKOUT - Success URL: " + stripeConfig.getSuccessUrl());
            System.out.println("DEBUG CHECKOUT - Cancel URL: " + stripeConfig.getCancelUrl());
            System.out.println("DEBUG CHECKOUT - Price: " + planPrice);

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(stripeConfig.getSuccessUrl())
                    .setCancelUrl(stripeConfig.getCancelUrl())
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("vnd")
                                    .setUnitAmount(planPrice.longValue())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(plan.getPlanName() + " (Nâng cấp)")
                                            .setDescription(plan.getDescription())
                                            .build())
                                    .build())
                            .build())
                    .putMetadata("userId", String.valueOf(user.getId()))
                    .putMetadata("planId", String.valueOf(plan.getId()))
                    .putMetadata("invoiceCode", invoiceCode)
                    .setClientReferenceId(invoiceCode)
                    .build();

            System.out.println("DEBUG CHECKOUT - Params built successfully");
            Session session = Session.create(params);
            System.out.println("DEBUG CHECKOUT - Session created successfully: " + session.getUrl());
            String paymentUrl = session.getUrl();

            return CheckoutResponse.builder()
                    .paymentUrl(paymentUrl)
                    .invoiceCode(invoiceCode)
                    .build();
        } catch (Exception e) {
            System.out.println("DEBUG CHECKOUT - Error occurred: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create Stripe Checkout Session: " + e.getMessage(), e);
        }
    }

    @Transactional


    public PaymentResponse getPaymentByInvoiceCode(String invoiceCode) {
        Payment payment = paymentRepository.findByInvoiceCode(invoiceCode)
                .orElseThrow(() -> new RuntimeException("Payment not found with invoice code: " + invoiceCode));
        return toPaymentResponse(payment);
    }

    @Transactional
    public InstitutionalRequestResponse submitInstitutionalRequest(InstitutionalRequestCreateRequest request) {
        InstitutionalRequest institutionalRequest = InstitutionalRequest.builder()
                .requesterName(request.getRequesterName())
                .requesterEmail(request.getRequesterEmail())
                .organizationName(request.getOrganizationName())
                .phoneNumber(request.getPhoneNumber())
                .expectedUsers(request.getExpectedUsers())
                .message(request.getMessage())
                .status(InstitutionalRequestStatus.PENDING)
                .build();

        institutionalRequest = institutionalRequestRepository.save(institutionalRequest);

        return toInstitutionalRequestResponse(institutionalRequest);
    }



    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .planType(plan.getPlanType())
                .price(plan.getPrice())
                .durationDays(plan.getDurationDays())
                .storageLimitMb(plan.getStorageLimitMb())
                .maxDocuments(plan.getMaxDocuments())
                .aiChatLimitPerDay(plan.getAiChatLimitPerDay())
                .quizLimitPerDay(plan.getQuizLimitPerDay())
                .description(plan.getDescription())
                .active(plan.getActive())
                .build();
    }

    private PaymentResponse toPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionCode(payment.getTransactionCode())
                .invoiceCode(payment.getInvoiceCode())
                .paidAt(payment.getPaidAt())
                .build();
    }

    private InstitutionalRequestResponse toInstitutionalRequestResponse(InstitutionalRequest request) {
        return InstitutionalRequestResponse.builder()
                .id(request.getId())
                .requesterName(request.getRequesterName())
                .requesterEmail(request.getRequesterEmail())
                .organizationName(request.getOrganizationName())
                .phoneNumber(request.getPhoneNumber())
                .expectedUsers(request.getExpectedUsers())
                .message(request.getMessage())
                .status(request.getStatus())
                .adminNote(request.getAdminNote())
                .createdAt(request.getCreatedAt())
                .build();
    }

    @Transactional
    public void handleStripeWebhook(String payload, String sigHeader) {
        String webhookSecret = stripeConfig.getWebhookSecret();
        Event event;

        try {
            if ("whsec_mock_key_for_now".equals(webhookSecret) || sigHeader == null) {
                event = ApiResource.GSON.fromJson(payload, Event.class);
            } else {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            }
        } catch (Exception e) {
            throw new RuntimeException("Webhook signature verification failed: " + e.getMessage());
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String invoiceCode = session.getMetadata() != null ? session.getMetadata().get("invoiceCode") : null;
                if (invoiceCode == null) {
                    invoiceCode = session.getClientReferenceId();
                }

                if (invoiceCode != null) {
                    processSuccessfulPayment(invoiceCode, session.getId());
                }
            }
        }
    }

    @Transactional
    public void processSuccessfulPayment(String invoiceCode, String stripeSessionId) {
        Payment payment = paymentRepository.findByInvoiceCode(invoiceCode)
                .orElseThrow(() -> new RuntimeException("Payment not found with invoice code: " + invoiceCode));

        UserSubscription subscription = payment.getUserSubscription();

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionCode("STRIPE-" + stripeSessionId);
        payment.setPaymentGatewayResponse("STRIPE_WEBHOOK_COMPLETED");
        paymentRepository.save(payment);

        if (subscription != null) {
            User user = subscription.getUser();
            SubscriptionPlan plan = subscription.getSubscriptionPlan();

            // 1. Mark existing ACTIVE subscriptions as UPGRADED
            List<UserSubscription> activeSubs = userSubscriptionRepository.findByUserId(user.getId());
            for (UserSubscription oldSub : activeSubs) {
                if (oldSub.getStatus() == SubscriptionStatus.ACTIVE && !oldSub.getId().equals(subscription.getId())) {
                    oldSub.setStatus(SubscriptionStatus.UPGRADED);
                    userSubscriptionRepository.save(oldSub);
                }
            }

            // 2. Activate new subscription
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartDate(LocalDateTime.now());
            subscription.setEndDate(LocalDateTime.now().plusDays(plan.getDurationDays()));
            userSubscriptionRepository.save(subscription);

            // 3. Sync User storage limit
            user.setStorageLimitMb(plan.getStorageLimitMb());
            userRepository.save(user);
        }
    }

    @Transactional
    public String verifyAndProcessStripeSession(String sessionId) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            throw new RuntimeException("Session ID cannot be empty");
        }

        // If it is a mock session from bypass mode, it has already been processed in checkout.
        if (sessionId.startsWith("MOCK_STRIPE_SESSION_")) {
            Payment payment = paymentRepository.findByTransactionCode("STRIPE-" + sessionId).orElse(null);
            if (payment != null && payment.getUserSubscription() != null) {
                return payment.getUserSubscription().getSubscriptionPlan().getPlanType().name();
            }
            return "PRO";
        }

        try {
            System.out.println("Verifying Stripe Session: " + sessionId);
            Session session = Session.retrieve(sessionId);
            if ("paid".equals(session.getPaymentStatus())) {
                String invoiceCode = session.getMetadata() != null ? session.getMetadata().get("invoiceCode") : null;
                if (invoiceCode == null) {
                    invoiceCode = session.getClientReferenceId();
                }
                if (invoiceCode != null) {
                    processSuccessfulPayment(invoiceCode, sessionId);
                    
                    Payment payment = paymentRepository.findByInvoiceCode(invoiceCode).orElse(null);
                    if (payment != null && payment.getUserSubscription() != null) {
                        return payment.getUserSubscription().getSubscriptionPlan().getPlanType().name();
                    }
                    return "PRO";
                } else {
                    throw new RuntimeException("Invoice code not found in session metadata");
                }
            } else {
                String invoiceCode = session.getMetadata() != null ? session.getMetadata().get("invoiceCode") : null;
                if (invoiceCode == null) {
                    invoiceCode = session.getClientReferenceId();
                }
                if (invoiceCode != null) {
                    Payment payment = paymentRepository.findByInvoiceCode(invoiceCode).orElse(null);
                    if (payment != null && payment.getPaymentStatus() == PaymentStatus.PENDING) {
                        payment.setPaymentStatus(PaymentStatus.FAILED);
                        paymentRepository.save(payment);
                    }
                }
                throw new RuntimeException("Session is not paid. Status: " + session.getPaymentStatus());
            }
        } catch (Exception e) {
            System.err.println("Stripe session verification failed: " + e.getMessage());
            throw new RuntimeException("Failed to verify Stripe session: " + e.getMessage(), e);
        }
    }
}
