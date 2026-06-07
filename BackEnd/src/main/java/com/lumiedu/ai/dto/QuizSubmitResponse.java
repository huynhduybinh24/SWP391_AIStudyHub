package com.lumiedu.ai.dto;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmitResponse {
    private Long attemptId;
    private Integer score; // percentage
    private Integer correctCount;
    private Integer totalQuestions;
    private Map<Long, Integer> correctAnswers; // questionId -> correct answer index
    private Map<Long, String> explanations; // questionId -> explanation
}
