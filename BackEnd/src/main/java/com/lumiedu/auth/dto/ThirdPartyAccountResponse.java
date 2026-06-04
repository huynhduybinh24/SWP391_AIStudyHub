package com.lumiedu.auth.dto;

import com.lumiedu.auth.enums.ProviderType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyAccountResponse {
    private Long id;
    private ProviderType providerType;
    private String providerEmail;
    private LocalDateTime linkedAt;
}
