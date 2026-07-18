package com.lumiedu.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminNotificationResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String title;
    private String message;
    private String type;
    private boolean isRead;
    private LocalDateTime createdAt;
}
