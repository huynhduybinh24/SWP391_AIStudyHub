package com.lumiedu.admin.service;

import com.lumiedu.admin.dto.request.AdminCreateNotificationRequest;
import com.lumiedu.admin.dto.response.AdminNotificationResponse;
import java.util.List;

public interface AdminNotificationService {
    List<AdminNotificationResponse> getAllNotifications();
    AdminNotificationResponse createNotification(AdminCreateNotificationRequest request);
    void broadcastNotification(AdminCreateNotificationRequest request);
    void deleteNotification(Long id);
}
