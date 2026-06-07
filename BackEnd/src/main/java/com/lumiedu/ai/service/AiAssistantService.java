package com.lumiedu.ai.service;

import com.lumiedu.ai.entity.*;
import java.util.List;

public interface AiAssistantService {

    AiSummary generateSummary(Long documentId, String language);

    AiSummary getSummary(Long documentId, String language);

    AiChatSession createOrGetChatSession(Long documentId, Long userId);

    List<AiChatMessage> getChatHistory(Long sessionId);

    AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode);

    List<Flashcard> generateFlashcards(Long documentId);

    List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt);

    List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt);

    List<QuizQuestion> getQuiz(Long documentId);

    StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks, List<Long> documentIds);

    List<StudyPlan> getStudyPlans(Long userId);
}
