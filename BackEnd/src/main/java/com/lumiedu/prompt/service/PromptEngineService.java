package com.lumiedu.prompt.service;

import com.lumiedu.prompt.entity.PromptVersion;

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

    class RenderedPromptResult {
        private final PromptVersion promptVersion;
        private final String renderedContent;

        public RenderedPromptResult(PromptVersion promptVersion, String renderedContent) {
            this.promptVersion = promptVersion;
            this.renderedContent = renderedContent;
        }

        public PromptVersion getPromptVersion() {
            return promptVersion;
        }

        public String getRenderedContent() {
            return renderedContent;
        }
    }
}
