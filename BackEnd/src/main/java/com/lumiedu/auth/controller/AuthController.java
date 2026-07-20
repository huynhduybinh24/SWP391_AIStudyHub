package com.lumiedu.auth.controller;

import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.auth.repository.ThirdPartyAccountRepository;
import com.lumiedu.auth.entity.ThirdPartyAccount;
import com.lumiedu.auth.enums.ProviderType;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.lumiedu.auth.dto.RegisterRequest;

import com.lumiedu.auth.dto.ForgotPasswordRequest;
import com.lumiedu.auth.dto.ResetPasswordRequest;
import com.lumiedu.auth.service.AuthService;
import com.lumiedu.common.config.JwtTokenProvider;
import com.lumiedu.admin.repository.SystemSettingRepository;
import com.lumiedu.admin.entity.SystemSetting;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ThirdPartyAccountRepository thirdPartyAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SystemSettingRepository systemSettingRepository;
    private final AuthService authService;

    @Value("${google.client-id:123456789-dummy.apps.googleusercontent.com}")
    private String googleClientId;

    @Value("${google.client-secret:mock-client-secret}")
    private String googleClientSecret;

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        String code = request.getCode();
        String redirectUri = request.getRedirectUri();

        String googleId = null;
        String email = null;
        String name = null;
        String avatarUrl = null;

        // Check if we are in mock mode (client ID contains "dummy", code is "mock-" or empty credentials)
        boolean isMock = googleClientId.contains("dummy") 
                      || "mock-client-secret".equals(googleClientSecret) 
                      || (code != null && code.startsWith("mock-"));

        if (isMock) {
            // Simulated login flow for development
            googleId = "mock-google-id-123456";
            email = "mock.google.user@example.com";
            name = "Mock Google User";
            avatarUrl = "/logo.png";
        } else {
            try {
                // Real OAuth2 Token Exchange
                RestTemplate restTemplate = new RestTemplate();
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

                MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
                map.add("code", code);
                map.add("client_id", googleClientId);
                map.add("client_secret", googleClientSecret);
                map.add("redirect_uri", redirectUri);
                map.add("grant_type", "authorization_code");

                HttpEntity<MultiValueMap<String, String>> entityRequest = new HttpEntity<>(map, headers);
                
                String tokenUrl = "https://oauth2.googleapis.com/token";
                ResponseEntity<String> tokenResponse = restTemplate.postForEntity(tokenUrl, entityRequest, String.class);
                
                if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Failed to exchange authorization code with Google"));
                }

                JsonObject tokenJson = JsonParser.parseString(tokenResponse.getBody()).getAsJsonObject();
                String accessToken = tokenJson.get("access_token").getAsString();

                // Fetch User Profile
                HttpHeaders userInfoHeaders = new HttpHeaders();
                userInfoHeaders.setBearerAuth(accessToken);
                HttpEntity<Void> userInfoEntity = new HttpEntity<>(userInfoHeaders);

                String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
                ResponseEntity<String> userInfoResponse = restTemplate.exchange(userInfoUrl, org.springframework.http.HttpMethod.GET, userInfoEntity, String.class);

                if (!userInfoResponse.getStatusCode().is2xxSuccessful() || userInfoResponse.getBody() == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Failed to retrieve user profile from Google"));
                }

                JsonObject userJson = JsonParser.parseString(userInfoResponse.getBody()).getAsJsonObject();
                googleId = userJson.get("sub").getAsString();
                email = userJson.get("email").getAsString();
                name = userJson.has("name") ? userJson.get("name").getAsString() : email.split("@")[0];
                avatarUrl = userJson.has("picture") ? userJson.get("picture").getAsString() : null;

            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Google OAuth authentication failed: " + e.getMessage()));
            }
        }

        if (googleId == null || googleId.trim().isEmpty() || email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google authentication did not return a valid user ID or email."));
        }

        // Logic: find user by third-party account or email
        Optional<ThirdPartyAccount> tpAccountOpt = thirdPartyAccountRepository
                .findByProviderTypeAndProviderUserId(ProviderType.GOOGLE, googleId);
        
        User user = null;
        if (tpAccountOpt.isPresent()) {
            user = tpAccountOpt.get().getUser();
            // Sync Google avatar if current avatar is empty or default
            if (avatarUrl != null && !avatarUrl.trim().isEmpty() && (user.getAvatarUrl() == null || user.getAvatarUrl().trim().isEmpty() || "/logo.png".equals(user.getAvatarUrl()))) {
                user.setAvatarUrl(avatarUrl);
                user = userRepository.save(user);
            }
        } else {
            // Find by email
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                // Sync Google avatar if current avatar is empty or default
                if (avatarUrl != null && !avatarUrl.trim().isEmpty() && (user.getAvatarUrl() == null || user.getAvatarUrl().trim().isEmpty() || "/logo.png".equals(user.getAvatarUrl()))) {
                    user.setAvatarUrl(avatarUrl);
                    user = userRepository.save(user);
                }
                // Create third-party account linkage
                ThirdPartyAccount tpAccount = ThirdPartyAccount.builder()
                        .user(user)
                        .providerType(ProviderType.GOOGLE)
                        .providerUserId(googleId)
                        .providerEmail(email)
                        .build();
                thirdPartyAccountRepository.save(tpAccount);
            } else {
                // Register a new user
                user = User.builder()
                        .fullName(name)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random secure password
                        .avatarUrl(avatarUrl != null && !avatarUrl.trim().isEmpty() ? avatarUrl : "/logo.png")
                        .role(com.lumiedu.user.enums.UserRole.USER)
                        .accountStatus(com.lumiedu.user.enums.AccountStatus.ACTIVE)
                        .twoFactorEnabled(false)
                        .storageUsedMb(0L)
                        .storageLimitMb(1024L)
                        .build();
                
                user = userRepository.save(user);

                // Create third-party account linkage
                ThirdPartyAccount tpAccount = ThirdPartyAccount.builder()
                        .user(user)
                        .providerType(ProviderType.GOOGLE)
                        .providerUserId(googleId)
                        .providerEmail(email)
                        .build();
                thirdPartyAccountRepository.save(tpAccount);
            }
        }

        // Kiểm tra chế độ bảo trì hệ thống
        String systemMode = systemSettingRepository.findById("SYSTEM_MODE")
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");

        if ("MAINTENANCE".equalsIgnoreCase(systemMode) && user.getRole() != com.lumiedu.user.enums.UserRole.ADMIN) {
            String systemMessage = systemSettingRepository.findById("SYSTEM_MESSAGE")
                    .map(SystemSetting::getSettingValue)
                    .orElse("Hệ thống đang bảo trì / System is under maintenance");
            return ResponseEntity.badRequest().body(Map.of("message", "Hệ thống đang bảo trì: " + systemMessage));
        }

        if (user.getAccountStatus() == com.lumiedu.user.enums.AccountStatus.LOCKED 
                || user.getAccountStatus() == com.lumiedu.user.enums.AccountStatus.DELETED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is locked or deleted"));
        }

        // Determine current plan status
        String plan = "free";
        if (user.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
            plan = "enterprise";
        } else {
            Optional<UserSubscription> activeSub = userSubscriptionRepository
                    .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
            if (activeSub.isPresent()) {
                plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
            }
        }

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan(plan)
                .avatarUrl(user.getAvatarUrl() != null && !user.getAvatarUrl().trim().isEmpty() ? user.getAvatarUrl() : "/logo.png")
                .university(user.getUniversity() != null ? user.getUniversity() : "FPT University")
                .major(user.getMajor() != null ? user.getMajor() : "Software engineering")
                .degree(user.getDegree() != null ? user.getDegree() : "Bachelor")
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name()))
                .build();

        LoginResponse response = LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-lock")
    public ResponseEntity<?> checkLock(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("locked", authService.isLocked(email)));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Kiểm tra chế độ bảo trì hệ thống
        String systemMode = systemSettingRepository.findById("SYSTEM_MODE")
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");

        if ("MAINTENANCE".equalsIgnoreCase(systemMode)) {
            String systemMessage = systemSettingRepository.findById("SYSTEM_MESSAGE")
                    .map(SystemSetting::getSettingValue)
                    .orElse("Hệ thống đang bảo trì / System is under maintenance");
            return ResponseEntity.badRequest().body(Map.of("message", "Hệ thống đang bảo trì: " + systemMessage));
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(com.lumiedu.user.enums.UserRole.USER)
                .accountStatus(com.lumiedu.user.enums.AccountStatus.ACTIVE)
                .storageUsedMb(0L)
                .storageLimitMb(1024L)
                .build();
        user = userRepository.save(user);

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan("free")
                .avatarUrl("/logo.png")
                .university(user.getUniversity() != null ? user.getUniversity() : "FPT University")
                .major(user.getMajor() != null ? user.getMajor() : "Software engineering")
                .degree(user.getDegree() != null ? user.getDegree() : "Bachelor")
                .twoFactorEnabled(false)
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name()))
                .build();

        return ResponseEntity.ok(LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (authService.isLocked(user.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is locked"));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            authService.incrementFailedAttempts(user.getEmail());
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid credentials"));
        }

        authService.clearFailedAttempts(user.getEmail());

        // Kiểm tra chế độ bảo trì hệ thống (Admin được bỏ qua)
        String systemMode = systemSettingRepository.findById("SYSTEM_MODE")
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");

        if ("MAINTENANCE".equalsIgnoreCase(systemMode) && user.getRole() != com.lumiedu.user.enums.UserRole.ADMIN) {
            String systemMessage = systemSettingRepository.findById("SYSTEM_MESSAGE")
                    .map(SystemSetting::getSettingValue)
                    .orElse("Hệ thống đang bảo trì / System is under maintenance");
            return ResponseEntity.badRequest().body(Map.of("message", "Hệ thống đang bảo trì: " + systemMessage));
        }

        // Intercept login if 2FA is enabled
        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            return ResponseEntity.ok(Map.of(
                "requires2fa", true,
                "email", user.getEmail()
            ));
        }

        // Determine current plan status
        String plan = "free";
        if (user.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
            plan = "enterprise";
        } else {
            Optional<UserSubscription> activeSub = userSubscriptionRepository
                    .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
            if (activeSub.isPresent()) {
                plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
            }
        }

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan(plan)
                .avatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "/logo.png")
                .university(user.getUniversity() != null ? user.getUniversity() : "FPT University")
                .major(user.getMajor() != null ? user.getMajor() : "Software engineering")
                .degree(user.getDegree() != null ? user.getDegree() : "Bachelor")
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name()))
                .build();

        LoginResponse response = LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/verify-2fa")
    public ResponseEntity<?> verify2faLogin(@RequestBody Verify2faLoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }
        User user = userOpt.get();

        if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            return ResponseEntity.badRequest().body(Map.of("message", "2FA is not enabled for this user"));
        }

        boolean isValid = com.lumiedu.common.util.TotpUtils.verifyCode(user.getTwoFactorSecret(), request.getCode());
        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã xác thực không đúng / Invalid 2FA code"));
        }

        // Determine current plan status
        String plan = "free";
        if (user.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
            plan = "enterprise";
        } else {
            Optional<UserSubscription> activeSub = userSubscriptionRepository
                    .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
            if (activeSub.isPresent()) {
                plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
            }
        }

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan(plan)
                .avatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "/logo.png")
                .university(user.getUniversity() != null ? user.getUniversity() : "FPT University")
                .major(user.getMajor() != null ? user.getMajor() : "Software engineering")
                .degree(user.getDegree() != null ? user.getDegree() : "Bachelor")
                .twoFactorEnabled(true)
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken(jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name()))
                .refreshToken(jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name()))
                .build();

        LoginResponse response = LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build();

        return ResponseEntity.ok(response);
    }

    @Data
    public static class Verify2faLoginRequest {
        private String email;
        private String code;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private AuthUser user;
        private AuthTokens tokens;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthUser {
        private String id;
        private String name;
        private String email;
        private String role;
        private String plan;
        private String avatarUrl;
        private String university;
        private String major;
        private String degree;
        private Boolean twoFactorEnabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthTokens {
        private String accessToken;
        private String refreshToken;
    }

    @Data
    public static class GoogleLoginRequest {
        private String code;
        private String redirectUri;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String result = authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", result));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            String result = authService.resetPassword(request);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
