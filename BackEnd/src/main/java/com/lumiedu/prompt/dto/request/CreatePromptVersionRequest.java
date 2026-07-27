package com.lumiedu.prompt.dto.request;

import com.lumiedu.prompt.enums.ChangeType;
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
public class CreatePromptVersionRequest {

    @NotBlank(message = "Markdown content is required")
    private String markdownContent;

    @NotNull(message = "Change type is required (PATCH, MINOR, MAJOR)")
    private ChangeType changeType;

    @NotBlank(message = "Change summary is required")
    private String changeSummary;

    @NotBlank(message = "Change reason is required")
    private String changeReason;

    private Long basedOnVersionId;
}
