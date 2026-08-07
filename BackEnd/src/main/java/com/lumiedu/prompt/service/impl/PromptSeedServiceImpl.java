package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.enums.ReviewAction;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromptSeedServiceImpl implements PromptSeedService {

    private static final String INITIAL_VERSION = "v1.0.0";

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final PromptReviewHistoryRepository promptReviewHistoryRepository;

    @Override
    @Transactional
    public void seedInitialPrompt(
            String code,
            String name,
            String description,
            PromptCategory category,
            String markdownContent
    ) {
        validateInput(code, name, markdownContent);

        String normalizedCode = code.trim().toUpperCase();

        Prompt prompt = findOrCreatePrompt(normalizedCode, name, description, category);

        Prompt lockedPrompt = promptRepository
                .findByCodeForUpdate(normalizedCode)
                .orElse(prompt);

        Optional<PromptVersion> publishedOpt = promptVersionRepository.findPublishedVersionByPromptId(lockedPrompt.getId());
        if (publishedOpt.isPresent()) {
            PromptVersion publishedVer = publishedOpt.get();
            if (!publishedVer.getMarkdownContent().contains("RELEVANCY CHECK")) {
                publishedVer.setMarkdownContent(markdownContent.trim());
                promptVersionRepository.saveAndFlush(publishedVer);
                log.info("Updated published prompt version template with RELEVANCY CHECK: code={}, version={}", normalizedCode, publishedVer.getVersion());
            } else {
                log.info("Skip prompt seed: code={} already has updated published version {}", normalizedCode, publishedVer.getVersion());
            }
            return;
        }

        PromptVersion initialVersion = PromptVersion.builder()
                .prompt(lockedPrompt)
                .version(INITIAL_VERSION)
                .markdownContent(markdownContent.trim())
                .status(PromptVersionStatus.PUBLISHED)
                .changeType(ChangeType.MAJOR)
                .changeSummary("Initial system prompt migration")
                .changeReason("Migrate legacy hard-coded prompt into database")
                .publishedAt(LocalDateTime.now())
                .build();

        try {
            PromptVersion savedVersion = promptVersionRepository.saveAndFlush(initialVersion);

            PromptReviewHistory history = PromptReviewHistory.builder()
                    .promptVersion(savedVersion)
                    .action(ReviewAction.PUBLISHED)
                    .comment("Initial system prompt v1.0.0 auto-published on startup")
                    .performedAt(LocalDateTime.now())
                    .build();
            promptReviewHistoryRepository.save(history);

            log.info("Created initial prompt version: code={}, version={}", normalizedCode, INITIAL_VERSION);
        } catch (DataIntegrityViolationException exception) {
            log.warn("Skip duplicate prompt version due to constraint violation: code={}, version={}", normalizedCode, INITIAL_VERSION);
        }
    }

    private Prompt findOrCreatePrompt(String code, String name, String description, PromptCategory category) {
        return promptRepository.findByCode(code)
                .orElseGet(() -> createPromptSafely(code, name, description, category));
    }

    private Prompt createPromptSafely(String code, String name, String description, PromptCategory category) {
        Prompt prompt = Prompt.builder()
                .code(code)
                .name(name != null ? name.trim() : "")
                .description(description != null ? description.trim() : null)
                .category(category)
                .active(true)
                .build();

        try {
            return promptRepository.saveAndFlush(prompt);
        } catch (DataIntegrityViolationException exception) {
            return promptRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalStateException("Cannot create or retrieve prompt: " + code, exception));
        }
    }

    private void validateInput(String code, String name, String markdownContent) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Prompt code must not be blank");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Prompt name must not be blank");
        }
        if (markdownContent == null || markdownContent.isBlank()) {
            throw new IllegalArgumentException("Prompt markdown content must not be blank");
        }
    }
}
