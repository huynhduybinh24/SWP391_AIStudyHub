package com.lumiedu.document.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentShareResponse {
    private Long id;
    private Long documentId;
    private String shareeEmail;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
