package com.lumiedu.billing.dto;

import com.lumiedu.billing.enums.PaymentMethod;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    private Long userId;
    private Long planId;
    private PaymentMethod paymentMethod;
}
