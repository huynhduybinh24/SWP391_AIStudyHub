package com.lumiedu.auth.controller;

import com.lumiedu.auth.dto.*;
import com.lumiedu.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Auth module is running");
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }

    @GetMapping("/third-party/{userId}")
    public ResponseEntity<List<ThirdPartyAccountResponse>> getLinkedAccounts(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.getLinkedAccounts(userId));
    }

    @PostMapping("/third-party/link")
    public ResponseEntity<ThirdPartyAccountResponse> linkThirdPartyAccount(@RequestBody LinkThirdPartyAccountRequest request) {
        return ResponseEntity.ok(authService.linkThirdPartyAccount(request));
    }

    @DeleteMapping("/third-party/{accountId}")
    public ResponseEntity<String> disconnectThirdPartyAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(authService.disconnectThirdPartyAccount(accountId));
    }
}
