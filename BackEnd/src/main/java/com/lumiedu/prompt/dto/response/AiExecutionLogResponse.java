package com.lumiedu.prompt.dto.response;

import com.lumiedu.prompt.enums.ExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiExecutionLogResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String studentCode;
    private String featureType;
    private Long promptId;
    private String promptCode;
    private Long promptVersionId;
    private String promptVersion;
    private String knowledgeBaseId;
    private String knowledgeVersion;
    private String llmProvider;
    private String llmModel;
    private String requestId;
    private String providerRequestId;
    private ExecutionStatus status;
    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long latencyMs;
    private Integer tokenUsage;
    private String inputMetadata;
    private String outputReference;
    private LocalDateTime createdAt;
    private String publishedByName;
    private LocalDateTime publishedAt;
}
