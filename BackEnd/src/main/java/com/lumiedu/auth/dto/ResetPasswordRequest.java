package com.lumiedu.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {
    private String email;
    private String token;
    private String newPassword;
}
