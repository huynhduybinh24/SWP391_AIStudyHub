package com.lumiedu.ai.service;

import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.entity.*;
import java.util.List;
import java.util.Map;

public interface AiAssistantService {

    AiSummary generateSummary(Long documentId, String language);

    AiSummary getSummary(Long documentId, String language);

    AiChatSession createOrGetChatSession(List<Long> documentIds, Long userId);

    List<AiChatMessage> getChatHistory(Long sessionId);

    AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode);

    List<Flashcard> generateFlashcards(Long documentId);

    // Old quiz methods adapted to new entity
    List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt);

    List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt);

    List<QuizQuestion> getQuiz(Long documentId);

    // New quiz methods supporting pooling and randomized question bank
    QuizResponse getQuizResponse(Long documentId);

    QuizResponse regenerateQuizResponse(Long documentId, String prompt);

    QuizSubmitResponse submitQuiz(Long userId, Long documentId, Map<Long, Integer> answers);

    StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks, List<Long> documentIds);

    List<StudyPlan> getStudyPlans(Long userId);

    List<AiChatSession> getUserSessions(Long userId);
}
