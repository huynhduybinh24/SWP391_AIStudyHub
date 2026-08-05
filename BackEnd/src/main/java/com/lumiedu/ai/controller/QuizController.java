package com.lumiedu.ai.controller;

import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.document.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class QuizController {

    private final AiAssistantService aiAssistantService;
    private final AiDocumentAccessService aiDocumentAccessService;

    @GetMapping
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(
            @RequestParam("documentId") Long documentId,
            @RequestParam(value = "userId", required = false) Long userId) {
        aiDocumentAccessService.validateAndGetDocument(documentId);
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();
        QuizResponse quiz = aiAssistantService.getQuizResponse(documentId, authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.ok("Quiz questions loaded successfully.", quiz));
    }

    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<QuizResponse>> regenerateQuiz(@RequestBody RegenerateRequest request) {
        if (request == null || request.getDocumentId() == null) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Document ID is required.");
        }
        aiDocumentAccessService.validateAndGetDocument(request.getDocumentId());
        QuizResponse quiz = aiAssistantService.regenerateQuizResponse(request.getDocumentId(), request.getPrompt());
        return ResponseEntity.ok(ApiResponse.ok("Quiz regenerated successfully.", quiz));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<QuizSubmitResponse>> submitQuiz(@RequestBody SubmitRequest request) {
        if (request == null || request.getDocumentId() == null) {
            throw AiApiException.badRequest("AI_INVALID_REQUEST", "Document ID is required.");
        }
        aiDocumentAccessService.validateAndGetDocument(request.getDocumentId());
        Long authenticatedUserId = aiDocumentAccessService.getCurrentUserId();

        QuizSubmitResponse result = aiAssistantService.submitQuiz(
                authenticatedUserId,
                request.getDocumentId(),
                request.getAnswers()
        );
        return ResponseEntity.ok(ApiResponse.ok("Quiz submitted and graded successfully.", result));
    }

    @Data
    public static class RegenerateRequest {
        private Long documentId;
        private String prompt;
    }

    @Data
    public static class SubmitRequest {
        private Long userId;
        private Long documentId;
        private Map<Long, Integer> answers;
    }
}
