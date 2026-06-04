package com.lumiedu.billing.service;

import com.lumiedu.billing.config.MomoConfig;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final MomoConfig momoConfig;

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

        String paymentUrl = "http://localhost:8386/mock-momo-payment?orderId=" + invoiceCode + "&amount=" + plan.getPrice().longValue();

        return CheckoutResponse.builder()
                .paymentUrl(paymentUrl)
                .invoiceCode(invoiceCode)
                .build();
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

    private String generateMomoUrl(Payment payment) {
        String requestId = String.valueOf(System.currentTimeMillis());
        String orderId = payment.getInvoiceCode();
        long amount = payment.getAmount().longValue();
        String orderInfo = "Thanh toan don hang " + orderId;
        String redirectUrl = momoConfig.getRedirectUrl();
        String ipnUrl = momoConfig.getIpnUrl();
        String requestType = "captureWallet";
        String extraData = "";

        String rawSignature = "accessKey=" + momoConfig.getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momoConfig.getPartnerCode()
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = MomoConfig.hmacSha256(momoConfig.getSecretKey(), rawSignature);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("partnerCode", momoConfig.getPartnerCode());
        requestBody.put("partnerName", "LumiEdu");
        requestBody.put("storeId", "LumiEduStore");
        requestBody.put("requestId", requestId);
        requestBody.put("amount", amount);
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", redirectUrl);
        requestBody.put("ipnUrl", ipnUrl);
        requestBody.put("requestType", requestType);
        requestBody.put("extraData", extraData);
        requestBody.put("lang", "vi");
        requestBody.put("signature", signature);

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(momoConfig.getPayUrl(), requestBody, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object resultCodeObj = body.get("resultCode");
                int resultCode = -1;
                if (resultCodeObj instanceof Number) {
                    resultCode = ((Number) resultCodeObj).intValue();
                }
                if (resultCode == 0) {
                    return (String) body.get("payUrl");
                } else {
                    String message = (String) body.get("message");
                    throw new RuntimeException("MoMo creation failed: " + message);
                }
            } else {
                throw new RuntimeException("Failed to call MoMo API: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error communicating with MoMo gateway: " + e.getMessage(), e);
        }
    }

    @Transactional
    public PaymentResponse processMomoCallback(Map<String, String> queryParams) {
        if (!momoConfig.verifyCallback(queryParams)) {
            throw new RuntimeException("Invalid MoMo signature");
        }

        String invoiceCode = queryParams.get("orderId");
        Payment payment = paymentRepository.findByInvoiceCode(invoiceCode)
                .orElseThrow(() -> new RuntimeException("Payment not found with invoice code: " + invoiceCode));

        String resultCodeStr = queryParams.get("resultCode");
        int resultCode = resultCodeStr != null ? Integer.parseInt(resultCodeStr) : -1;
        String transId = queryParams.get("transId");

        UserSubscription subscription = payment.getUserSubscription();

        if (resultCode == 0) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionCode("MOMO-" + transId);
            payment.setPaymentGatewayResponse(queryParams.toString());

            if (subscription != null) {
                subscription.setStatus(SubscriptionStatus.ACTIVE);
                userSubscriptionRepository.save(subscription);
            }
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setPaymentGatewayResponse(queryParams.toString());

            if (subscription != null) {
                subscription.setStatus(SubscriptionStatus.CANCELLED);
                userSubscriptionRepository.save(subscription);
            }
        }

        payment = paymentRepository.save(payment);
        return toPaymentResponse(payment);
    }

    @Transactional
    public PaymentResponse processMomoCallbackMock(String invoiceCode) {
        Payment payment = paymentRepository.findByInvoiceCode(invoiceCode)
                .orElseThrow(() -> new RuntimeException("Payment not found with invoice code: " + invoiceCode));

        UserSubscription subscription = payment.getUserSubscription();

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionCode("MOCK-MOMO-" + System.currentTimeMillis());
        payment.setPaymentGatewayResponse("MOCK_SUCCESS_BYPASS");

        if (subscription != null) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            userSubscriptionRepository.save(subscription);
        }

        payment = paymentRepository.save(payment);
        return toPaymentResponse(payment);
    }
}
