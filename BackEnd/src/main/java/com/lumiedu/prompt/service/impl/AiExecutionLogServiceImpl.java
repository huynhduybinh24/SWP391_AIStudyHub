package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.response.AiExecutionLogResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.prompt.repository.AiExecutionLogRepository;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AiExecutionLogServiceImpl implements AiExecutionLogService {

    private final AiExecutionLogRepository aiExecutionLogRepository;

    @Override
    public AiExecutionLog createProcessingLog(
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
    ) {
        AiExecutionLog log = AiExecutionLog.builder()
                .user(user)
                .studentCode(studentCode)
                .featureType(featureType)
                .prompt(promptVersion.getPrompt())
                .promptCode(promptVersion.getPrompt().getCode())
                .promptVersionEntity(promptVersion)
                .promptVersion(promptVersion.getVersion())
                .knowledgeBaseId(knowledgeBaseId)
                .knowledgeVersion(knowledgeVersion)
                .llmProvider(llmProvider != null ? llmProvider : "Google")
                .llmModel(llmModel != null ? llmModel : "gemini-3.1-flash-lite")
                .requestId(requestId)
                .status(ExecutionStatus.PROCESSING)
                .startedAt(LocalDateTime.now())
                .inputMetadata(inputMetadata)
                .build();

        return aiExecutionLogRepository.save(log);
    }

    @Override
    public void updateLogStatus(
            Long logId,
            ExecutionStatus status,
            String errorMessage,
            Integer tokenUsage,
            String outputReference,
            String providerRequestId
    ) {
        AiExecutionLog log = aiExecutionLogRepository.findById(logId).orElse(null);
        if (log == null) return;

        LocalDateTime now = LocalDateTime.now();
        log.setStatus(status);
        log.setCompletedAt(now);
        if (log.getStartedAt() != null) {
            log.setLatencyMs(Duration.between(log.getStartedAt(), now).toMillis());
        }
        if (errorMessage != null) {
            log.setErrorMessage(errorMessage);
        }
        if (tokenUsage != null) {
            log.setTokenUsage(tokenUsage);
        }
        if (outputReference != null) {
            log.setOutputReference(outputReference);
        }
        if (providerRequestId != null) {
            log.setProviderRequestId(providerRequestId);
        }

        aiExecutionLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AiExecutionLogResponse> getLogs(
            String studentCode,
            String featureType,
            String promptCode,
            String promptVersion,
            String knowledgeVersion,
            String llmModel,
            ExecutionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        Specification<AiExecutionLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studentCode != null && !studentCode.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("studentCode")), "%" + studentCode.trim().toLowerCase() + "%"));
            }
            if (featureType != null && !featureType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("featureType"), featureType.trim()));
            }
            if (promptCode != null && !promptCode.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("promptCode"), promptCode.trim().toUpperCase()));
            }
            if (promptVersion != null && !promptVersion.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("promptVersion"), promptVersion.trim()));
            }
            if (knowledgeVersion != null && !knowledgeVersion.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("knowledgeVersion"), knowledgeVersion.trim()));
            }
            if (llmModel != null && !llmModel.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("llmModel"), llmModel.trim()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return aiExecutionLogRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AiExecutionLogResponse getLogById(Long logId) {
        AiExecutionLog log = aiExecutionLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("AI Execution log not found with id: " + logId));
        return mapToResponse(log);
    }

    private AiExecutionLogResponse mapToResponse(AiExecutionLog log) {
        PromptVersion pv = log.getPromptVersionEntity();

        return AiExecutionLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .studentCode(log.getStudentCode())
                .featureType(log.getFeatureType())
                .promptId(log.getPrompt() != null ? log.getPrompt().getId() : null)
                .promptCode(log.getPromptCode())
                .promptVersionId(pv != null ? pv.getId() : null)
                .promptVersion(log.getPromptVersion())
                .knowledgeBaseId(log.getKnowledgeBaseId())
                .knowledgeVersion(log.getKnowledgeVersion())
                .llmProvider(log.getLlmProvider())
                .llmModel(log.getLlmModel())
                .requestId(log.getRequestId())
                .providerRequestId(log.getProviderRequestId())
                .status(log.getStatus())
                .errorMessage(log.getErrorMessage())
                .startedAt(log.getStartedAt())
                .completedAt(log.getCompletedAt())
                .latencyMs(log.getLatencyMs())
                .tokenUsage(log.getTokenUsage())
                .inputMetadata(log.getInputMetadata())
                .outputReference(log.getOutputReference())
                .createdAt(log.getCreatedAt())
                .publishedByName(pv != null && pv.getPublishedBy() != null ? pv.getPublishedBy().getFullName() : null)
                .publishedAt(pv != null ? pv.getPublishedAt() : null)
                .build();
    }
}
