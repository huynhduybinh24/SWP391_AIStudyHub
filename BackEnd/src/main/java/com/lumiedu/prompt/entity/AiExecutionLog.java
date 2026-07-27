package com.lumiedu.prompt.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "ai_execution_logs",
    indexes = {
        @Index(name = "idx_ael_prompt_code_version", columnList = "prompt_code, prompt_version"),
        @Index(name = "idx_ael_user_feature", columnList = "user_id, feature_type"),
        @Index(name = "idx_ael_status_created", columnList = "status, created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiExecutionLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "student_code", length = 50)
    private String studentCode;

    @Column(name = "feature_type", nullable = false, length = 50)
    private String featureType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    private Prompt prompt;

    @Column(name = "prompt_code", nullable = false, length = 100)
    private String promptCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_version_id", nullable = false)
    private PromptVersion promptVersionEntity;

    @Column(name = "prompt_version", nullable = false, length = 20)
    private String promptVersion;

    @Column(name = "knowledge_base_id", length = 100)
    private String knowledgeBaseId;

    @Column(name = "knowledge_version", length = 50)
    private String knowledgeVersion;

    @Builder.Default
    @Column(name = "llm_provider", nullable = false, length = 50)
    private String llmProvider = "Google";

    @Builder.Default
    @Column(name = "llm_model", nullable = false, length = 100)
    private String llmModel = "gemini-3.1-flash-lite";

    @Column(name = "request_id", nullable = false, length = 100)
    private String requestId;

    @Column(name = "provider_request_id", length = 100)
    private String providerRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ExecutionStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "latency_ms")
    private Long latencyMs;

    @Column(name = "token_usage")
    private Integer tokenUsage;

    @Column(name = "input_metadata", columnDefinition = "LONGTEXT")
    private String inputMetadata;

    @Column(name = "output_reference", columnDefinition = "LONGTEXT")
    private String outputReference;
}
