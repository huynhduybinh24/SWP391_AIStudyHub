package com.lumiedu.support.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportMessageRequest {
    @NotBlank(message = "Message content cannot be blank")
    private String messageContent;

    @NotBlank(message = "Sender name cannot be blank")
    private String senderName;

    @NotBlank(message = "Sender email cannot be blank")
    private String senderEmail;

    private Boolean isFromAdmin;
}
