package com.lumiedu.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSystemStatusRequest {
    @NotBlank(message = "System mode cannot be blank")
    private String systemMode; // NORMAL, MAINTENANCE, INCIDENT

    @NotBlank(message = "System message cannot be blank")
    private String systemMessage;
}
