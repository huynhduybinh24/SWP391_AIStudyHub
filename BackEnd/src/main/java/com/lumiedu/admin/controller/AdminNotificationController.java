package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminCreateNotificationRequest;
import com.lumiedu.admin.dto.response.AdminNotificationResponse;
import com.lumiedu.admin.service.AdminNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @GetMapping
    public ResponseEntity<List<AdminNotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(adminNotificationService.getAllNotifications());
    }

    @PostMapping
    public ResponseEntity<AdminNotificationResponse> createNotification(
            @RequestBody @Valid AdminCreateNotificationRequest request) {
        return ResponseEntity.ok(adminNotificationService.createNotification(request));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastNotification(
            @RequestBody @Valid AdminCreateNotificationRequest request) {
        adminNotificationService.broadcastNotification(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        adminNotificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}
