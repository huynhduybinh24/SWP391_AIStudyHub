package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.*;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.admin.mapper.AdminUserMapper;
import com.lumiedu.admin.service.AdminUserService;
import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(String keyword, UserRole role, AccountStatus status, int page, int size) {
        List<User> users = userRepository.findAll();

        // Lọc theo keyword
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(lowerKeyword))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
        }

        // Lọc theo role
        if (role != null) {
            users = users.stream()
                    .filter(u -> u.getRole() == role)
                    .collect(Collectors.toList());
        }

        // Lọc theo status
        if (status != null) {
            users = users.stream()
                    .filter(u -> u.getAccountStatus() == status)
                    .collect(Collectors.toList());
        }

        // Sắp xếp theo ID giảm dần
        users.sort(Comparator.comparing(User::getId).reversed());

        // Phân trang thủ công
        int total = users.size();
        int start = page * size;
        if (start >= total) {
            users = Collections.emptyList();
        } else {
            int end = Math.min(start + size, total);
            users = users.subList(start, end);
        }

        return users.stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapUserToResponse(user);
    }

    @Override
    public AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User saved = userRepository.save(user);
        return mapUserToResponse(saved);
    }

    private void checkNotSelf(User targetUser, String action) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            if (auth.getName().equalsIgnoreCase(targetUser.getEmail())) {
                throw new IllegalStateException("You cannot " + action + " your own account.");
            }
        }
    }

    @Override
    public AdminUserResponse updateUserRole(Long id, AdminUpdateUserRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "change the role of");

        user.setRole(request.getRole());
        User saved = userRepository.save(user);
        return mapUserToResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserStatus(Long id, AdminUpdateUserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "change the status of");

        user.setAccountStatus(request.getStatus());
        User saved = userRepository.save(user);
        return mapUserToResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserPlan(Long id, AdminUpdateUserPlanRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // 1. Huỷ gói đăng ký cũ nếu có
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(id, SubscriptionStatus.ACTIVE);
        
        activeSub.ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            userSubscriptionRepository.save(sub);
        });

        // 2. Tìm gói cước mới
        SubscriptionPlan plan = subscriptionPlanRepository.findByPlanType(request.getPlanType())
                .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + request.getPlanType()));

        // 3. Tạo gói đăng ký mới cho user
        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .subscriptionPlan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30))
                .autoRenew(false)
                .build();
        userSubscriptionRepository.save(newSub);

        // 4. Cập nhật giới hạn lưu trữ của User
        if (plan.getStorageLimitMb() != null) {
            user.setStorageLimitMb(plan.getStorageLimitMb());
        }
        User saved = userRepository.save(user);

        return mapUserToResponse(saved);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "delete");

        user.setAccountStatus(AccountStatus.DELETED);
        userRepository.save(user);
    }

    private AdminUserResponse mapUserToResponse(User user) {
        PlanType planType = PlanType.FREE;
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent() && activeSub.get().getSubscriptionPlan() != null) {
            planType = activeSub.get().getSubscriptionPlan().getPlanType();
        }
        return AdminUserMapper.toResponse(user, planType);
    }
}
