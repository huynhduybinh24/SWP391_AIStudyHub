package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.*;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.admin.service.AdminUserService;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(keyword, role, status, page, size));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PutMapping("/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(id, request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PatchMapping("/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserRoleRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserRole(id, request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserStatus(id, request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PatchMapping("/{id}/plan")
    public ResponseEntity<AdminUserResponse> updateUserPlan(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserPlanRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserPlan(id, request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
