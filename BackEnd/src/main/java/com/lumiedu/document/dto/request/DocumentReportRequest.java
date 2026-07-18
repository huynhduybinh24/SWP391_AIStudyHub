package com.lumiedu.document.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentReportRequest {
    private String documentId;
    private String reason;
    private String details;
    private String reportedFile;
    private String reporterName;
    private String reporterEmail;
}
