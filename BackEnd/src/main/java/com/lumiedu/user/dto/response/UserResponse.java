package com.lumiedu.user.dto.response;

import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private UserRole role;
    private AccountStatus accountStatus;
    private Boolean twoFactorEnabled;
    private String plan;
    private Long storageUsedMb;
    private Long storageLimitMb;
    private String university;
    private String major;
    private String degree;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
