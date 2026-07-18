package com.lumiedu.admin.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserRequest {
    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    private String email;

    private String avatarUrl;
}
