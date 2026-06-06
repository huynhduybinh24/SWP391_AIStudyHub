package com.lumiedu.notification.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String type; // e.g. "shared_file", "document_deleted"
    private String title;
    private String message;
    private String targetUserEmail;
    private Long documentId;
    private String documentName;
    private String reason;
    private String actionType;
    private String adminNote;
    private String actionText;
    private String actionUrl;
    private String avatar;
    private String quote;
}
