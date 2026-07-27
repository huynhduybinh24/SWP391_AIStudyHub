package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.request.ReviewPromptVersionRequest;
import com.lumiedu.prompt.dto.response.PromptReviewHistoryResponse;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptWorkflowService;
import com.lumiedu.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PromptWorkflowServiceImpl implements PromptWorkflowService {

    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;

    @Override
    public PromptVersionResponse submitForReview(Long versionId, User currentUser) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));

        if (pv.getStatus() != PromptVersionStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT versions can be submitted for review. Current status: " + pv.getStatus());
        }

        pv.setStatus(PromptVersionStatus.IN_REVIEW);
        pv.setUpdatedBy(currentUser);
        PromptVersion saved = promptVersionRepository.save(pv);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(saved)
                .action(ReviewAction.SUBMITTED)
                .comment("Submitted version for review")
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Override
    public PromptVersionResponse approveVersion(Long versionId, ReviewPromptVersionRequest request, User currentUser) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));

        if (pv.getStatus() != PromptVersionStatus.IN_REVIEW) {
            throw new IllegalStateException("Only IN_REVIEW versions can be approved. Current status: " + pv.getStatus());
        }

        String comment = request != null && request.getComment() != null ? request.getComment() : "Approved";

        pv.setStatus(PromptVersionStatus.APPROVED);
        pv.setReviewedBy(currentUser);
        pv.setReviewedAt(LocalDateTime.now());
        pv.setReviewComment(comment);
        pv.setUpdatedBy(currentUser);
        PromptVersion saved = promptVersionRepository.save(pv);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(saved)
                .action(ReviewAction.APPROVED)
                .comment(comment)
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Override
    public PromptVersionResponse rejectVersion(Long versionId, ReviewPromptVersionRequest request, User currentUser) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));

        if (pv.getStatus() != PromptVersionStatus.IN_REVIEW) {
            throw new IllegalStateException("Only IN_REVIEW versions can be rejected. Current status: " + pv.getStatus());
        }

        if (request == null || request.getComment() == null || request.getComment().trim().isEmpty()) {
            throw new IllegalArgumentException("Review comment is mandatory when rejecting a version.");
        }

        pv.setStatus(PromptVersionStatus.REJECTED);
        pv.setReviewedBy(currentUser);
        pv.setReviewedAt(LocalDateTime.now());
        pv.setReviewComment(request.getComment().trim());
        pv.setUpdatedBy(currentUser);
        PromptVersion saved = promptVersionRepository.save(pv);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(saved)
                .action(ReviewAction.REJECTED)
                .comment(request.getComment().trim())
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Override
    public PromptVersionResponse publishVersion(Long versionId, User currentUser) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));

        if (pv.getStatus() != PromptVersionStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED versions can be published. Current status: " + pv.getStatus());
        }

        Long promptId = pv.getPrompt().getId();

        // 1. Archive previous PUBLISHED version if present
        Optional<PromptVersion> currentPublishedOpt = promptVersionRepository.findPublishedVersionByPromptId(promptId);
        if (currentPublishedOpt.isPresent()) {
            PromptVersion currentPublished = currentPublishedOpt.get();
            currentPublished.setStatus(PromptVersionStatus.ARCHIVED);
            currentPublished.setUpdatedBy(currentUser);
            promptVersionRepository.save(currentPublished);

            PromptReviewHistory archiveHistory = PromptReviewHistory.builder()
                    .promptVersion(currentPublished)
                    .action(ReviewAction.ARCHIVED)
                    .comment("Archived as new version " + pv.getVersion() + " was published")
                    .performedBy(currentUser)
                    .performedAt(LocalDateTime.now())
                    .build();
            promptReviewHistoryRepository.save(archiveHistory);
        }

        // 2. Set target version to PUBLISHED
        pv.setStatus(PromptVersionStatus.PUBLISHED);
        pv.setPublishedBy(currentUser);
        pv.setPublishedAt(LocalDateTime.now());
        pv.setUpdatedBy(currentUser);
        PromptVersion published = promptVersionRepository.save(pv);

        PromptReviewHistory publishHistory = PromptReviewHistory.builder()
                .promptVersion(published)
                .action(ReviewAction.PUBLISHED)
                .comment("Published version " + published.getVersion())
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(publishHistory);

        return mapToResponse(published);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromptReviewHistoryResponse> getReviewHistory(Long versionId) {
        return promptReviewHistoryRepository.findByPromptVersionIdOrderByPerformedAtAsc(versionId).stream()
                .map(this::mapHistoryToResponse)
                .collect(Collectors.toList());
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

    private PromptReviewHistoryResponse mapHistoryToResponse(PromptReviewHistory history) {
        return PromptReviewHistoryResponse.builder()
                .id(history.getId())
                .promptVersionId(history.getPromptVersion().getId())
                .action(history.getAction())
                .comment(history.getComment())
                .performedByName(history.getPerformedBy() != null ? history.getPerformedBy().getFullName() : null)
                .performedById(history.getPerformedBy() != null ? history.getPerformedBy().getId() : null)
                .performedAt(history.getPerformedAt())
                .build();
    }
}
