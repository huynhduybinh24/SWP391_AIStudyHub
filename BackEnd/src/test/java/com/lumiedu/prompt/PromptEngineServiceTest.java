package com.lumiedu.prompt;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.impl.PromptEngineServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromptEngineServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PromptVersionRepository promptVersionRepository;

    @InjectMocks
    private PromptEngineServiceImpl promptEngineService;

    private Prompt activePrompt;
    private PromptVersion publishedVersion;

    @BeforeEach
    void setUp() {
        activePrompt = Prompt.builder()
                .id(1L)
                .code("CHAT_QA")
                .name("Chat QA Prompt")
                .category(PromptCategory.CHAT)
                .active(true)
                .build();

        publishedVersion = PromptVersion.builder()
                .id(10L)
                .prompt(activePrompt)
                .version("v1.0.0")
                .markdownContent("# Role\nYou are an AI assistant.\n\n# User Question\n{{question}}")
                .status(PromptVersionStatus.PUBLISHED)
                .build();
    }

    @Test
    void testGetPublishedPromptVersion_Success() {
        when(promptRepository.findByCode("CHAT_QA")).thenReturn(Optional.of(activePrompt));
        when(promptVersionRepository.findPublishedVersionByPromptCode("CHAT_QA")).thenReturn(Optional.of(publishedVersion));

        PromptVersion result = promptEngineService.getPublishedPromptVersion("CHAT_QA");

        assertNotNull(result);
        assertEquals("v1.0.0", result.getVersion());
        assertEquals(PromptVersionStatus.PUBLISHED, result.getStatus());
    }

    @Test
    void testGetPublishedPromptVersion_InactivePrompt_ThrowsException() {
        activePrompt.setActive(false);
        when(promptRepository.findByCode("CHAT_QA")).thenReturn(Optional.of(activePrompt));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                promptEngineService.getPublishedPromptVersion("CHAT_QA")
        );

        assertTrue(exception.getMessage().contains("inactive"));
    }

    @Test
    void testGetPublishedPromptVersion_NoPublishedVersion_ThrowsException() {
        when(promptRepository.findByCode("CHAT_QA")).thenReturn(Optional.of(activePrompt));
        when(promptVersionRepository.findPublishedVersionByPromptCode("CHAT_QA")).thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                promptEngineService.getPublishedPromptVersion("CHAT_QA")
        );

        assertTrue(exception.getMessage().contains("No PUBLISHED version found"));
    }

    @Test
    void testRenderPromptContent_Success() {
        String template = "Hello {{studentName}}, welcome to {{course}}!";
        Map<String, Object> vars = new HashMap<>();
        vars.put("studentName", "John Doe");
        vars.put("course", "Java Spring Boot");

        String rendered = promptEngineService.renderPromptContent(template, vars);

        assertEquals("Hello John Doe, welcome to Java Spring Boot!", rendered);
    }

    @Test
    void testRenderPromptContent_MissingVariable_ThrowsException() {
        String template = "Hello {{studentName}}, welcome to {{course}}!";
        Map<String, Object> vars = new HashMap<>();
        vars.put("studentName", "John Doe");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                promptEngineService.renderPromptContent(template, vars)
        );

        assertTrue(exception.getMessage().contains("Unrendered variables detected"));
        assertTrue(exception.getMessage().contains("course"));
    }
}
