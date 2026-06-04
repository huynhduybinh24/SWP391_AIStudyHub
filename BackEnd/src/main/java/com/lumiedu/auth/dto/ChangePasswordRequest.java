package com.lumiedu.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {
    private Long userId;
    private String oldPassword;
    private String newPassword;
}
