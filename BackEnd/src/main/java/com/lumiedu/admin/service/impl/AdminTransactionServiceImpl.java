package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminUpdateTransactionStatusRequest;
import com.lumiedu.admin.dto.response.AdminRevenueStatsResponse;
import com.lumiedu.admin.dto.response.AdminTransactionResponse;
import com.lumiedu.admin.mapper.AdminTransactionMapper;
import com.lumiedu.admin.service.AdminTransactionService;
import com.lumiedu.billing.entity.Payment;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PaymentStatus;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.PaymentRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminTransactionServiceImpl implements AdminTransactionService {

    private final PaymentRepository paymentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminTransactionResponse> getTransactions(int page, int size) {
        List<Payment> payments = paymentRepository.findAll();

        // Sắp xếp mới nhất lên đầu
        payments.sort(Comparator.comparing(Payment::getId).reversed());

        // Phân trang thủ công
        int total = payments.size();
        int start = page * size;
        if (start >= total) {
            payments = Collections.emptyList();
        } else {
            int end = Math.min(start + size, total);
            payments = payments.subList(start, end);
        }

        return payments.stream()
                .map(AdminTransactionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTransactionResponse getTransactionById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
        return AdminTransactionMapper.toResponse(payment);
    }

    @Override
    public AdminTransactionResponse updateTransactionStatus(Long id, AdminUpdateTransactionStatusRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        PaymentStatus oldStatus = payment.getPaymentStatus();
        PaymentStatus newStatus = request.getStatus();

        payment.setPaymentStatus(newStatus);
        if (newStatus == PaymentStatus.SUCCESS && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }

        Payment saved = paymentRepository.save(payment);

        // Nếu chuyển trạng thái sang SUCCESS/PAID
        if (oldStatus != PaymentStatus.SUCCESS && newStatus == PaymentStatus.SUCCESS) {
            UserSubscription userSub = payment.getUserSubscription();
            if (userSub != null) {
                // Kích hoạt gói subscription tương ứng
                userSub.setStatus(SubscriptionStatus.ACTIVE);
                userSubscriptionRepository.save(userSub);

                // Cập nhật storage limit của User theo gói cước mới
                User user = payment.getUser();
                if (user != null && userSub.getSubscriptionPlan() != null) {
                    if (userSub.getSubscriptionPlan().getStorageLimitMb() != null) {
                        user.setStorageLimitMb(userSub.getSubscriptionPlan().getStorageLimitMb());
                    }
                    userRepository.save(user);

                    // Tạo notification báo cho user
                    try {
                        notificationService.createNotification(NotificationRequest.builder()
                                .targetUserEmail(user.getEmail())
                                .title("Thanh toán thành công")
                                .message("Thanh toán cho gói " + userSub.getSubscriptionPlan().getPlanName() + " đã được xác nhận thành công!")
                                .type("SYSTEM")
                                .actionType("system")
                                .build());
                    } catch (Exception e) {
                        System.err.println("Gửi notification thất bại: " + e.getMessage());
                    }
                }
            }
        }

        return AdminTransactionMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminRevenueStatsResponse getRevenueStats() {
        BigDecimal totalRevenue = paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminRevenueStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .build();
    }
}
