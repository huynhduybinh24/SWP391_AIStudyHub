package com.lumiedu.prompt.dto.request;

import com.lumiedu.prompt.enums.PromptCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePromptRequest {

    @NotBlank(message = "Prompt name is required")
    private String name;

    private String description;

    @NotNull(message = "Category is required")
    private PromptCategory category;
}
