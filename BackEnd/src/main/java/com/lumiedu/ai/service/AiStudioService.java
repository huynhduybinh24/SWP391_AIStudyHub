package com.lumiedu.ai.service;

import com.lumiedu.ai.dto.StudioResponses.*;

import java.util.List;

public interface AiStudioService {
    StudioSummaryResponse generateSummary(List<Long> documentIds, String language);
    StudioMindmapResponse generateMindmap(List<Long> documentIds, String language);
    StudioInfographicResponse generateInfographic(List<Long> documentIds, String language);
    List<StudioFlashcardResponse> generateFlashcards(List<Long> documentIds, String language);
    List<StudioQuizResponse> generateQuiz(List<Long> documentIds, String difficulty, int count, String language);
    List<StudioFaqResponse> generateFaq(List<Long> documentIds, String language);
}
