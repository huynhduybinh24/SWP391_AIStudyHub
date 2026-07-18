package com.lumiedu.ai.dto;

import lombok.*;
import java.util.List;

public class StudioResponses {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioSummaryResponse {
        private String summaryText;
        private List<String> keyBullets;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioMindmapResponse {
        private String mermaidCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioInfographicResponse {
        private String title;
        private String subtitle;
        private List<InfographicItem> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InfographicItem {
        private String label;
        private String value;
        private String description;
        private String iconType; // "brain", "lightbulb", "chart", "star"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioFlashcardResponse {
        private String front;
        private String back;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioQuizResponse {
        private String questionText;
        private List<String> options;
        private int answerIndex;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudioFaqResponse {
        private String question;
        private String answer;
    }
}
