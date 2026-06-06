package com.lumiedu.notification.dto.response;

import com.lumiedu.notification.entity.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
public class NotificationResponse {
    private String id;
    private String type;
    private String title;
    private String description; // message maps to description on frontend
    private String message;     // message maps to message on frontend
    private boolean isRead;
    private String time;        // relative friendly time e.g. "10m ago"
    private String quote;
    private String actionText;
    private String actionUrl;
    private String avatar;
    private String reason;
    private String documentName;
    private String documentId;
    private String actionType;
    private String adminNote;
    private String targetUserEmail;
    private String createdAt;

    public static NotificationResponse fromEntity(Notification entity, String userEmail) {
        if (entity == null) return null;

        String formattedTime = toFriendlyTime(entity.getCreatedAt());

        return NotificationResponse.builder()
                .id(String.valueOf(entity.getId()))
                .type(entity.getType() != null ? entity.getType().getValue() : "system")
                .title(entity.getTitle())
                .description(entity.getMessage())
                .message(entity.getMessage())
                .isRead(entity.getIsRead())
                .time(formattedTime)
                .quote(entity.getQuote())
                .actionText(entity.getActionText())
                .actionUrl(entity.getActionUrl())
                .avatar(entity.getAvatar())
                .reason(entity.getReason())
                .documentName(entity.getDocumentName())
                .documentId(entity.getDocumentId() != null ? String.valueOf(entity.getDocumentId()) : null)
                .actionType(entity.getActionType())
                .adminNote(entity.getAdminNote())
                .targetUserEmail(userEmail)
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .build();
    }

    private static String toFriendlyTime(LocalDateTime dateTime) {
        if (dateTime == null) return "Just now";
        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(dateTime, now);

        long seconds = duration.getSeconds();
        if (seconds < 0) {
            return "Just now";
        }
        if (seconds < 60) {
            return "Just now";
        }
        long minutes = seconds / 60;
        if (minutes < 60) {
            return minutes + "m ago";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = hours / 24;
        if (days == 1) {
            return "Yesterday";
        }
        if (days < 7) {
            return days + "d ago";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
