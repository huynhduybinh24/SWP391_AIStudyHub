package com.lumiedu.notification.controller;

import com.lumiedu.notification.dto.request.BroadcastNotificationRequest;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.notification.dto.response.ApiResponse;
import com.lumiedu.notification.dto.response.BroadcastNotificationResponse;
import com.lumiedu.notification.dto.response.NotificationResponse;
import com.lumiedu.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "all") String filter) {
        List<NotificationResponse> list = notificationService.getNotifications(userId, email, filter);
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully.", list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(ApiResponse.ok("Notification created successfully.", response));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read successfully.", null));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String email) {
        notificationService.markAllAsRead(userId, email);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read.", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.ok("Notification deleted successfully.", null));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<BroadcastNotificationResponse>> sendBroadcast(
            @RequestBody BroadcastNotificationRequest request) {
        BroadcastNotificationResponse response = notificationService.sendBroadcast(request);
        return ResponseEntity.ok(ApiResponse.ok("Broadcast notification sent successfully.", response));
    }

    @GetMapping("/broadcast/history")
    public ResponseEntity<ApiResponse<List<BroadcastNotificationResponse>>> getBroadcastHistory() {
        List<BroadcastNotificationResponse> history = notificationService.getBroadcastHistory();
        return ResponseEntity.ok(ApiResponse.ok("Broadcast history retrieved successfully.", history));
    }

    @DeleteMapping("/broadcast/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBroadcastHistory(@PathVariable Long id) {
        notificationService.deleteBroadcastHistory(id);
        return ResponseEntity.ok(ApiResponse.ok("Broadcast history record deleted successfully.", null));
    }
}
