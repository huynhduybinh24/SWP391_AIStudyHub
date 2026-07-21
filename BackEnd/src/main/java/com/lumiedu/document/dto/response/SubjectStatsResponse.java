package com.lumiedu.document.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectStatsResponse {
    private int studyProgress;      // 0 to 100
    private Double averageScore;    // 0.0 to 10.0 (Null if no quiz taken)
    private String rank;            // e.g. "Rank #5" or "Top 5% of class"
    private int totalQuizzes;       // Real count of completed quiz attempts
    private String aiRecommendation;// Dynamic recommendation text
}
