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

    @Column(name = "two_factor_secret")
    private String twoFactorSecret;

    @Column(name = "temp_two_factor_secret")
    private String tempTwoFactorSecret;

    @Builder.Default
    @Column(name = "storage_used_mb")
    private Long storageUsedMb = 0L;

    @Builder.Default
    @Column(name = "storage_limit_mb")
    private Long storageLimitMb = 1024L;

    @Column(name = "university", length = 150)
    private String university;

    @Column(name = "major", length = 150)
    private String major;

    @Column(name = "degree", length = 50)
    private String degree;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public Boolean getTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(Boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public String getTwoFactorSecret() { return twoFactorSecret; }
    public void setTwoFactorSecret(String twoFactorSecret) { this.twoFactorSecret = twoFactorSecret; }

    public String getTempTwoFactorSecret() { return tempTwoFactorSecret; }
    public void setTempTwoFactorSecret(String tempTwoFactorSecret) { this.tempTwoFactorSecret = tempTwoFactorSecret; }

    public Long getStorageUsedMb() { return storageUsedMb != null ? storageUsedMb : 0L; }
    public void setStorageUsedMb(Long storageUsedMb) { this.storageUsedMb = storageUsedMb; }

    public Long getStorageLimitMb() { return storageLimitMb != null ? storageLimitMb : 1024L; }
    public void setStorageLimitMb(Long storageLimitMb) { this.storageLimitMb = storageLimitMb; }

    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }

    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }

    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }
}
