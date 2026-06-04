package com.lumiedu.billing.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutResponse {
    private String paymentUrl;
    private String invoiceCode;
}
