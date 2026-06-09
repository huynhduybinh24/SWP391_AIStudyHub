package com.lumiedu.auth.service;

import com.lumiedu.auth.dto.*;
import com.lumiedu.auth.entity.PasswordResetToken;
import com.lumiedu.auth.repository.PasswordResetTokenRepository;
import com.lumiedu.common.config.JwtTokenProvider;
import com.lumiedu.email.service.EmailService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:8386}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .avatarUrl("/logo.png")
                .role(UserRole.USER)
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
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getAccountStatus() == AccountStatus.LOCKED || user.getAccountStatus() == AccountStatus.DELETED) {
            throw new RuntimeException("Account is not active");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        return toAuthResponse(user, "Login successfully");
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            // Return same message to prevent email enumeration
            return "If the email exists, a reset link will be sent.";
        }

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiredAt(LocalDateTime.now().plusMinutes(30))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send reset link via email (async)
        String resetLink = frontendUrl + "/set-new-password?token=" + token;
        emailService.sendEmail(
                user.getEmail(),
                "Reset Your LumiEdu Password",
                buildPasswordResetEmail(user.getFullName(), resetLink),
                true
        );

        return "If the email exists, a reset link will be sent.";
    }

    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.getUsed() || resetToken.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired or already used");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password reset successfully";
    }

    public String changePassword(ChangePasswordRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Password changed successfully";
    }

    // ===== Private helpers =====

    private AuthResponse toAuthResponse(User user, String message) {
        String role = user.getRole() != null ? user.getRole().name() : "USER";
        String planStr = resolvePlan(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), role);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail(), role);

        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(role)
                .plan(planStr)
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .message(message)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private String resolvePlan(User user) {
        // Check if user has an active subscription — default to FREE
        // This can be extended later to query the payments/subscriptions table
        return "FREE";
    }

    private String buildPasswordResetEmail(String name, String resetLink) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
                  <div style="background: #0f172a; border-radius: 10px; padding: 32px; text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #60a5fa; margin: 0; font-size: 28px;">🔐 LumiEdu</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">AI Study Hub</p>
                  </div>

                  <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 8px;">Password Reset Request</h2>
                  <p style="color: #475569; font-size: 15px; margin-bottom: 4px;">Hello <strong>%s</strong>,</p>
                  <p style="color: #475569; font-size: 15px; margin-bottom: 28px;">
                    We received a request to reset your LumiEdu password. Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.
                  </p>

                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="%s"
                       style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: bold; letter-spacing: 0.02em;">
                      Reset My Password
                    </a>
                  </div>

                  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      ⚠️ If you did not request this, please ignore this email. Your password will remain unchanged.
                    </p>
                  </div>

                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                    Or copy this link: <a href="%s" style="color: #3b82f6; word-break: break-all;">%s</a>
                  </p>

                  <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">
                    LumiEdu AI Study Hub · Do not reply to this email
                  </p>
                </div>
                """.formatted(name, resetLink, resetLink, resetLink);
    }
}
