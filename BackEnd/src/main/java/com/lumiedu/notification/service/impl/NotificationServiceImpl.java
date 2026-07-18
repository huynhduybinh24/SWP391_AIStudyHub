package com.lumiedu.notification.service.impl;

import com.lumiedu.notification.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationServiceImpl {
    public void sendNotification(Long userId, String title, String message) {
        log.info("[System Notification] Sent to User ID: {} | Title: {} | Message: {}", userId, title, message);
    }
}
