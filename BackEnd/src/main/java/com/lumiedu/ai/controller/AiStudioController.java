package com.lumiedu.ai.controller;

import com.lumiedu.ai.dto.StudioResponses.*;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.ai.service.AiStudioService;
import com.lumiedu.document.dto.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/studio")
@RequiredArgsConstructor
public class AiStudioController {

    private final AiStudioService aiStudioService;
    private final AiDocumentAccessService aiDocumentAccessService;

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<StudioSummaryResponse>> generateSummary(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        StudioSummaryResponse response = aiStudioService.generateSummary(request.getDocumentIds(), request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("Summary generated successfully.", response));
    }

    @PostMapping("/mindmap")
    public ResponseEntity<ApiResponse<StudioMindmapResponse>> generateMindmap(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        StudioMindmapResponse response = aiStudioService.generateMindmap(request.getDocumentIds(), request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("Mind map generated successfully.", response));
    }

    @PostMapping("/infographic")
    public ResponseEntity<ApiResponse<StudioInfographicResponse>> generateInfographic(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        StudioInfographicResponse response = aiStudioService.generateInfographic(request.getDocumentIds(), request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("Infographic generated successfully.", response));
    }

    @PostMapping("/flashcards")
    public ResponseEntity<ApiResponse<List<StudioFlashcardResponse>>> generateFlashcards(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        List<StudioFlashcardResponse> response = aiStudioService.generateFlashcards(request.getDocumentIds(), request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("Flashcards generated successfully.", response));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<List<StudioQuizResponse>>> generateQuiz(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        String difficulty = request.getDifficulty() != null ? request.getDifficulty() : "medium";
        int count = request.getCount() != null ? request.getCount() : 5;
        List<StudioQuizResponse> response = aiStudioService.generateQuiz(request.getDocumentIds(), difficulty, count, request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("Quiz generated successfully.", response));
    }

    @PostMapping("/faq")
    public ResponseEntity<ApiResponse<List<StudioFaqResponse>>> generateFaq(@RequestBody StudioRequest request) {
        validateStudioRequest(request);
        aiDocumentAccessService.validateAndGetDocuments(request.getDocumentIds());
        List<StudioFaqResponse> response = aiStudioService.generateFaq(request.getDocumentIds(), request.getLanguage());
        return ResponseEntity.ok(ApiResponse.ok("FAQ generated successfully.", response));
    }

    private void validateStudioRequest(StudioRequest request) {
        if (request == null || request.getDocumentIds() == null || request.getDocumentIds().isEmpty()) {
            throw AiApiException.badRequest("AI_DOCUMENT_REQUIRED", "At least one document ID is required for AI Studio processing.");
        }
    }

    @Data
    public static class StudioRequest {
        private List<Long> documentIds;
        private String language;
        private String difficulty;
        private Integer count;
    }
}
