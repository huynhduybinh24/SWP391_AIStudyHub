package com.lumiedu.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDocumentResponse {
    private Long id;
    private Long userId;
    private String ownerName;
    private String ownerEmail;
    private String title;
    private String description;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String summaryPreview;
    private String status;
    private String moderationReason;
}
