package com.lumiedu.billing.dto;

import com.lumiedu.billing.enums.PlanType;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanResponse {
    private Long id;
    private String planName;
    private PlanType planType;
    private BigDecimal price;
    private Integer durationDays;
    private Long storageLimitMb;
    private Integer maxDocuments;
    private Integer aiChatLimitPerDay;
    private Integer quizLimitPerDay;
    private String description;
    private Boolean active;
}
