package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.request.CreatePromptVersionRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptVersionRequest;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptVersionService;
import com.lumiedu.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PromptVersionServiceImpl implements PromptVersionService {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromptVersionResponse> getVersionsByPromptId(Long promptId) {
        return promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(promptId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PromptVersionResponse getVersionById(Long versionId) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));
        return mapToResponse(pv);
    }

    @Override
    public String calculateNextVersion(Long promptId, ChangeType changeType) {
        List<PromptVersion> versions = promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(promptId);
        if (versions.isEmpty()) {
            return "v1.0.0";
        }

        // Get highest version number
        PromptVersion latest = versions.get(0);
        String versionStr = latest.getVersion().replace("v", "");
        String[] parts = versionStr.split("\\.");
        int major = Integer.parseInt(parts[0]);
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
        int patch = parts.length > 2 ? Integer.parseInt(parts[2]) : 0;

        switch (changeType) {
            case MAJOR:
                major++;
                minor = 0;
                patch = 0;
                break;
            case MINOR:
                minor++;
                patch = 0;
                break;
            case PATCH:
            default:
                patch++;
                break;
        }

        return String.format("v%d.%d.%d", major, minor, patch);
    }

    @Override
    public PromptVersionResponse createVersion(Long promptId, CreatePromptVersionRequest request, User currentUser) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with id: " + promptId));

        String nextVersion = calculateNextVersion(promptId, request.getChangeType());

        PromptVersion previousVersion = null;
        if (request.getBasedOnVersionId() != null) {
            previousVersion = promptVersionRepository.findById(request.getBasedOnVersionId()).orElse(null);
        } else {
            List<PromptVersion> existingVersions = promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(promptId);
            if (!existingVersions.isEmpty()) {
                previousVersion = existingVersions.get(0);
            }
        }

        PromptVersion newVersion = PromptVersion.builder()
                .prompt(prompt)
                .version(nextVersion)
                .markdownContent(request.getMarkdownContent())
                .status(PromptVersionStatus.DRAFT)
                .changeType(request.getChangeType())
                .changeSummary(request.getChangeSummary().trim())
                .changeReason(request.getChangeReason().trim())
                .previousVersion(previousVersion)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        PromptVersion saved = promptVersionRepository.save(newVersion);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(saved)
                .action(ReviewAction.CREATED)
                .comment("Created new version " + nextVersion)
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Override
    public PromptVersionResponse updateDraftVersion(Long versionId, UpdatePromptVersionRequest request, User currentUser) {
        PromptVersion pv = promptVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Prompt version not found with id: " + versionId));

        if (pv.getStatus() != PromptVersionStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT versions can be modified. Current status: " + pv.getStatus());
        }

        pv.setMarkdownContent(request.getMarkdownContent());
        if (request.getChangeSummary() != null && !request.getChangeSummary().trim().isEmpty()) {
            pv.setChangeSummary(request.getChangeSummary().trim());
        }
        if (request.getChangeReason() != null && !request.getChangeReason().trim().isEmpty()) {
            pv.setChangeReason(request.getChangeReason().trim());
        }
        pv.setUpdatedBy(currentUser);

        PromptVersion updated = promptVersionRepository.save(pv);

        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(updated)
                .action(ReviewAction.UPDATED)
                .comment("Updated draft content")
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(updated);
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
