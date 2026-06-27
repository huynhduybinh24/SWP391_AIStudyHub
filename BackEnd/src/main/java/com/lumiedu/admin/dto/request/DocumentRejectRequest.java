package com.lumiedu.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentRejectRequest {
    @NotBlank(message = "Rejection reason cannot be blank")
    private String reason;
}
