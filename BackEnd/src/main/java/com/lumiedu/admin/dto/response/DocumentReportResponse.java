package com.lumiedu.admin.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentReportResponse {
    private Long id;
    private Long documentId;
    private String reportedFile;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}
