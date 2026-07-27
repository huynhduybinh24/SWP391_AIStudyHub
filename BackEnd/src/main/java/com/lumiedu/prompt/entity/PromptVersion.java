package com.lumiedu.prompt.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "prompt_versions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_prompt_version", columnNames = {"prompt_id", "version"})
    },
    indexes = {
        @Index(name = "idx_prompt_version_status", columnList = "prompt_id, status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptVersion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    private Prompt prompt;

    @Column(name = "version", nullable = false, length = 20)
    private String version;

    @Column(name = "markdown_content", columnDefinition = "LONGTEXT", nullable = false)
    private String markdownContent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PromptVersionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 10)
    private ChangeType changeType;

    @Column(name = "change_summary", nullable = false, length = 500)
    private String changeSummary;

    @Column(name = "change_reason", columnDefinition = "TEXT", nullable = false)
    private String changeReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_version_id")
    private PromptVersion previousVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rollback_source_version_id")
    private PromptVersion rollbackSourceVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = true)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by")
    private User publishedBy;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
