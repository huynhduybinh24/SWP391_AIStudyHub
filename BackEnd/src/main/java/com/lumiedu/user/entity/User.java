package com.lumiedu.user.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "avatar_url", columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false)
    private AccountStatus accountStatus;

    @Builder.Default
    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    @Builder.Default
    @Column(name = "storage_used_mb")
    private Long storageUsedMb = 0L;

    @Builder.Default
    @Column(name = "storage_limit_mb")
    private Long storageLimitMb = 500L;
}
