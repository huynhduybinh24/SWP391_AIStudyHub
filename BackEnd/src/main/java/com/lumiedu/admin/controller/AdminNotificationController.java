package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminCreateNotificationRequest;
import com.lumiedu.admin.dto.response.AdminNotificationResponse;
import com.lumiedu.admin.service.AdminNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping
    public ResponseEntity<List<AdminNotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(adminNotificationService.getAllNotifications());
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PostMapping
    public ResponseEntity<AdminNotificationResponse> createNotification(
            @RequestBody @Valid AdminCreateNotificationRequest request) {
        return ResponseEntity.ok(adminNotificationService.createNotification(request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PostMapping("/broadcast")
    public ResponseEntity<Void> broadcastNotification(
            @RequestBody @Valid AdminCreateNotificationRequest request) {
        adminNotificationService.broadcastNotification(request);
        return ResponseEntity.ok().build();
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        adminNotificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}
