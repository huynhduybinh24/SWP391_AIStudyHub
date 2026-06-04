package com.lumiedu.auth.dto;

import com.lumiedu.auth.enums.ProviderType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkThirdPartyAccountRequest {
    private Long userId;
    private ProviderType providerType;
    private String providerUserId;
    private String providerEmail;
}
