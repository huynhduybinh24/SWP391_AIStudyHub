package com.lumiedu.notification.dto.response;

import com.lumiedu.notification.entity.BroadcastNotification;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
public class BroadcastNotificationResponse {
    private String id;
    private String title;
    private String message;
    private String type; // system, maintenance, warning, promotion
    private String target; // all, free, pro
    private String sentAt; // yyyy-MM-dd HH:mm
    private int recipientsCount;

    public static BroadcastNotificationResponse fromEntity(BroadcastNotification entity) {
        if (entity == null) return null;

        String sentAtStr = entity.getCreatedAt() != null 
                ? entity.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : "";

        return BroadcastNotificationResponse.builder()
                .id(String.valueOf(entity.getId()))
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType())
                .target(entity.getTarget())
                .sentAt(sentAtStr)
                .recipientsCount(entity.getRecipientsCount() == null ? 0 : entity.getRecipientsCount())
                .build();
    }
}
