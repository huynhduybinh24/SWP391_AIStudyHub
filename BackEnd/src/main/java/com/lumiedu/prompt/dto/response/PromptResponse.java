package com.lumiedu.prompt.dto.response;

import com.lumiedu.prompt.enums.PromptCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private PromptCategory category;
    private Boolean active;
    private String currentPublishedVersion;
    private Long currentPublishedVersionId;
    private String createdByName;
    private Long createdById;
    private LocalDateTime createdAt;
    private String updatedByName;
    private Long updatedById;
    private LocalDateTime updatedAt;
    private Integer totalVersions;
}
