package com.lumiedu.prompt.service;

import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public interface PromptEngineService {

    /**
     * Retrieves the currently PUBLISHED prompt version for the specified prompt code.
     * Throws an exception if prompt is inactive or no PUBLISHED version exists.
     */
    PromptVersion getPublishedPromptVersion(String promptCode);

    /**
     * Renders variables into the markdown content of the prompt.
     * Throws exception if required placeholders in {{key}} format are missing in variables map.
     */
    String renderPromptContent(String markdownTemplate, Map<String, Object> variables);

    /**
     * Helper to render prompt content for a given prompt code directly.
     */
    RenderedPromptResult renderPrompt(String promptCode, Map<String, Object> variables);

    /**
     * Full execution flow: Resolve Published Prompt Version -> Render -> Create Processing Log -> Call Gemini -> Update Log (SUCCESS/FAILED) -> Return Result + Metadata.
     */
    PromptEngineExecutionResult executePrompt(
            String promptCode,
            Map<String, Object> variables,
            User user,
            String studentCode,
            String featureType,
            String knowledgeBaseId,
            String knowledgeVersion,
            boolean isJson
    );

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    class RenderedPromptResult {
        private PromptVersion promptVersion;
        private String renderedContent;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    class PromptEngineExecutionResult {
        private String content;
        private PromptVersion promptVersion;
        private Long logId;
        private String requestId;
        private String promptCode;
        private String promptVersionNumber;
        private String knowledgeVersion;
        private String llmProvider;
        private String llmModel;
        private int promptTokens;
        private int completionTokens;
    }
}
