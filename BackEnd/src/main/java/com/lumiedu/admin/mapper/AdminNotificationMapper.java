package com.lumiedu.admin.mapper;

import com.lumiedu.admin.dto.response.AdminNotificationResponse;
import com.lumiedu.notification.entity.Notification;
import com.lumiedu.user.entity.User;

public class AdminNotificationMapper {

    public static AdminNotificationResponse toResponse(Notification notification, User user) {
        if (notification == null) {
            return null;
        }
        return AdminNotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .userEmail(user != null ? user.getEmail() : null)
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType() != null ? notification.getType().getValue() : null)
                .isRead(notification.getIsRead() != null ? notification.getIsRead() : false)
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
