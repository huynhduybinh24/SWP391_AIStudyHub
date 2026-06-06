package com.lumiedu.admin.dto.response;

import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.billing.enums.PlanType;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private AccountStatus accountStatus;
    private PlanType planType;
    private String avatarUrl;
    private Long storageUsedMb;
    private Long storageLimitMb;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
