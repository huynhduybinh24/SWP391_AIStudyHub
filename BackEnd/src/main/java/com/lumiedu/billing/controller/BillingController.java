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

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(
            @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(billingService.checkout(request));
    }

    @GetMapping("/momo-callback")
    public void momoCallback(
            @RequestParam Map<String, String> queryParams,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        PaymentResponse paymentResponse = billingService.processMomoCallback(queryParams);
        String status = paymentResponse.getPaymentStatus().name();
        String redirectUrl = "http://localhost:8386/dashboard/upgrade?status=" + status.toLowerCase()
                + "&invoice=" + paymentResponse.getInvoiceCode();
        response.sendRedirect(redirectUrl);
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

    @GetMapping("/momo-callback-mock")
    public void momoCallbackMock(
            @RequestParam("orderId") String orderId,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        PaymentResponse paymentResponse = billingService.processMomoCallbackMock(orderId);
        String redirectUrl = "http://localhost:8386/dashboard/upgrade?status=success&invoice=" + orderId;
        response.sendRedirect(redirectUrl);
    }
}
