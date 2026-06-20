package com.lumiedu.admin.mapper;

import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.user.entity.User;

public class AdminUserMapper {
    
    public static AdminUserResponse toResponse(User user, PlanType planType, Long storageLimitMb) {
        if (user == null) {
            return null;
        }
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .planType(planType != null ? planType : PlanType.FREE)
                .avatarUrl(user.getAvatarUrl())
                .storageUsedMb(user.getStorageUsedMb())
                .storageLimitMb(storageLimitMb)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
