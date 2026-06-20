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
    private final com.lumiedu.billing.repository.UserSubscriptionRepository userSubscriptionRepository;

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
            return "If the email exists, a reset OTP will be sent.";
        }

        // Xóa tất cả các token đặt lại mật khẩu cũ của người dùng này để tránh lỗi unique constraint
        java.util.List<PasswordResetToken> oldTokens = passwordResetTokenRepository.findByUserId(user.getId());
        passwordResetTokenRepository.deleteAll(oldTokens);

        // Tạo mã OTP 6 chữ số ngẫu nhiên đảm bảo độc nhất trong DB
        String otp;
        do {
            int code = 100000 + new java.util.Random().nextInt(900000);
            otp = String.valueOf(code);
        } while (passwordResetTokenRepository.findByToken(otp).isPresent());

        // Hạn dùng của OTP là 5 phút
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(otp)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        System.out.println("=== PASSWORD RESET OTP FOR " + user.getEmail() + ": " + otp + " ===");

        // Gửi email chứa mã OTP xác thực
        emailService.sendEmail(
                user.getEmail(),
                "LumiEdu - Password Reset OTP Code",
                buildOtpResetEmail(user.getFullName(), otp),
                true
        );

        return "If the email exists, a reset OTP will be sent.";
    }

    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (request.getEmail() == null || !resetToken.getUser().getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            throw new RuntimeException("Email does not match this token");
        }

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
        if (user.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
            return "PRO";
        }
        var activeSub = userSubscriptionRepository.findFirstByUserIdAndStatusOrderByEndDateDesc(
                user.getId(), com.lumiedu.billing.enums.SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent() && activeSub.get().getSubscriptionPlan() != null) {
            var planType = activeSub.get().getSubscriptionPlan().getPlanType();
            return planType != null ? planType.name() : "FREE";
        }
        return "FREE";
    }

    private String buildOtpResetEmail(String name, String otp) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
                  <div style="background: #ffffff; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                    <img src="https://raw.githubusercontent.com/huynhduybinh24/SWP391_AIStudyHub/main/FrontEnd/public/logo.png" alt="LumiEdu Logo" style="max-width: 130px; height: auto; display: block; margin: 0 auto;" />
                    <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">AI Study Hub</p>
                  </div>

                  <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 8px;">Mã xác thực đặt lại mật khẩu (OTP)</h2>
                  <p style="color: #475569; font-size: 15px; margin-bottom: 4px;">Xin chào <strong>%s</strong>,</p>
                  <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản LumiEdu của bạn. Dưới đây là mã xác thực OTP của bạn:
                  </p>

                  <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px dashed #cbd5e1;">
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a8a; font-family: monospace; line-height: 1;">
                      %s
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 10px 0 0 0;">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>.</p>
                  </div>

                  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      ⚠️ Tuyệt đối không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                  </div>

                  <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">
                    LumiEdu AI Study Hub · Email tự động vui lòng không phản hồi
                  </p>
                </div>
                """.formatted(name, otp);
    }
}
