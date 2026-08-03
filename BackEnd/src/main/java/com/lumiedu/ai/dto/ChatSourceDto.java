package com.lumiedu.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSourceDto {
    private Long documentId;
    private String documentTitle;
    private Long chunkId;
    private Integer chunkIndex;
    private Integer pageNumber;
    private String section;
    private String excerpt;
}
