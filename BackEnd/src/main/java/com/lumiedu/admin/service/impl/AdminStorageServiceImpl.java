package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.response.AdminStorageOverviewResponse;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.admin.mapper.AdminUserMapper;
import com.lumiedu.admin.service.AdminStorageService;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStorageServiceImpl implements AdminStorageService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Override
    public AdminStorageOverviewResponse getStorageOverview() {
        List<User> users = userRepository.findAll();

        double totalStorageUsed = users.stream()
                .filter(u -> u.getStorageUsedMb() != null)
                .mapToDouble(User::getStorageUsedMb)
                .sum();

        double totalStorageLimit = users.stream()
                .filter(u -> u.getStorageLimitMb() != null)
                .mapToDouble(User::getStorageLimitMb)
                .sum();

        List<Document> activeDocs = documentRepository.findAllByDeletedFalse();
        long totalFiles = activeDocs.size();
        long totalFileSize = activeDocs.stream()
                .filter(d -> d.getFileSize() != null)
                .mapToLong(Document::getFileSize)
                .sum();

        // Lấy top 10 users sử dụng dung lượng nhiều nhất
        List<User> topUsers = users.stream()
                .filter(u -> u.getStorageUsedMb() != null)
                .sorted(Comparator.comparing(User::getStorageUsedMb).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // Lấy danh sách sub của top users để tránh n+1 queries
        List<Long> topUserIds = topUsers.stream().map(User::getId).collect(Collectors.toList());
        
        // Query active subscriptions của top users
        // Chạy stream map thủ công do JPA query findFirstBy... là cho từng user.
        // Để đơn giản và chính xác, lấy từng sub cho mỗi top user
        List<AdminUserResponse> topUserResponses = topUsers.stream()
                .map(user -> {
                    PlanType planType = PlanType.FREE;
                    Optional<UserSubscription> activeSub = userSubscriptionRepository
                            .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
                    if (activeSub.isPresent() && activeSub.get().getSubscriptionPlan() != null) {
                        planType = activeSub.get().getSubscriptionPlan().getPlanType();
                    }
                    return AdminUserMapper.toResponse(user, planType);
                })
                .collect(Collectors.toList());

        return AdminStorageOverviewResponse.builder()
                .totalStorageUsed(totalStorageUsed)
                .totalStorageLimit(totalStorageLimit)
                .totalFiles(totalFiles)
                .totalFileSize(totalFileSize)
                .topUsersByStorage(topUserResponses)
                .build();
    }
}
