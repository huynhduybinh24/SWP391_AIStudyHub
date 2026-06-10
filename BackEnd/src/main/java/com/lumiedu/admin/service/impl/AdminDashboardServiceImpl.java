package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.response.AdminDashboardStatsResponse;
import com.lumiedu.admin.service.AdminDashboardService;
import com.lumiedu.billing.entity.Payment;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PaymentStatus;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.PaymentRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.notification.repository.NotificationRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationRepository notificationRepository;
    private final PaymentRepository paymentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Override
    public AdminDashboardStatsResponse getStats() {
        // --- Basic counts ---
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.findByRole(UserRole.ADMIN).size();
        long totalDocuments = documentRepository.count();
        long totalNotifications = notificationRepository.count();

        // --- Total storage across all users ---
        double totalStorageUsed = userRepository.findAll().stream()
                .filter(u -> u.getStorageUsedMb() != null)
                .mapToDouble(User::getStorageUsedMb)
                .sum();

        // --- Payment stats ---
        List<Payment> payments = paymentRepository.findAll();
        long totalTransactions = payments.size();
        BigDecimal totalRevenue = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pendingTransactions = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING)
                .count();

        // --- Notification stats ---
        long unreadNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getIsRead() != null && !n.getIsRead() && n.getDeleted() != null && !n.getDeleted())
                .count();

        // --- Document moderation stats ---
        long rejectedDocuments = documentRepository.countByModerationStatusAndDeletedFalse(DocumentStatus.REJECTED);
        long pendingDocuments = documentRepository.countByModerationStatusAndDeletedFalse(DocumentStatus.PENDING);

        // --- Premium users: active subscriptions with paid plans ---
        long premiumUsers = userSubscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE
                        && s.getSubscriptionPlan() != null
                        && s.getSubscriptionPlan().getPlanType() != PlanType.FREE)
                .map(UserSubscription::getUser)
                .distinct()
                .count();

        // --- Daily registrations for last 7 days ---
        List<Long> newRegistrationsLast7Days = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime from = date.atStartOfDay();
            LocalDateTime to = date.plusDays(1).atStartOfDay();
            long count = userRepository.countByCreatedAtBetween(from, to);
            newRegistrationsLast7Days.add(count);
        }

        // --- Storage breakdown by file type group (in MB) ---
        // PDF
        List<String> pdfTypes = List.of("pdf");
        double pdfStorageMb = documentRepository.findAllByFileTypeInAndDeletedFalse(pdfTypes).stream()
                .filter(d -> d.getFileSize() != null)
                .mapToDouble(d -> d.getFileSize() / (1024.0 * 1024.0))
                .sum();

        // Office (Word, PowerPoint)
        List<String> officeTypes = List.of("doc", "docx", "ppt", "pptx");
        double officeStorageMb = documentRepository.findAllByFileTypeInAndDeletedFalse(officeTypes).stream()
                .filter(d -> d.getFileSize() != null)
                .mapToDouble(d -> d.getFileSize() / (1024.0 * 1024.0))
                .sum();

        // Spreadsheets
        List<String> sheetTypes = List.of("xls", "xlsx", "csv");
        double spreadsheetStorageMb = documentRepository.findAllByFileTypeInAndDeletedFalse(sheetTypes).stream()
                .filter(d -> d.getFileSize() != null)
                .mapToDouble(d -> d.getFileSize() / (1024.0 * 1024.0))
                .sum();

        // Other (image, video, audio, text, etc.)
        List<String> allKnownTypes = new ArrayList<>(pdfTypes);
        allKnownTypes.addAll(officeTypes);
        allKnownTypes.addAll(sheetTypes);
        double otherStorageMb = documentRepository.findAllByDeletedFalse().stream()
                .filter(d -> d.getFileSize() != null
                        && (d.getFileType() == null || !allKnownTypes.contains(d.getFileType().toLowerCase())))
                .mapToDouble(d -> d.getFileSize() / (1024.0 * 1024.0))
                .sum();

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalAdmins(totalAdmins)
                .totalDocuments(totalDocuments)
                .totalNotifications(totalNotifications)
                .totalStorageUsed(totalStorageUsed)
                .totalTransactions(totalTransactions)
                .totalRevenue(totalRevenue)
                .pendingTransactions(pendingTransactions)
                .unreadNotifications(unreadNotifications)
                .rejectedDocuments(rejectedDocuments)
                .pendingDocuments(pendingDocuments)
                .premiumUsers(premiumUsers)
                .newRegistrationsLast7Days(newRegistrationsLast7Days)
                .pdfStorageMb(pdfStorageMb)
                .officeStorageMb(officeStorageMb)
                .spreadsheetStorageMb(spreadsheetStorageMb)
                .otherStorageMb(otherStorageMb)
                .build();
    }
}
