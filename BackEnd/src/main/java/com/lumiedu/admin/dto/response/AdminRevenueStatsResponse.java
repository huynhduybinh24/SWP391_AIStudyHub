package com.lumiedu.admin.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRevenueStatsResponse {
    private BigDecimal totalRevenue;
}
