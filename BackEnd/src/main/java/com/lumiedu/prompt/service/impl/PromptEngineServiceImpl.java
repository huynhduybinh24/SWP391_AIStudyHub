package com.lumiedu.prompt.service.impl;

import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.prompt.service.PromptEngineService;
import com.lumiedu.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PromptEngineServiceImpl implements PromptEngineService {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final AiExecutionLogService aiExecutionLogService;
    private final GeminiService geminiService;

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([a-zA-Z0-9_]+)\\}\\}");

    @Override
    @Transactional(readOnly = true)
    public PromptVersion getPublishedPromptVersion(String promptCode) {
        if (promptCode == null || promptCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Prompt code must not be null or empty.");
        }

        String normalizedCode = promptCode.trim().toUpperCase();

        Prompt prompt = promptRepository.findByCode(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("Prompt not found for code: " + normalizedCode));

        if (Boolean.FALSE.equals(prompt.getActive())) {
            throw new IllegalStateException("Prompt '" + normalizedCode + "' is currently inactive.");
        }

        return promptVersionRepository.findPublishedVersionByPromptCode(normalizedCode)
                .orElseThrow(() -> new IllegalStateException(
                        "No PUBLISHED version found for active prompt code: " + normalizedCode +
                        ". DRAFT, IN_REVIEW, APPROVED, REJECTED, or ARCHIVED versions cannot be used by AI Engine."));
    }

    @Override
    public String renderPromptContent(String markdownTemplate, Map<String, Object> variables) {
        if (markdownTemplate == null || markdownTemplate.trim().isEmpty()) {
            throw new IllegalArgumentException("Markdown template must not be null or empty.");
        }

        String rendered = markdownTemplate;

        if (variables != null) {
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                String key = entry.getKey();
                Object val = entry.getValue();
                String valueStr = val != null ? val.toString() : "";
                rendered = rendered.replace("{{" + key + "}}", valueStr);
            }
        }

        // Validate unrendered placeholders
        Matcher matcher = VARIABLE_PATTERN.matcher(rendered);
        List<String> missingVars = new ArrayList<>();
        while (matcher.find()) {
            missingVars.add(matcher.group(1));
        }

        if (!missingVars.isEmpty()) {
            throw new IllegalArgumentException(
                    "Failed to render prompt. Unrendered variables detected: " + missingVars +
                    ". All placeholders must be provided before sending to AI Model.");
        }

        return rendered;
    }

    @Override
    @Transactional(readOnly = true)
    public RenderedPromptResult renderPrompt(String promptCode, Map<String, Object> variables) {
        PromptVersion publishedVersion = getPublishedPromptVersion(promptCode);
        String renderedContent = renderPromptContent(publishedVersion.getMarkdownContent(), variables);
        return RenderedPromptResult.builder()
                .promptVersion(publishedVersion)
                .renderedContent(renderedContent)
                .build();
    }

    @Override
    public PromptEngineExecutionResult executePrompt(
            String promptCode,
            Map<String, Object> variables,
            User user,
            String studentCode,
            String featureType,
            String knowledgeBaseId,
            String knowledgeVersion,
            boolean isJson
    ) {
        // 1. Resolve Published Version and Render Prompt Content
        RenderedPromptResult renderedResult = renderPrompt(promptCode, variables);
        PromptVersion publishedVersion = renderedResult.getPromptVersion();
        String renderedSystemPrompt = renderedResult.getRenderedContent();

        String requestId = "req-" + UUID.randomUUID().toString();
        String finalKnowledgeVersion = (knowledgeVersion == null || knowledgeVersion.trim().isEmpty())
                ? "UNVERSIONED"
                : knowledgeVersion.trim();

        // 2. Create Processing Log BEFORE calling Gemini
        AiExecutionLog logEntry = aiExecutionLogService.createProcessingLog(
                user,
                studentCode,
                featureType != null ? featureType : promptCode,
                publishedVersion,
                knowledgeBaseId,
                finalKnowledgeVersion,
                "Google",
                "gemini-3.1-flash-lite",
                requestId,
                variables != null ? variables.toString() : null
        );

        Long logId = logEntry.getId();

        try {
            // 3. Construct Gemini Chat Payload
            List<ChatMessageDto> messages = new ArrayList<>();
            messages.add(ChatMessageDto.builder()
                    .role("system")
                    .content(renderedSystemPrompt)
                    .build());

            // If user question/query is passed separately, add user message
            if (variables != null && variables.containsKey("question")) {
                Object qVal = variables.get("question");
                if (qVal != null && !qVal.toString().trim().isEmpty()) {
                    messages.add(ChatMessageDto.builder()
                            .role("user")
                            .content(qVal.toString())
                            .build());
                }
            }

            // 4. Call Gemini AI API
            OpenAiResponse aiResponse = geminiService.chat(messages, isJson);
            String aiResultText = aiResponse != null ? aiResponse.getContent() : "";

            int promptTokens = aiResponse != null ? aiResponse.getPromptTokens() : 0;
            int completionTokens = aiResponse != null ? aiResponse.getCompletionTokens() : 0;
            int totalTokens = promptTokens + completionTokens;

            // 5. Update Log to SUCCESS
            aiExecutionLogService.updateLogStatus(
                    logId,
                    ExecutionStatus.SUCCESS,
                    null,
                    totalTokens,
                    aiResultText != null && aiResultText.length() > 500 ? aiResultText.substring(0, 500) + "..." : aiResultText,
                    null
            );

            return PromptEngineExecutionResult.builder()
                    .content(aiResultText)
                    .promptVersion(publishedVersion)
                    .logId(logId)
                    .requestId(requestId)
                    .promptCode(publishedVersion.getPrompt().getCode())
                    .promptVersionNumber(publishedVersion.getVersion())
                    .knowledgeVersion(finalKnowledgeVersion)
                    .llmProvider("Google")
                    .llmModel("gemini-3.1-flash-lite")
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .build();

        } catch (Exception e) {
            log.error("AI Execution failed for promptCode={}, version={}: {}", promptCode, publishedVersion.getVersion(), e.getMessage(), e);

            // 6. Update Log to FAILED
            aiExecutionLogService.updateLogStatus(
                    logId,
                    ExecutionStatus.FAILED,
                    e.getMessage(),
                    0,
                    null,
                    null
            );

            throw new RuntimeException("AI Engine Execution Failed [" + promptCode + " - " + publishedVersion.getVersion() + "]: " + e.getMessage(), e);
        }
    }
}
