package com.lumiedu.ai.controller;

import com.lumiedu.ai.dto.QuizResponse;
import com.lumiedu.ai.dto.QuizSubmitResponse;
import com.lumiedu.ai.service.AiAssistantService;
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

    @GetMapping
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(@RequestParam("documentId") Long documentId) {
        QuizResponse quiz = aiAssistantService.getQuizResponse(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Quiz questions loaded successfully.", quiz));
    }

    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<QuizResponse>> regenerateQuiz(@RequestBody RegenerateRequest request) {
        QuizResponse quiz = aiAssistantService.regenerateQuizResponse(request.getDocumentId(), request.getPrompt());
        return ResponseEntity.ok(ApiResponse.ok("Quiz regenerated successfully.", quiz));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<QuizSubmitResponse>> submitQuiz(@RequestBody SubmitRequest request) {
        Long userId = request.getUserId();
        if (userId == null) {
            userId = 1L;
        }
        QuizSubmitResponse result = aiAssistantService.submitQuiz(
                userId,
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
// Force JDT LS revalidation
