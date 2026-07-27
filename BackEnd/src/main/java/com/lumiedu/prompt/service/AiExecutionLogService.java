package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.response.AiExecutionLogResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AiExecutionLogService {

    AiExecutionLog createProcessingLog(
            User user,
            String studentCode,
            String featureType,
            PromptVersion promptVersion,
            String knowledgeBaseId,
            String knowledgeVersion,
            String llmProvider,
            String llmModel,
            String requestId,
            String inputMetadata
    );

    void updateLogStatus(
            Long logId,
            ExecutionStatus status,
            String errorMessage,
            Integer tokenUsage,
            String outputReference,
            String providerRequestId
    );

    Page<AiExecutionLogResponse> getLogs(
            String studentCode,
            String featureType,
            String promptCode,
            String promptVersion,
            String knowledgeVersion,
            String llmModel,
            ExecutionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Boolean flaggedOnly,
            Pageable pageable
    );

    AiExecutionLogResponse getLogById(Long logId);

    AiExecutionLogResponse reportLog(Long logId, String reason, User user);

    AiExecutionLogResponse resolveReport(Long logId);
}
