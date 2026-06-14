package com.lumiedu.user.controller;

import com.lumiedu.user.dto.request.ChangeAccountStatusRequest;
import com.lumiedu.user.dto.request.ChangeUserRoleRequest;
import com.lumiedu.user.dto.request.UpdateUserProfileRequest;
import com.lumiedu.user.dto.response.UserResponse;
import com.lumiedu.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserResponse> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserResponse> updateUserProfile(
            @PathVariable Long id,
            @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(userService.updateUserProfile(id, request));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody ChangeUserRoleRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateAccountStatus(
            @PathVariable Long id,
            @RequestBody ChangeAccountStatusRequest request) {
        return ResponseEntity.ok(userService.updateAccountStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("User module is running");
    }

    @GetMapping("/{id}/linked-accounts")
    public ResponseEntity<List<com.lumiedu.auth.dto.ThirdPartyAccountResponse>> getLinkedAccounts(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getLinkedAccounts(id));
    }

    @PostMapping("/{id}/linked-accounts")
    public ResponseEntity<Void> linkThirdPartyAccount(
            @PathVariable Long id,
            @RequestBody LinkAccountRequest request) {
        userService.linkThirdPartyAccount(id, request.getCode(), request.getRedirectUri(), request.getProvider());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/linked-accounts/{provider}")
    public ResponseEntity<Void> unlinkThirdPartyAccount(
            @PathVariable Long id,
            @PathVariable String provider) {
        userService.unlinkThirdPartyAccount(id, provider);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/2fa/setup")
    public ResponseEntity<java.util.Map<String, String>> setupTwoFactor(@PathVariable Long id) {
        return ResponseEntity.ok(userService.setupTwoFactor(id));
    }

    @PostMapping("/{id}/2fa/enable")
    public ResponseEntity<Void> enableTwoFactor(
            @PathVariable Long id,
            @RequestBody TwoFactorCodeRequest request) {
        boolean success = userService.enableTwoFactor(id, request.getCode());
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/{id}/2fa/disable")
    public ResponseEntity<Void> disableTwoFactor(@PathVariable Long id) {
        boolean success = userService.disableTwoFactor(id);
        if (success) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().build();
    }

    @lombok.Data
    public static class TwoFactorCodeRequest {
        private String code;
    }

    @lombok.Data
    public static class LinkAccountRequest {
        private String code;
        private String redirectUri;
        private String provider;
    }
}
