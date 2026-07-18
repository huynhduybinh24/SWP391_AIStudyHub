package com.lumiedu.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDocumentModerationRequest {
    @NotBlank(message = "Status cannot be blank")
    private String status; // e.g. "APPROVED", "REJECTED"

    private String reason;
}
