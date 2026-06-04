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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ThirdPartyAccountRepository thirdPartyAccountRepository;
    private final PasswordEncoder passwordEncoder;

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
            avatarUrl = "/avatar.svg";
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

        // Logic: find user by third-party account or email
        Optional<ThirdPartyAccount> tpAccountOpt = thirdPartyAccountRepository
                .findByProviderTypeAndProviderUserId(ProviderType.GOOGLE, googleId);
        
        User user = null;
        if (tpAccountOpt.isPresent()) {
            user = tpAccountOpt.get().getUser();
        } else {
            // Find by email
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
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
                        .avatarUrl(avatarUrl)
                        .role(com.lumiedu.user.enums.UserRole.USER)
                        .accountStatus(com.lumiedu.user.enums.AccountStatus.ACTIVE)
                        .twoFactorEnabled(false)
                        .storageUsedMb(0L)
                        .storageLimitMb(500L)
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

        if (user.getAccountStatus() == com.lumiedu.user.enums.AccountStatus.LOCKED 
                || user.getAccountStatus() == com.lumiedu.user.enums.AccountStatus.DELETED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account is locked or deleted"));
        }

        // Determine current plan status
        String plan = "free";
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent()) {
            plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
        }

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan(plan)
                .avatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "/avatar.svg")
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken("mock-jwt-token-for-dev")
                .refreshToken("mock-refresh-token-for-dev")
                .build();

        LoginResponse response = LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        if (!user.getPasswordHash().equals(request.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid credentials"));
        }

        // Determine current plan status
        String plan = "free";
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent()) {
            plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
        }

        AuthUser authUser = AuthUser.builder()
                .id(String.valueOf(user.getId()))
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .plan(plan)
                .avatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "/avatar.svg")
                .build();

        AuthTokens tokens = AuthTokens.builder()
                .accessToken("mock-jwt-token-for-dev")
                .refreshToken("mock-refresh-token-for-dev")
                .build();

        LoginResponse response = LoginResponse.builder()
                .user(authUser)
                .tokens(tokens)
                .build();

        return ResponseEntity.ok(response);
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
}
