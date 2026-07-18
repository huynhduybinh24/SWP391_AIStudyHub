package com.lumiedu.admin.dto.request;

import com.lumiedu.billing.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateTransactionStatusRequest {
    @NotNull(message = "Payment status cannot be null")
    private PaymentStatus status;
}
