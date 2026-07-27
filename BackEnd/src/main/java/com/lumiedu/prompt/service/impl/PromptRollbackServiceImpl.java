package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.request.RollbackPromptRequest;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptRollbackService;
import com.lumiedu.prompt.service.PromptVersionService;
import com.lumiedu.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PromptRollbackServiceImpl implements PromptRollbackService {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;
    private final PromptVersionService promptVersionService;

    @Override
    public PromptVersionResponse rollbackToVersion(Long promptId, RollbackPromptRequest request, User currentUser) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with id: " + promptId));

        PromptVersion targetVersion = promptVersionRepository.findById(request.getTargetVersionId())
                .orElseThrow(() -> new IllegalArgumentException("Target rollback version not found with id: " + request.getTargetVersionId()));

        if (!targetVersion.getPrompt().getId().equals(promptId)) {
            throw new IllegalArgumentException("Target version does not belong to prompt id: " + promptId);
        }

        String nextVersion = promptVersionService.calculateNextVersion(promptId, request.getChangeType());

        List<PromptVersion> existingVersions = promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(promptId);
        PromptVersion previousVersion = existingVersions.isEmpty() ? null : existingVersions.get(0);

        String changeSummary = "Rollback content from version " + targetVersion.getVersion();
        String changeReason = request.getReason().trim();

        PromptVersion rollbackDraft = PromptVersion.builder()
                .prompt(prompt)
                .version(nextVersion)
                .markdownContent(targetVersion.getMarkdownContent())
                .status(PromptVersionStatus.DRAFT)
                .changeType(request.getChangeType())
                .changeSummary(changeSummary)
                .changeReason(changeReason)
                .previousVersion(previousVersion)
                .rollbackSourceVersion(targetVersion)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        PromptVersion saved = promptVersionRepository.save(rollbackDraft);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(saved)
                .action(ReviewAction.ROLLBACK_CREATED)
                .comment("Created rollback draft " + nextVersion + " from source version " + targetVersion.getVersion() + ": " + changeReason)
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    private PromptVersionResponse mapToResponse(PromptVersion pv) {
        return PromptVersionResponse.builder()
                .id(pv.getId())
                .promptId(pv.getPrompt().getId())
                .promptCode(pv.getPrompt().getCode())
                .promptName(pv.getPrompt().getName())
                .version(pv.getVersion())
                .markdownContent(pv.getMarkdownContent())
                .status(pv.getStatus())
                .changeType(pv.getChangeType())
                .changeSummary(pv.getChangeSummary())
                .changeReason(pv.getChangeReason())
                .previousVersionId(pv.getPreviousVersion() != null ? pv.getPreviousVersion().getId() : null)
                .previousVersionNumber(pv.getPreviousVersion() != null ? pv.getPreviousVersion().getVersion() : null)
                .rollbackSourceVersionId(pv.getRollbackSourceVersion() != null ? pv.getRollbackSourceVersion().getId() : null)
                .rollbackSourceVersionNumber(pv.getRollbackSourceVersion() != null ? pv.getRollbackSourceVersion().getVersion() : null)
                .createdByName(pv.getCreatedBy() != null ? pv.getCreatedBy().getFullName() : null)
                .createdById(pv.getCreatedBy() != null ? pv.getCreatedBy().getId() : null)
                .createdAt(pv.getCreatedAt())
                .updatedByName(pv.getUpdatedBy() != null ? pv.getUpdatedBy().getFullName() : null)
                .updatedById(pv.getUpdatedBy() != null ? pv.getUpdatedBy().getId() : null)
                .updatedAt(pv.getUpdatedAt())
                .reviewedByName(pv.getReviewedBy() != null ? pv.getReviewedBy().getFullName() : null)
                .reviewedById(pv.getReviewedBy() != null ? pv.getReviewedBy().getId() : null)
                .reviewedAt(pv.getReviewedAt())
                .reviewComment(pv.getReviewComment())
                .publishedByName(pv.getPublishedBy() != null ? pv.getPublishedBy().getFullName() : null)
                .publishedById(pv.getPublishedBy() != null ? pv.getPublishedBy().getId() : null)
                .publishedAt(pv.getPublishedAt())
                .build();
    }
}
