package com.lumiedu.ai.controller;

import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.AiChatSessionRepository;
import com.lumiedu.ai.repository.StudyPlanRepository;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.document.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final AiDocumentAccessService aiDocumentAccessService;
    private final AiChatSessionRepository aiChatSessionRepository;
    private final StudyPlanRepository studyPlanRepository;

    // ------------------------------------------------------------------
    // POST /api/ai/summary/generate
    // ------------------------------------------------------------------
    @PostMapping("/summary/generate")
    public ResponseEntity<ApiResponse<AiSummary>> generateSummary(
            @RequestParam("documentId") Long documentId,
            @RequestParam(value = "language", defaultValue = "vi") String language) {
        aiDocumentAccessService.validateAndGetDocument(documentId);
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
        aiDocumentAccessService.validateAndGetDocument(documentId);
        AiSummary summary = aiAssistantService.getSummary(documentId, language);
        return ResponseEntity.ok(ApiResponse.ok("Summary retrieved successfully.", summary));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/chat/session
    // ------------------------------------------------------------------
    @PostMapping("/chat/session")
    public ResponseEntity<ApiResponse<AiChatSession>> createOrGetChatSession(@RequestBody ChatSessionRequest request) {
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();

        List<Long> ids = request != null ? request.getDocumentIds() : null;
        if (ids == null || ids.isEmpty()) {
            ids = new ArrayList<>();
            if (request != null && request.getDocumentId() != null) {
                ids.add(request.getDocumentId());
            }
        }

        if (!ids.isEmpty()) {
            aiDocumentAccessService.validateAndGetDocuments(ids);
        }

        AiChatSession session = aiAssistantService.createOrGetChatSession(ids, authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.ok("Chat session retrieved or created successfully.", session));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/chat/sessions?userId=X
    // ------------------------------------------------------------------
    @GetMapping("/chat/sessions")
    public ResponseEntity<ApiResponse<List<AiChatSession>>> getUserSessions(@RequestParam(value = "userId", required = false) Long userId) {
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        List<AiChatSession> sessions = aiAssistantService.getUserSessions(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.ok("Chat sessions retrieved successfully.", sessions));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/chat/messages
    // ------------------------------------------------------------------
    @GetMapping("/chat/messages")
    public ResponseEntity<ApiResponse<List<AiChatMessage>>> getChatHistory(@RequestParam("sessionId") Long sessionId) {
        if (sessionId == null || sessionId <= 0) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Session ID is required.");
        }

        AiChatSession session = aiChatSessionRepository.findById(sessionId)
                .orElseThrow(() -> AiApiException.notFound("AI_SESSION_FORBIDDEN", "Chat session not found or forbidden."));

        validateSessionAccess(session);

        List<AiChatMessage> history = aiAssistantService.getChatHistory(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Chat history retrieved successfully.", history));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/chat/send
    // ------------------------------------------------------------------
    @PostMapping("/chat/send")
    public ResponseEntity<ApiResponse<AiChatMessage>> sendMessage(@RequestBody SendMessageRequest request) {
        if (request == null || request.getSessionId() == null) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Session ID is required.");
        }
        if (request.getMessageText() == null || request.getMessageText().trim().isEmpty()) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Message text must not be empty.");
        }

        AiChatSession session = aiChatSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> AiApiException.notFound("AI_SESSION_FORBIDDEN", "Chat session not found or forbidden."));

        validateSessionAccess(session);

        boolean thinking = request.getThinkingMode() != null && request.getThinkingMode();
        AiChatMessage aiMessage = aiAssistantService.sendMessage(request.getSessionId(), request.getMessageText(), thinking);
        return ResponseEntity.ok(ApiResponse.ok("Message sent and reply received.", aiMessage));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/flashcards/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/flashcards/{documentId}")
    public ResponseEntity<ApiResponse<List<Flashcard>>> getFlashcards(@PathVariable("documentId") Long documentId) {
        aiDocumentAccessService.validateAndGetDocument(documentId);
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
        aiDocumentAccessService.validateAndGetDocument(documentId);
        if (count <= 0 || count > 50) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Quiz count must be between 1 and 50.");
        }
        List<QuizQuestion> questions = aiAssistantService.generateQuiz(documentId, difficulty, count, prompt);
        return ResponseEntity.ok(ApiResponse.ok("Quiz generated successfully.", questions));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/quiz/modify
    // ------------------------------------------------------------------
    @PostMapping("/quiz/modify")
    public ResponseEntity<ApiResponse<List<QuizQuestion>>> modifyQuiz(@RequestBody ModifyQuizRequest request) {
        if (request == null || request.getDocumentId() == null) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Document ID is required.");
        }
        if (request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Prompt must not be empty.");
        }
        aiDocumentAccessService.validateAndGetDocument(request.getDocumentId());
        List<QuizQuestion> questions = aiAssistantService.modifyQuizWithAi(request.getDocumentId(), request.getPrompt());
        return ResponseEntity.ok(ApiResponse.ok("Quiz modified via AI prompt.", questions));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/quiz/{documentId}
    // ------------------------------------------------------------------
    @GetMapping("/quiz/{documentId}")
    public ResponseEntity<ApiResponse<List<QuizQuestion>>> getQuiz(@PathVariable("documentId") Long documentId) {
        aiDocumentAccessService.validateAndGetDocument(documentId);
        List<QuizQuestion> questions = aiAssistantService.getQuiz(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Quiz retrieved successfully.", questions));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/study-plans/generate
    // ------------------------------------------------------------------
    @PostMapping("/study-plans/generate")
    public ResponseEntity<ApiResponse<StudyPlan>> generateStudyPlan(@RequestBody StudyPlanRequest request) {
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        if (request != null && request.getUserId() != null) {
            aiDocumentAccessService.verifyUserAccess(request.getUserId());
        }

        List<Long> docIds = request != null ? request.getDocumentIds() : null;
        if (docIds == null || docIds.isEmpty()) {
            docIds = new ArrayList<>();
            if (request != null && request.getDocumentId() != null) {
                docIds.add(request.getDocumentId());
            }
        }

        if (!docIds.isEmpty()) {
            aiDocumentAccessService.validateAndGetDocuments(docIds);
        }

        int duration = (request != null && request.getDurationWeeks() != null) ? request.getDurationWeeks() : 4;
        String subject = (request != null && request.getSubject() != null) ? request.getSubject() : "General Study";
        String goal = (request != null && request.getGoal() != null) ? request.getGoal() : "Master Core Concepts";

        StudyPlan plan = aiAssistantService.generateStudyPlan(
                authenticatedUserId,
                subject,
                goal,
                duration,
                docIds);
        return ResponseEntity.ok(ApiResponse.ok("Study plan generated successfully.", plan));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/study-plans/user/{userId}
    // ------------------------------------------------------------------
    @GetMapping("/study-plans/user/{userId}")
    public ResponseEntity<ApiResponse<List<StudyPlan>>> getStudyPlans(@PathVariable("userId") Long userId) {
        aiDocumentAccessService.verifyUserAccess(userId);
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        List<StudyPlan> plans = aiAssistantService.getStudyPlans(authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.ok("Study plans retrieved successfully.", plans));
    }

    // ------------------------------------------------------------------
    // GET /api/ai/study-plans/{planId}/completed-lessons
    // ------------------------------------------------------------------
    @GetMapping("/study-plans/{planId}/completed-lessons")
    public ResponseEntity<ApiResponse<List<String>>> getCompletedLessons(@PathVariable("planId") Long planId) {
        verifyStudyPlanOwnership(planId);
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
        verifyStudyPlanOwnership(planId);
        List<String> lessonIds = request != null ? request.getLessonIds() : new ArrayList<>();
        List<String> updatedIds = aiAssistantService.updateCompletedLessons(planId, lessonIds);
        return ResponseEntity.ok(ApiResponse.ok("Completed lessons updated.", updatedIds));
    }

    // ------------------------------------------------------------------
    // POST /api/ai/study-plans
    // ------------------------------------------------------------------
    @PostMapping("/study-plans")
    public ResponseEntity<ApiResponse<StudyPlan>> createStudyPlan(@RequestBody StudyPlan studyPlan) {
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        if (studyPlan != null) {
            studyPlan.setUserId(authenticatedUserId);
        }
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
        verifyStudyPlanOwnership(id);
        StudyPlan updated = aiAssistantService.updateStudyPlan(id, studyPlan);
        return ResponseEntity.ok(ApiResponse.ok("Study plan updated successfully.", updated));
    }

    // ------------------------------------------------------------------
    // DELETE /api/ai/study-plans/{id}
    // ------------------------------------------------------------------
    @DeleteMapping("/study-plans/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudyPlan(@PathVariable("id") Long id) {
        verifyStudyPlanOwnership(id);
        aiAssistantService.deleteStudyPlan(id);
        return ResponseEntity.ok(ApiResponse.ok("Study plan deleted successfully.", null));
    }

    private void verifyStudyPlanOwnership(Long planId) {
        if (planId == null || planId <= 0) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Study plan ID is required.");
        }
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        StudyPlan plan = studyPlanRepository.findById(planId)
                .orElseThrow(() -> AiApiException.notFound("AI_UNAUTHORIZED", "Study plan not found or access forbidden."));
        if (!authenticatedUserId.equals(plan.getUserId())) {
            aiDocumentAccessService.verifyUserAccess(plan.getUserId());
        }
    }

    private void validateSessionAccess(AiChatSession session) {
        if (session == null) return;
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();

        if (authenticatedUserId.equals(session.getUserId())) {
            return;
        }

        try {
            com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
            if (currentUser.getRole() == com.lumiedu.user.enums.UserRole.ADMIN) {
                return;
            }
        } catch (Exception ignored) {}

        List<Long> docIds = new ArrayList<>();
        if (session.getDocuments() != null && !session.getDocuments().isEmpty()) {
            for (com.lumiedu.document.entity.Document doc : session.getDocuments()) {
                if (doc != null && doc.getId() != null) {
                    docIds.add(doc.getId());
                }
            }
        } else if (session.getDocumentId() != null) {
            docIds.add(session.getDocumentId());
        }

        if (!docIds.isEmpty()) {
            try {
                aiDocumentAccessService.validateAndGetDocuments(docIds);
                return; // User has valid access to session's documents
            } catch (Exception ignored) {}
        }

        throw AiApiException.forbidden("AI_UNAUTHORIZED", "You are not authorized to access data belonging to another user.");
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
