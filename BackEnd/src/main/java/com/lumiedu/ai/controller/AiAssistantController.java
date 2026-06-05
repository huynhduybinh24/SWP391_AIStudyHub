package com.lumiedu.ai.controller;

import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.document.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    // ------------------------------------------------------------------
    // POST /api/ai/summary/generate
    // ------------------------------------------------------------------
    @PostMapping("/summary/generate")
    public ResponseEntity<ApiResponse<AiSummary>> generateSummary(@RequestParam("documentId") Long documentId) {
        AiSummary summary = aiAssistantService.generateSummary(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Summary generated successfully.", summary));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/summary/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/summary/{documentId}")
    public ResponseEntity<ApiResponse<AiSummary>> getSummary(@PathVariable("documentId") Long documentId) {
        AiSummary summary = aiAssistantService.getSummary(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Summary retrieved successfully.", summary));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/chat/session
    // ------------------------------------------------------------------
    @PostMapping("/chat/session")
    public ResponseEntity<ApiResponse<AiChatSession>> createOrGetChatSession(@RequestBody ChatSessionRequest request) {
        AiChatSession session = aiAssistantService.createOrGetChatSession(request.getDocumentId(), request.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Chat session retrieved or created successfully.", session));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/chat/messages
    // ------------------------------------------------------------------
    @GetMapping("/chat/messages")
    public ResponseEntity<ApiResponse<List<AiChatMessage>>> getChatHistory(@RequestParam("sessionId") Long sessionId) {
        List<AiChatMessage> history = aiAssistantService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Chat history retrieved successfully.", history));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/chat/send
    // ------------------------------------------------------------------
    @PostMapping("/chat/send")
    public ResponseEntity<ApiResponse<AiChatMessage>> sendMessage(@RequestBody SendMessageRequest request) {
        AiChatMessage aiMessage = aiAssistantService.sendMessage(request.getSessionId(), request.getMessageText());
        return ResponseEntity.ok(ApiResponse.ok("Message sent and reply received.", aiMessage));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/flashcards/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/flashcards/{documentId}")
    public ResponseEntity<ApiResponse<List<Flashcard>>> getFlashcards(@PathVariable("documentId") Long documentId) {
        List<Flashcard> flashcards = aiAssistantService.generateFlashcards(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Flashcards retrieved successfully.", flashcards));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/quiz/generate
    // ------------------------------------------------------------------
    @GetMapping("/quiz/generate")
    public ResponseEntity<ApiResponse<List<QuizQuestion>>> generateQuiz(
            @RequestParam("documentId") Long documentId,
            @RequestParam(value = "difficulty", defaultValue = "medium") String difficulty,
            @RequestParam(value = "count", defaultValue = "3") int count,
            @RequestParam(value = "prompt", defaultValue = "") String prompt
    ) {
        List<QuizQuestion> questions = aiAssistantService.generateQuiz(documentId, difficulty, count, prompt);
        return ResponseEntity.ok(ApiResponse.ok("Quiz generated successfully.", questions));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/quiz/modify
    // ------------------------------------------------------------------
    @PostMapping("/quiz/modify")
    public ResponseEntity<ApiResponse<List<QuizQuestion>>> modifyQuiz(@RequestBody ModifyQuizRequest request) {
        List<QuizQuestion> questions = aiAssistantService.modifyQuizWithAi(request.getDocumentId(), request.getPrompt());
        return ResponseEntity.ok(ApiResponse.ok("Quiz modified via AI prompt.", questions));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/quiz/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/quiz/{documentId}")
    public ResponseEntity<ApiResponse<List<QuizQuestion>>> getQuiz(@PathVariable("documentId") Long documentId) {
        List<QuizQuestion> questions = aiAssistantService.getQuiz(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Quiz retrieved successfully.", questions));
    }

    // --- Request DTOs ---

    @Data
    public static class ChatSessionRequest {
        private Long documentId;
        private Long userId;
    }

    @Data
    public static class SendMessageRequest {
        private Long sessionId;
        private String messageText;
    }

    @Data
    public static class ModifyQuizRequest {
        private Long documentId;
        private String prompt;
    }
}
