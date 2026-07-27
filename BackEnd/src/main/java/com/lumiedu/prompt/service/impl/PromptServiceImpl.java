package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.request.CreatePromptRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptRequest;
import com.lumiedu.prompt.dto.response.PromptResponse;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptService;
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
public class PromptServiceImpl implements PromptService {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromptResponse> getAllPrompts() {
        return promptRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PromptResponse getPromptById(Long id) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with id: " + id));
        return mapToResponse(prompt);
    }

    @Override
    @Transactional(readOnly = true)
    public PromptResponse getPromptByCode(String code) {
        Prompt prompt = promptRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with code: " + code));
        return mapToResponse(prompt);
    }

    @Override
    public PromptResponse createPrompt(CreatePromptRequest request, User currentUser) {
        if (promptRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Prompt code already exists: " + request.getCode());
        }

        Prompt prompt = Prompt.builder()
                .code(request.getCode().toUpperCase().trim())
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(request.getCategory())
                .active(true)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        Prompt savedPrompt = promptRepository.save(prompt);

        // Create initial v1.0.0 DRAFT version
        String changeSummary = request.getChangeSummary() != null && !request.getChangeSummary().trim().isEmpty()
                ? request.getChangeSummary()
                : "Initial prompt creation";
        String changeReason = request.getChangeReason() != null && !request.getChangeReason().trim().isEmpty()
                ? request.getChangeReason()
                : "Initial release setup";

        PromptVersion initialVersion = PromptVersion.builder()
                .prompt(savedPrompt)
                .version("v1.0.0")
                .markdownContent(request.getInitialMarkdownContent())
                .status(PromptVersionStatus.DRAFT)
                .changeType(ChangeType.MAJOR)
                .changeSummary(changeSummary)
                .changeReason(changeReason)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .build();

        PromptVersion savedVersion = promptVersionRepository.save(initialVersion);

        // Audit review history
        PromptReviewHistory history = PromptReviewHistory.builder()
                .promptVersion(savedVersion)
                .action(ReviewAction.CREATED)
                .comment("Created initial prompt version v1.0.0")
                .performedBy(currentUser)
                .performedAt(LocalDateTime.now())
                .build();
        promptReviewHistoryRepository.save(history);

        return mapToResponse(savedPrompt);
    }

    @Override
    public PromptResponse updatePrompt(Long id, UpdatePromptRequest request, User currentUser) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with id: " + id));

        prompt.setName(request.getName().trim());
        prompt.setDescription(request.getDescription());
        prompt.setCategory(request.getCategory());
        prompt.setUpdatedBy(currentUser);

        Prompt updated = promptRepository.save(prompt);
        return mapToResponse(updated);
    }

    @Override
    public PromptResponse togglePromptStatus(Long id, User currentUser) {
        Prompt prompt = promptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found with id: " + id));

        prompt.setActive(!prompt.getActive());
        prompt.setUpdatedBy(currentUser);

        Prompt updated = promptRepository.save(prompt);
        return mapToResponse(updated);
    }

    private PromptResponse mapToResponse(Prompt prompt) {
        List<PromptVersion> versions = promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(prompt.getId());
        Optional<PromptVersion> publishedOpt = promptVersionRepository.findPublishedVersionByPromptId(prompt.getId());

        return PromptResponse.builder()
                .id(prompt.getId())
                .code(prompt.getCode())
                .name(prompt.getName())
                .description(prompt.getDescription())
                .category(prompt.getCategory())
                .active(prompt.getActive())
                .currentPublishedVersion(publishedOpt.map(PromptVersion::getVersion).orElse(null))
                .currentPublishedVersionId(publishedOpt.map(PromptVersion::getId).orElse(null))
                .createdByName(prompt.getCreatedBy() != null ? prompt.getCreatedBy().getFullName() : null)
                .createdById(prompt.getCreatedBy() != null ? prompt.getCreatedBy().getId() : null)
                .createdAt(prompt.getCreatedAt())
                .updatedByName(prompt.getUpdatedBy() != null ? prompt.getUpdatedBy().getFullName() : null)
                .updatedById(prompt.getUpdatedBy() != null ? prompt.getUpdatedBy().getId() : null)
                .updatedAt(prompt.getUpdatedAt())
                .totalVersions(versions.size())
                .build();
    }
}
