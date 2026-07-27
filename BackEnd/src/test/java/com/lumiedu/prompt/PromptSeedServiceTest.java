package com.lumiedu.prompt;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptReviewHistory;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.impl.PromptSeedServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromptSeedServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PromptVersionRepository promptVersionRepository;

    @Mock
    private PromptReviewHistoryRepository promptReviewHistoryRepository;

    @InjectMocks
    private PromptSeedServiceImpl promptSeedService;

    private Prompt prompt;

    @BeforeEach
    void setUp() {
        prompt = Prompt.builder()
                .id(100L)
                .code("TEST_PROMPT")
                .name("Test Prompt")
                .description("Description")
                .category(PromptCategory.GENERATION)
                .active(true)
                .build();
    }

    @Test
    void testSeedInitialPrompt_FirstRun_CreatesPromptAndPublishedVersion() {
        when(promptRepository.findByCode("TEST_PROMPT")).thenReturn(Optional.empty());
        when(promptRepository.saveAndFlush(any(Prompt.class))).thenReturn(prompt);
        when(promptRepository.findByCodeForUpdate("TEST_PROMPT")).thenReturn(Optional.of(prompt));

        when(promptVersionRepository.existsByPromptIdAndVersion(100L, "v1.0.0")).thenReturn(false);
        when(promptVersionRepository.existsByPromptIdAndStatus(100L, PromptVersionStatus.PUBLISHED)).thenReturn(false);

        PromptVersion savedVersion = PromptVersion.builder()
                .id(200L)
                .prompt(prompt)
                .version("v1.0.0")
                .status(PromptVersionStatus.PUBLISHED)
                .markdownContent("Hello {{name}}")
                .build();
        when(promptVersionRepository.saveAndFlush(any(PromptVersion.class))).thenReturn(savedVersion);

        promptSeedService.seedInitialPrompt(
                "TEST_PROMPT",
                "Test Prompt",
                "Description",
                PromptCategory.GENERATION,
                "Hello {{name}}"
        );

        verify(promptRepository, times(1)).saveAndFlush(any(Prompt.class));

        ArgumentCaptor<PromptVersion> versionCaptor = ArgumentCaptor.forClass(PromptVersion.class);
        verify(promptVersionRepository, times(1)).saveAndFlush(versionCaptor.capture());

        PromptVersion version = versionCaptor.getValue();
        assertEquals("v1.0.0", version.getVersion());
        assertEquals(PromptVersionStatus.PUBLISHED, version.getStatus());
        assertEquals("Hello {{name}}", version.getMarkdownContent());

        verify(promptReviewHistoryRepository, times(1)).save(any(PromptReviewHistory.class));
    }

    @Test
    void testSeedInitialPrompt_SecondRun_VersionAlreadyExists_Skips() {
        when(promptRepository.findByCode("TEST_PROMPT")).thenReturn(Optional.of(prompt));
        when(promptRepository.findByCodeForUpdate("TEST_PROMPT")).thenReturn(Optional.of(prompt));
        when(promptVersionRepository.existsByPromptIdAndVersion(100L, "v1.0.0")).thenReturn(true);

        promptSeedService.seedInitialPrompt(
                "TEST_PROMPT",
                "Test Prompt",
                "Description",
                PromptCategory.GENERATION,
                "Hello {{name}}"
        );

        verify(promptVersionRepository, never()).saveAndFlush(any(PromptVersion.class));
        verify(promptReviewHistoryRepository, never()).save(any(PromptReviewHistory.class));
    }

    @Test
    void testSeedInitialPrompt_PublishedVersionAlreadyExists_Skips() {
        when(promptRepository.findByCode("TEST_PROMPT")).thenReturn(Optional.of(prompt));
        when(promptRepository.findByCodeForUpdate("TEST_PROMPT")).thenReturn(Optional.of(prompt));
        when(promptVersionRepository.existsByPromptIdAndVersion(100L, "v1.0.0")).thenReturn(false);
        when(promptVersionRepository.existsByPromptIdAndStatus(100L, PromptVersionStatus.PUBLISHED)).thenReturn(true);

        promptSeedService.seedInitialPrompt(
                "TEST_PROMPT",
                "Test Prompt",
                "Description",
                PromptCategory.GENERATION,
                "Hello {{name}}"
        );

        verify(promptVersionRepository, never()).saveAndFlush(any(PromptVersion.class));
        verify(promptReviewHistoryRepository, never()).save(any(PromptReviewHistory.class));
    }

    @Test
    void testSeedInitialPrompt_BlankInputs_ThrowsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                promptSeedService.seedInitialPrompt("  ", "Test", "Desc", PromptCategory.GENERATION, "Content")
        );

        assertThrows(IllegalArgumentException.class, () ->
                promptSeedService.seedInitialPrompt("TEST", " ", "Desc", PromptCategory.GENERATION, "Content")
        );

        assertThrows(IllegalArgumentException.class, () ->
                promptSeedService.seedInitialPrompt("TEST", "Test", "Desc", PromptCategory.GENERATION, "  ")
        );
    }
}
