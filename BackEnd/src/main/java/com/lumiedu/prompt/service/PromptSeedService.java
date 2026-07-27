package com.lumiedu.prompt.service;

import com.lumiedu.prompt.enums.PromptCategory;

public interface PromptSeedService {
    void seedInitialPrompt(
            String code,
            String name,
            String description,
            PromptCategory category,
            String markdownContent
    );
}
