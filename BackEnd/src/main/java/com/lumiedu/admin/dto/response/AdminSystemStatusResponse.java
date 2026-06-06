package com.lumiedu.admin.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSystemStatusResponse {
    private String systemMode;
    private String systemMessage;
}
