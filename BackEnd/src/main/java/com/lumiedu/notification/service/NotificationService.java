package com.lumiedu.notification.service;

public interface NotificationService {
    void sendNotification(Long userId, String title, String message);
}
