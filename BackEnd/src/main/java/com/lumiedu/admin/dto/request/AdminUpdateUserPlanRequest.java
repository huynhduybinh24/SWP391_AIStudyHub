package com.lumiedu.admin.dto.request;

import com.lumiedu.billing.enums.PlanType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserPlanRequest {
    @NotNull(message = "Plan type cannot be null")
    private PlanType planType;
}
