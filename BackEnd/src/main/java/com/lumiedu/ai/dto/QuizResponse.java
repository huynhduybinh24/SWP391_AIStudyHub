package com.lumiedu.ai.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {
    private Long id;
    private Long documentId;
    private String title;
    private String promptUsed;
    private List<QuizQuestionResponse> questions;
}
