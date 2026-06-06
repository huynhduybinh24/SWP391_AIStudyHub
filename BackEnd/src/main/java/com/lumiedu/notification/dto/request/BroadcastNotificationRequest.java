package com.lumiedu.notification.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastNotificationRequest {
    private String title;
    private String message;
    private String type; // "system", "maintenance", "warning", "promotion"
    private String target; // "all", "free", "pro"
}
