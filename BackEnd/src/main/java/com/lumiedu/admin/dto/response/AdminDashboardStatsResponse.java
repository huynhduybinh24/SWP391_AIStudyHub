package com.lumiedu.admin.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

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

    // === New fields for Admin Overview ===
    /** Number of users with an active paid subscription (PRO or ENTERPRISE) */
    private long premiumUsers;

    /** Daily new registration counts for the last 7 days (oldest first) */
    private List<Long> newRegistrationsLast7Days;

    /** Storage used by PDF files (MB) */
    private double pdfStorageMb;

    /** Storage used by Word/PowerPoint/Office files (MB) */
    private double officeStorageMb;

    /** Storage used by Spreadsheet files (MB) */
    private double spreadsheetStorageMb;

    /** Storage used by all other file types (MB) */
    private double otherStorageMb;
}
