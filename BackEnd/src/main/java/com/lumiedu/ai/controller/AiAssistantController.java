package com.lumiedu.ai.controller;

import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.document.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    // ------------------------------------------------------------------
    // POST /api/ai/summary/generate
    // ------------------------------------------------------------------
    @PostMapping("/summary/generate")
    public ResponseEntity<ApiResponse<AiSummary>> generateSummary(
            @RequestParam("documentId") Long documentId,
            @RequestParam(value = "language", defaultValue = "vi") String language) {
        AiSummary summary = aiAssistantService.generateSummary(documentId, language);
        return ResponseEntity.ok(ApiResponse.ok("Summary generated successfully.", summary));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/summary/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/summary/{documentId}")
    public ResponseEntity<ApiResponse<AiSummary>> getSummary(
            @PathVariable("documentId") Long documentId,
            @RequestParam(value = "language", defaultValue = "vi") String language) {
        AiSummary summary = aiAssistantService.getSummary(documentId, language);
        return ResponseEntity.ok(ApiResponse.ok("Summary retrieved successfully.", summary));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/chat/session
    // ------------------------------------------------------------------
    @PostMapping("/chat/session")
    public ResponseEntity<ApiResponse<AiChatSession>> createOrGetChatSession(@RequestBody ChatSessionRequest request) {
        List<Long> ids = request.getDocumentIds();
        if (ids == null || ids.isEmpty()) {
            ids = new java.util.ArrayList<>();
            if (request.getDocumentId() != null) {
                ids.add(request.getDocumentId());
            }
        }
        AiChatSession session = aiAssistantService.createOrGetChatSession(ids, request.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Chat session retrieved or created successfully.", session));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/chat/sessions?userId=X
    // ------------------------------------------------------------------
    @GetMapping("/chat/sessions")
    public ResponseEntity<ApiResponse<List<AiChatSession>>> getUserSessions(@RequestParam("userId") Long userId) {
        List<AiChatSession> sessions = aiAssistantService.getUserSessions(userId);
        return ResponseEntity.ok(ApiResponse.ok("Chat sessions retrieved successfully.", sessions));
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
        boolean thinking = request.getThinkingMode() != null && request.getThinkingMode();
        AiChatMessage aiMessage = aiAssistantService.sendMessage(request.getSessionId(), request.getMessageText(), thinking);
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
            @RequestParam(value = "count", defaultValue = "10") int count,
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

    // ------------------------------------------------------------------
    // POST /api/ai/study-plans/generate
    // ------------------------------------------------------------------
    @PostMapping("/study-plans/generate")
    public ResponseEntity<ApiResponse<StudyPlan>> generateStudyPlan(@RequestBody StudyPlanRequest request) {
        List<Long> docIds = request.getDocumentIds();
        if (docIds == null || docIds.isEmpty()) {
            docIds = new ArrayList<>();
            if (request.getDocumentId() != null) {
                docIds.add(request.getDocumentId());
            }
        }
        StudyPlan plan = aiAssistantService.generateStudyPlan(
                request.getUserId(),
                request.getSubject(),
                request.getGoal(),
                request.getDurationWeeks(),
                docIds);
        return ResponseEntity.ok(ApiResponse.ok("Study plan generated successfully.", plan));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/study-plans/user/{userId}
    // ------------------------------------------------------------------
    @GetMapping("/study-plans/user/{userId}")
    public ResponseEntity<ApiResponse<List<StudyPlan>>> getStudyPlans(@PathVariable("userId") Long userId) {
        List<StudyPlan> plans = aiAssistantService.getStudyPlans(userId);
        return ResponseEntity.ok(ApiResponse.ok("Study plans retrieved successfully.", plans));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/study-plans/{planId}/completed-lessons
    // ------------------------------------------------------------------
    @GetMapping("/study-plans/{planId}/completed-lessons")
    public ResponseEntity<ApiResponse<List<String>>> getCompletedLessons(@PathVariable("planId") Long planId) {
        List<String> completedIds = aiAssistantService.getCompletedLessons(planId);
        return ResponseEntity.ok(ApiResponse.ok("Completed lessons retrieved.", completedIds));
    }

    // ------------------------------------------------------------------
    // PUT /api/ai/study-plans/{planId}/completed-lessons
    // ------------------------------------------------------------------
    @PutMapping("/study-plans/{planId}/completed-lessons")
    public ResponseEntity<ApiResponse<List<String>>> updateCompletedLessons(
            @PathVariable("planId") Long planId,
            @RequestBody CompletedLessonsRequest request) {
        List<String> updatedIds = aiAssistantService.updateCompletedLessons(planId, request.getLessonIds());
        return ResponseEntity.ok(ApiResponse.ok("Completed lessons updated.", updatedIds));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/study-plans
    // ------------------------------------------------------------------
    @PostMapping("/study-plans")
    public ResponseEntity<ApiResponse<StudyPlan>> createStudyPlan(@RequestBody StudyPlan studyPlan) {
        StudyPlan saved = aiAssistantService.saveStudyPlan(studyPlan);
        return ResponseEntity.ok(ApiResponse.ok("Study plan saved successfully.", saved));
    }

    // ------------------------------------------------------------------
    // PUT /api/ai/study-plans/{id}
    // ------------------------------------------------------------------
    @PutMapping("/study-plans/{id}")
    public ResponseEntity<ApiResponse<StudyPlan>> updateStudyPlan(
            @PathVariable("id") Long id,
            @RequestBody StudyPlan studyPlan) {
        StudyPlan updated = aiAssistantService.updateStudyPlan(id, studyPlan);
        return ResponseEntity.ok(ApiResponse.ok("Study plan updated successfully.", updated));
    }

    // ------------------------------------------------------------------
    // DELETE /api/ai/study-plans/{id}
    // ------------------------------------------------------------------
    @DeleteMapping("/study-plans/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudyPlan(@PathVariable("id") Long id) {
        aiAssistantService.deleteStudyPlan(id);
        return ResponseEntity.ok(ApiResponse.ok("Study plan deleted successfully.", null));
    }

    // --- Request DTOs ---

    @Data
    public static class ChatSessionRequest {
        private Long documentId;
        private List<Long> documentIds;
        private Long userId;
    }

    @Data
    public static class SendMessageRequest {
        private Long sessionId;
        private String messageText;
        private Boolean thinkingMode;
    }

    @Data
    public static class ModifyQuizRequest {
        private Long documentId;
        private String prompt;
    }

    @Data
    public static class StudyPlanRequest {
        private Long userId;
        private String subject;
        private String goal;
        private Integer durationWeeks;
        private Long documentId;
        private List<Long> documentIds;
    }

    @Data
    public static class CompletedLessonsRequest {
        private List<String> lessonIds;
    }
}
