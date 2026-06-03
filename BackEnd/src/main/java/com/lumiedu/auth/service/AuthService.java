package com.lumiedu.auth.service;

import com.lumiedu.auth.dto.*;
import com.lumiedu.auth.entity.PasswordResetToken;
import com.lumiedu.auth.entity.ThirdPartyAccount;
import com.lumiedu.auth.enums.TokenStatus;
import com.lumiedu.auth.repository.PasswordResetTokenRepository;
import com.lumiedu.auth.repository.ThirdPartyAccountRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ThirdPartyAccountRepository thirdPartyAccountRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password and confirm password do not match");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.STUDENT)
                .accountStatus(AccountStatus.ACTIVE)
                .twoFactorEnabled(false)
                .storageUsedMb(0L)
                .storageLimitMb(1024L)
                .build();

        User savedUser = userRepository.save(user);
        return toAuthResponse(savedUser, "Register successfully");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        return toAuthResponse(user, "Login successfully");
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .status(TokenStatus.ACTIVE)
                .expiredAt(LocalDateTime.now().plusMinutes(15))
                .build();

        passwordResetTokenRepository.save(resetToken);

        // TODO: Send token to user email instead of returning it directly.
        return token;
    }

    public String resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.getStatus() != TokenStatus.ACTIVE) {
            throw new RuntimeException("Reset token has already been used or is inactive");
        }

        if (resetToken.getExpiredAt().isBefore(LocalDateTime.now())) {
            resetToken.setStatus(TokenStatus.EXPIRED);
            passwordResetTokenRepository.save(resetToken);
            throw new RuntimeException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setStatus(TokenStatus.USED);
        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        return "Password reset successfully";
    }

    public String changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid old password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Password changed successfully";
    }

    @Transactional(readOnly = true)
    public List<ThirdPartyAccountResponse> getLinkedAccounts(Long userId) {
        return thirdPartyAccountRepository.findByUserId(userId).stream()
                .map(this::toThirdPartyAccountResponse)
                .collect(Collectors.toList());
    }

    public ThirdPartyAccountResponse linkThirdPartyAccount(LinkThirdPartyAccountRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        if (thirdPartyAccountRepository.existsByProviderTypeAndProviderUserId(request.getProviderType(), request.getProviderUserId())) {
            throw new RuntimeException("This third-party account is already linked to another user");
        }

        ThirdPartyAccount account = ThirdPartyAccount.builder()
                .user(user)
                .providerType(request.getProviderType())
                .providerUserId(request.getProviderUserId())
                .providerEmail(request.getProviderEmail())
                .linkedAt(LocalDateTime.now())
                .build();

        ThirdPartyAccount savedAccount = thirdPartyAccountRepository.save(account);
        return toThirdPartyAccountResponse(savedAccount);
    }

    public String disconnectThirdPartyAccount(Long accountId) {
        ThirdPartyAccount account = thirdPartyAccountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Third-party account link not found with id: " + accountId));

        thirdPartyAccountRepository.delete(account);
        return "Third-party account disconnected successfully";
    }

    private AuthResponse toAuthResponse(User user, String message) {
        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .message(message)
                .build();
    }

    private ThirdPartyAccountResponse toThirdPartyAccountResponse(ThirdPartyAccount account) {
        return ThirdPartyAccountResponse.builder()
                .id(account.getId())
                .providerType(account.getProviderType())
                .providerEmail(account.getProviderEmail())
                .linkedAt(account.getLinkedAt())
                .build();
    }
}
