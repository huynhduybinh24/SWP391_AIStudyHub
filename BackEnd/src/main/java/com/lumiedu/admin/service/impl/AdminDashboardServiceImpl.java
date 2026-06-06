package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.response.AdminDashboardStatsResponse;
import com.lumiedu.admin.service.AdminDashboardService;
import com.lumiedu.billing.entity.Payment;
import com.lumiedu.billing.enums.PaymentStatus;
import com.lumiedu.billing.repository.PaymentRepository;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.notification.repository.NotificationRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationRepository notificationRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public AdminDashboardStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.findByRole(UserRole.ADMIN).size();
        long totalDocuments = documentRepository.count();
        long totalNotifications = notificationRepository.count();

        // Tính tổng dung lượng lưu trữ của tất cả users
        double totalStorageUsed = userRepository.findAll().stream()
                .filter(u -> u.getStorageUsedMb() != null)
                .mapToDouble(User::getStorageUsedMb)
                .sum();

        List<Payment> payments = paymentRepository.findAll();
        long totalTransactions = payments.size();

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingTransactions = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING)
                .count();

        long unreadNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getIsRead() != null && !n.getIsRead() && n.getDeleted() != null && !n.getDeleted())
                .count();

        // Cột status chưa được cấu hình cho Document entity, trả về 0 và gắn TODO
        // TODO: Map these fields once document status and moderation columns are added
        long rejectedDocuments = 0;
        long pendingDocuments = 0;

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
                .build();
    }
}
