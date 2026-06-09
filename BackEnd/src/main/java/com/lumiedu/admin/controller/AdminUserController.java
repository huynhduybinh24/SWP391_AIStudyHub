package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.*;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.admin.service.AdminUserService;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(keyword, role, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(id, request));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserRoleRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserRole(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserStatus(id, request));
    }

    @PatchMapping("/{id}/plan")
    public ResponseEntity<AdminUserResponse> updateUserPlan(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateUserPlanRequest request) {
        return ResponseEntity.ok(adminUserService.updateUserPlan(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
