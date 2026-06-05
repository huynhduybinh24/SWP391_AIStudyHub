package com.lumiedu.ai.service;

import com.lumiedu.ai.entity.*;
import java.util.List;

public interface AiAssistantService {

    AiSummary generateSummary(Long documentId);

    AiSummary getSummary(Long documentId);

    AiChatSession createOrGetChatSession(Long documentId, Long userId);

    List<AiChatMessage> getChatHistory(Long sessionId);

    AiChatMessage sendMessage(Long sessionId, String messageText);

    List<Flashcard> generateFlashcards(Long documentId);

    List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt);

    List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt);

    List<QuizQuestion> getQuiz(Long documentId);
}
