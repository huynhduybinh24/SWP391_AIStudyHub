package com.lumiedu.prompt.dto.response;

import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptVersionResponse {
    private Long id;
    private Long promptId;
    private String promptCode;
    private String promptName;
    private String version;
    private String markdownContent;
    private PromptVersionStatus status;
    private ChangeType changeType;
    private String changeSummary;
    private String changeReason;
    private Long previousVersionId;
    private String previousVersionNumber;
    private Long rollbackSourceVersionId;
    private String rollbackSourceVersionNumber;
    private String createdByName;
    private Long createdById;
    private LocalDateTime createdAt;
    private String updatedByName;
    private Long updatedById;
    private LocalDateTime updatedAt;
    private String reviewedByName;
    private Long reviewedById;
    private LocalDateTime reviewedAt;
    private String reviewComment;
    private String publishedByName;
    private Long publishedById;
    private LocalDateTime publishedAt;
}
