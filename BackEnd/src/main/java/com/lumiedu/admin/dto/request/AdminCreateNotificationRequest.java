package com.lumiedu.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCreateNotificationRequest {
    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotBlank(message = "Title cannot be blank")
    private String title;

    private String message;
    private String content; // Alias for message

    private String type;
    private String variant; // Alias for type
}
