package com.lumiedu.billing.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpgradeEstimateResponse {
    private String currentPlanName;
    private String targetPlanName;
    private BigDecimal targetPlanPrice;
    private Long remainingDays;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private boolean isUpgradeAllowed;
    private String message;
}
