package com.lumiedu.prompt.dto.request;

import com.lumiedu.prompt.enums.PromptCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePromptRequest {

    @NotBlank(message = "Prompt code is required")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Prompt code must contain only uppercase letters, numbers, and underscores")
    private String code;

    @NotBlank(message = "Prompt name is required")
    private String name;

    private String description;

    @NotNull(message = "Category is required")
    private PromptCategory category;

    @NotBlank(message = "Initial markdown content is required")
    private String initialMarkdownContent;

    private String changeSummary;

    private String changeReason;
}
