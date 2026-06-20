package com.lumiedu.document.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentShareRequest {
    private String email;
    private String role;
}
