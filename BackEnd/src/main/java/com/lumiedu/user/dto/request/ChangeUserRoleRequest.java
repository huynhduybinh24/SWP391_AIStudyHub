package com.lumiedu.user.dto.request;

import com.lumiedu.user.enums.UserRole;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeUserRoleRequest {
    private UserRole role;
}
