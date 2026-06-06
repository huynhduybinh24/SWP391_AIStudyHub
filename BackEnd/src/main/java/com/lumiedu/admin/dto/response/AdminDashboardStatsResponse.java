package com.lumiedu.admin.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsResponse {
    private long totalUsers;
    private long totalAdmins;
    private long totalDocuments;
    private long totalNotifications;
    private double totalStorageUsed; // MB
    private long totalTransactions;
    private BigDecimal totalRevenue;
    private long pendingTransactions;
    private long unreadNotifications;
    private long rejectedDocuments;
    private long pendingDocuments;
}
