package com.lumiedu.ai.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionResponse {
    private Long id;
    private String text;
    private List<String> options;
    private Integer answerIndex;
    private String explanation;
}
