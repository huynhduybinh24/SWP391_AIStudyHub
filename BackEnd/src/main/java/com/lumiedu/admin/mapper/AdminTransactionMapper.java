package com.lumiedu.admin.mapper;

import com.lumiedu.admin.dto.response.AdminTransactionResponse;
import com.lumiedu.billing.entity.Payment;

public class AdminTransactionMapper {

    public static AdminTransactionResponse toResponse(Payment payment) {
        if (payment == null) {
            return null;
        }
        String targetPlan = null;
        if (payment.getUserSubscription() != null && payment.getUserSubscription().getSubscriptionPlan() != null) {
            targetPlan = payment.getUserSubscription().getSubscriptionPlan().getPlanName();
        }
        return AdminTransactionResponse.builder()
                .id(payment.getId())
                .userId(payment.getUser() != null ? payment.getUser().getId() : null)
                .userEmail(payment.getUser() != null ? payment.getUser().getEmail() : null)
                .targetPlan(targetPlan)
                .amount(payment.getAmount())
                .currency("VND")
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getPaymentStatus())
                .paymentGateway(payment.getTransactionCode())
                .transactionDate(payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt())
                .adminNote(payment.getInvoiceCode())
                .build();
    }
}
