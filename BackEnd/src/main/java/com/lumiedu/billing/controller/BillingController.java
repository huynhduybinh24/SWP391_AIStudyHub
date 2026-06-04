package com.lumiedu.billing.controller;

import com.lumiedu.billing.dto.*;
import com.lumiedu.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Billing module is running");
    }

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanResponse>> getActivePlans() {
        return ResponseEntity.ok(billingService.getActivePlans());
    }

    @GetMapping("/upgrade-estimate")
    public ResponseEntity<UpgradeEstimateResponse> getUpgradeEstimate(
            @RequestParam Long userId,
            @RequestParam Long targetPlanId) {
        return ResponseEntity.ok(billingService.getUpgradeEstimate(userId, targetPlanId));
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(
            @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(billingService.checkout(request));
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        billingService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/payments/invoice/{invoiceCode}")
    public ResponseEntity<PaymentResponse> getPaymentByInvoiceCode(@PathVariable String invoiceCode) {
        return ResponseEntity.ok(billingService.getPaymentByInvoiceCode(invoiceCode));
    }

    @PostMapping("/institutional-requests")
    public ResponseEntity<InstitutionalRequestResponse> submitInstitutionalRequest(
            @RequestBody InstitutionalRequestCreateRequest request) {
        return ResponseEntity.ok(billingService.submitInstitutionalRequest(request));
    }
}
