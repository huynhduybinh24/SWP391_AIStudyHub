package com.lumiedu.prompt;

import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.prompt.service.impl.PromptEngineServiceImpl;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PromptExecutionLogUserResolutionTest {

    @Mock
    private PromptRepository promptRepository;
    @Mock
    private PromptVersionRepository promptVersionRepository;
    @Mock
    private AiExecutionLogService aiExecutionLogService;
    @Mock
    private GeminiService geminiService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PromptEngineServiceImpl promptEngineService;

    private User testUser;
    private User adminUser;
    private Prompt testPrompt;
    private PromptVersion testVersion;
    private AiExecutionLog mockLog;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        testUser = User.builder()
                .id(100L)
                .email("student@lumiedu.com")
                .role(UserRole.USER)
                .build();

        adminUser = User.builder()
                .id(999L)
                .email("admin@lumiedu.com")
                .role(UserRole.ADMIN)
                .build();

        testPrompt = Prompt.builder()
                .id(1L)
                .code("CHAT_QA")
                .name("Chat QA")
                .active(true)
                .build();

        testVersion = PromptVersion.builder()
                .id(10L)
                .prompt(testPrompt)
                .version("v1.0.0")
                .markdownContent("System: Answer {{question}}")
                .build();

        mockLog = AiExecutionLog.builder()
                .id(55L)
                .user(testUser)
                .featureType("CHAT_QA")
                .prompt(testPrompt)
                .promptCode("CHAT_QA")
                .promptVersionEntity(testVersion)
                .promptVersion("v1.0.0")
                .status(ExecutionStatus.PROCESSING)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockPromptResolution() {
        when(promptRepository.findByCode("CHAT_QA")).thenReturn(Optional.of(testPrompt));
        when(promptVersionRepository.findPublishedVersionByPromptCode("CHAT_QA")).thenReturn(Optional.of(testVersion));
    }

    @Test
    @DisplayName("1. Authenticated user passed directly is attached to AiExecutionLog")
    void testDirectAuthenticatedUserAttachedToLog() {
        mockPromptResolution();
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockLog);

        OpenAiResponse response = OpenAiResponse.builder()
                .content("AI Answer")
                .promptTokens(10)
                .completionTokens(20)
                .build();
        when(geminiService.chat(anyList(), anyBoolean())).thenReturn(response);

        Map<String, Object> vars = new HashMap<>();
        vars.put("question", "What is Java?");

        promptEngineService.executePrompt("CHAT_QA", vars, testUser, "student@lumiedu.com", "CHAT_QA", "kb1", "v1", false);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(aiExecutionLogService).createProcessingLog(
                userCaptor.capture(),
                eq("student@lumiedu.com"),
                eq("CHAT_QA"),
                eq(testVersion),
                eq("kb1"),
                eq("v1"),
                eq("Google"),
                anyString(),
                anyString(),
                any()
        );

        assertNotNull(userCaptor.getValue());
        assertEquals(100L, userCaptor.getValue().getId());
        assertEquals("student@lumiedu.com", userCaptor.getValue().getEmail());
    }

    @Test
    @DisplayName("2. SecurityContext user is resolved when user parameter is null")
    void testSecurityContextUserResolvedWhenParameterIsNull() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("student@lumiedu.com", null, List.of());
        auth.setDetails(100L);
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockPromptResolution();
        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockLog);

        OpenAiResponse response = OpenAiResponse.builder()
                .content("AI Answer")
                .promptTokens(10)
                .completionTokens(20)
                .build();
        when(geminiService.chat(anyList(), anyBoolean())).thenReturn(response);

        promptEngineService.executePrompt("CHAT_QA", Map.of("question", "Test"), null, null, "STUDIO_SUMMARY", null, null, false);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(aiExecutionLogService).createProcessingLog(
                userCaptor.capture(),
                eq("student@lumiedu.com"),
                eq("STUDIO_SUMMARY"),
                eq(testVersion),
                any(),
                any(),
                any(),
                any(),
                any(),
                any()
        );

        assertEquals(100L, userCaptor.getValue().getId());
    }

    @Test
    @DisplayName("3. System admin user fallback when SecurityContext is absent (background task)")
    void testSystemAdminFallbackForBackgroundExecution() {
        mockPromptResolution();
        when(userRepository.findByEmail("admin@lumiedu.com")).thenReturn(Optional.of(adminUser));
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockLog);

        OpenAiResponse response = OpenAiResponse.builder()
                .content("System Answer")
                .promptTokens(5)
                .completionTokens(5)
                .build();
        when(geminiService.chat(anyList(), anyBoolean())).thenReturn(response);

        promptEngineService.executePrompt("CHAT_QA", Map.of("question", "BG Task"), null, null, "DOCUMENT_MODERATION", null, null, false);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(aiExecutionLogService).createProcessingLog(
                userCaptor.capture(),
                eq("admin@lumiedu.com"),
                eq("DOCUMENT_MODERATION"),
                eq(testVersion),
                any(),
                any(),
                any(),
                any(),
                any(),
                any()
        );

        assertNotNull(userCaptor.getValue());
        assertEquals(999L, userCaptor.getValue().getId());
    }

    @Test
    @DisplayName("4. Failed Gemini execution updates log status with sanitized error message")
    void testFailedGeminiExecutionUpdatesLogSafely() {
        mockPromptResolution();
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockLog);

        when(geminiService.chat(anyList(), anyBoolean()))
                .thenThrow(new RuntimeException("API key key=AIzaSySecretTokenFailed failed to authenticate"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            promptEngineService.executePrompt("CHAT_QA", Map.of("question", "Fail"), testUser, "student@lumiedu.com", "CHAT_QA", null, null, false);
        });

        assertTrue(ex.getMessage().contains("key=[REDACTED]"));
        assertFalse(ex.getMessage().contains("AIzaSySecretTokenFailed"));

        ArgumentCaptor<String> errCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiExecutionLogService).updateLogStatus(
                eq(55L),
                eq(ExecutionStatus.FAILED),
                errCaptor.capture(),
                eq(0),
                isNull(),
                isNull()
        );

        assertFalse(errCaptor.getValue().contains("AIzaSySecretTokenFailed"));
        assertTrue(errCaptor.getValue().contains("key=[REDACTED]"));
    }

    @Test
    @DisplayName("5. Log update exception does not recursive fail or hide original exception")
    void testLogUpdateFailureHandledGracefully() {
        mockPromptResolution();
        when(aiExecutionLogService.createProcessingLog(any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockLog);

        when(geminiService.chat(anyList(), anyBoolean())).thenThrow(new RuntimeException("Gemini quota exceeded"));
        doThrow(new RuntimeException("DB Connection lost")).when(aiExecutionLogService).updateLogStatus(anyLong(), any(), any(), anyInt(), any(), any());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            promptEngineService.executePrompt("CHAT_QA", Map.of("question", "Quota"), testUser, "student@lumiedu.com", "CHAT_QA", null, null, false);
        });

        assertTrue(ex.getMessage().contains("Gemini quota exceeded"));
    }
}
