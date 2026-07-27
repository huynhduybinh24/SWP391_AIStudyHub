package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.entity.Prompt;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.repository.PromptRepository;
import com.lumiedu.prompt.repository.PromptVersionRepository;
import com.lumiedu.prompt.service.PromptEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromptEngineServiceImpl implements PromptEngineService {

    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([a-zA-Z0-9_]+)\\}\\}");

    @Override
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
    public RenderedPromptResult renderPrompt(String promptCode, Map<String, Object> variables) {
        PromptVersion publishedVersion = getPublishedPromptVersion(promptCode);
        String renderedContent = renderPromptContent(publishedVersion.getMarkdownContent(), variables);
        return new RenderedPromptResult(publishedVersion, renderedContent);
    }
}
