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
import java.time.LocalDateTime;
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

    public List<SubscriptionPlanResponse> getActivePlans() {
        return subscriptionPlanRepository.findByActiveTrue().stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Subscription plan not found with id: " + request.getPlanId()));

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
                .amount(plan.getPrice())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .transactionCode("TXN-" + timestamp)
                .invoiceCode(invoiceCode)
                .build();

        payment = paymentRepository.save(payment);

        try {
            System.out.println("DEBUG CHECKOUT - Starting Stripe Session creation");
            System.out.println("DEBUG CHECKOUT - API Key: " + com.stripe.Stripe.apiKey);
            System.out.println("DEBUG CHECKOUT - Success URL: " + stripeConfig.getSuccessUrl());
            System.out.println("DEBUG CHECKOUT - Cancel URL: " + stripeConfig.getCancelUrl());
            System.out.println("DEBUG CHECKOUT - Price: " + plan.getPrice());

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(stripeConfig.getSuccessUrl())
                    .setCancelUrl(stripeConfig.getCancelUrl())
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency("vnd")
                                    .setUnitAmount(plan.getPrice().longValue())
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(plan.getPlanName())
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
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            userSubscriptionRepository.save(subscription);
        }
    }
}
