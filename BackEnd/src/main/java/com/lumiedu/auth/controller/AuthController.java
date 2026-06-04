package com.lumiedu.auth.controller;

import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.entity.UserSubscription;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

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
}
