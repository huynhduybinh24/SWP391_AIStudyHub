package com.lumiedu.document.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {

    private Long id;
    private String title;
    private String description;
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private String fileType;
    private String mimeType;
    private Long fileSize;
    private String subject;
    private String visibility;
    private Long userId;
    private String ownerName;
    private String ownerEmail;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
