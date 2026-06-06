package com.lumiedu.admin.dto.request;

import com.lumiedu.user.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserRoleRequest {
    @NotNull(message = "Role cannot be null")
    private UserRole role;
}
