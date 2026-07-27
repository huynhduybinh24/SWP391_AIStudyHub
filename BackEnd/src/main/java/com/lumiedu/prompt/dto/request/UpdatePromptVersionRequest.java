package com.lumiedu.prompt.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePromptVersionRequest {

    @NotBlank(message = "Markdown content is required")
    private String markdownContent;

    private String changeSummary;

    private String changeReason;
}
