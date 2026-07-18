package com.lumiedu.admin.dto.request;

import com.lumiedu.user.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateUserStatusRequest {
    @NotNull(message = "Status cannot be null")
    private AccountStatus status;

    private String reason;
}
