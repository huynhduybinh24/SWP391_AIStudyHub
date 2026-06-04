package com.lumiedu.billing.dto;

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
public class PaymentResponse {
    private Long id;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionCode;
    private String invoiceCode;
    private LocalDateTime paidAt;
}
