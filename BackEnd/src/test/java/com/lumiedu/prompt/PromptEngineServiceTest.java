package com.lumiedu.prompt;

import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.PromptCategory;
import com.lumiedu.prompt.enums.PromptVersionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult;
import com.lumiedu.prompt.service.impl.PromptEngineServiceImpl;
import com.lumiedu.user.entity.User;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromptEngineServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PromptVersionRepository promptVersionRepository;

    @Mock
    private AiExecutionLogService aiExecutionLogService;

    @Mock
    private GeminiService geminiService;

    @InjectMocks
    private PromptEngineServiceImpl promptEngineService;

    private Prompt activePrompt;
    private PromptVersion publishedVersion;
    private User testUser;
    private AiExecutionLog processingLog;

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

        testUser = User.builder()
                .id(100L)
                .email("student@lumiedu.vn")
                .fullName("Test Student")
                .build();

        processingLog = AiExecutionLog.builder()
                .id(999L)
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

    @Test
    void testExecutePrompt_Success() {
        when(promptRepository.findByCode("CHAT_QA")).thenReturn(Optional.of(activePrompt));
        when(promptVersionRepository.findPublishedVersionByPromptCode("CHAT_QA")).thenReturn(Optional.of(publishedVersion));
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(processingLog);
        when(geminiService.chat(anyList(), anyBoolean())).thenReturn(OpenAiResponse.builder()
                .content("Answer from Gemini AI")
                .promptTokens(10)
                .completionTokens(20)
                .build());

        Map<String, Object> vars = new HashMap<>();
        vars.put("question", "What is Java?");

        PromptEngineExecutionResult result = promptEngineService.executePrompt(
                "CHAT_QA",
                vars,
                testUser,
                "STU001",
                "CHAT_QA",
                "kb-123",
                "v1.0.0",
                false
        );

        assertNotNull(result);
        assertEquals("Answer from Gemini AI", result.getContent());
        assertEquals("v1.0.0", result.getPromptVersionNumber());
        assertEquals("Google", result.getLlmProvider());
        verify(aiExecutionLogService, times(1)).updateLogStatus(eq(999L), any(), any(), eq(30), any(), any());
    }
}
