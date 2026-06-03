package com.lumiedu.user.dto.request;

import com.lumiedu.user.enums.AccountStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeAccountStatusRequest {
    private AccountStatus accountStatus;
}
