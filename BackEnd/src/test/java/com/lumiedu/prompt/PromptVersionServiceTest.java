package com.lumiedu.prompt;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ChangeType;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptReviewHistoryRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.impl.PromptVersionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromptVersionServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PromptVersionRepository promptVersionRepository;

    @Mock
    private PromptReviewHistoryRepository promptReviewHistoryRepository;

    @InjectMocks
    private PromptVersionServiceImpl promptVersionService;

    private Prompt prompt;

    @BeforeEach
    void setUp() {
        prompt = Prompt.builder()
                .id(1L)
                .code("DOCUMENT_SUMMARY")
                .name("Document Summary")
                .build();
    }

    @Test
    void testCalculateNextVersion_Patch() {
        PromptVersion v1 = PromptVersion.builder()
                .prompt(prompt)
                .version("v1.2.3")
                .status(PromptVersionStatus.PUBLISHED)
                .build();

        when(promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(v1));

        String nextVersion = promptVersionService.calculateNextVersion(1L, ChangeType.PATCH);
        assertEquals("v1.2.4", nextVersion);
    }

    @Test
    void testCalculateNextVersion_Minor() {
        PromptVersion v1 = PromptVersion.builder()
                .prompt(prompt)
                .version("v1.2.3")
                .status(PromptVersionStatus.PUBLISHED)
                .build();

        when(promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(v1));

        String nextVersion = promptVersionService.calculateNextVersion(1L, ChangeType.MINOR);
        assertEquals("v1.3.0", nextVersion);
    }

    @Test
    void testCalculateNextVersion_Major() {
        PromptVersion v1 = PromptVersion.builder()
                .prompt(prompt)
                .version("v1.2.3")
                .status(PromptVersionStatus.PUBLISHED)
                .build();

        when(promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(v1));

        String nextVersion = promptVersionService.calculateNextVersion(1L, ChangeType.MAJOR);
        assertEquals("v2.0.0", nextVersion);
    }

    @Test
    void testCalculateNextVersion_EmptyHistory_ReturnsInitialV1() {
        when(promptVersionRepository.findByPromptIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());

        String nextVersion = promptVersionService.calculateNextVersion(1L, ChangeType.PATCH);
        assertEquals("v1.0.0", nextVersion);
    }
}
