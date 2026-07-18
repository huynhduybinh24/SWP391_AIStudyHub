package com.lumiedu.admin.dto.response;

import com.lumiedu.billing.enums.PaymentMethod;
import com.lumiedu.billing.enums.PaymentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTransactionResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String targetPlan;
    private BigDecimal amount;
    private String currency;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String paymentGateway; // raw response or gateway identifier
    private LocalDateTime transactionDate;
    private String adminNote;
}
