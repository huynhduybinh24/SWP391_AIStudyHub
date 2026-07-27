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
public class RollbackPromptRequest {

    @NotNull(message = "Target version ID to rollback to is required")
    private Long targetVersionId;

    @NotBlank(message = "Rollback reason is required")
    private String reason;

    @NotNull(message = "Change type is required (PATCH, MINOR, MAJOR)")
    private ChangeType changeType;
}
