package com.lumiedu.prompt.dto.response;

import com.lumiedu.prompt.enums.ReviewAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromptReviewHistoryResponse {
    private Long id;
    private Long promptVersionId;
    private ReviewAction action;
    private String comment;
    private String performedByName;
    private Long performedById;
    private LocalDateTime performedAt;
}
