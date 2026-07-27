package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.request.ReviewPromptVersionRequest;
import com.lumiedu.prompt.dto.request.RollbackPromptRequest;
import com.lumiedu.prompt.dto.response.PromptReviewHistoryResponse;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.service.PromptRollbackService;
import com.lumiedu.prompt.service.PromptWorkflowService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/prompts/{promptId}")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromptWorkflowController {

    private final PromptWorkflowService promptWorkflowService;
    private final PromptRollbackService promptRollbackService;
    private final UserRepository userRepository;

    @PostMapping("/versions/{versionId}/submit-review")
    public ResponseEntity<PromptVersionResponse> submitForReview(
            @PathVariable Long promptId,
            @PathVariable Long versionId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptWorkflowService.submitForReview(versionId, currentUser));
    }

    @PostMapping("/versions/{versionId}/approve")
    public ResponseEntity<PromptVersionResponse> approveVersion(
            @PathVariable Long promptId,
            @PathVariable Long versionId,
            @RequestBody(required = false) ReviewPromptVersionRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptWorkflowService.approveVersion(versionId, request, currentUser));
    }

    @PostMapping("/versions/{versionId}/reject")
    public ResponseEntity<PromptVersionResponse> rejectVersion(
            @PathVariable Long promptId,
            @PathVariable Long versionId,
            @RequestBody @Valid ReviewPromptVersionRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptWorkflowService.rejectVersion(versionId, request, currentUser));
    }

    @PostMapping("/versions/{versionId}/publish")
    public ResponseEntity<PromptVersionResponse> publishVersion(
            @PathVariable Long promptId,
            @PathVariable Long versionId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptWorkflowService.publishVersion(versionId, currentUser));
    }

    @PostMapping("/rollback")
    public ResponseEntity<PromptVersionResponse> rollbackToVersion(
            @PathVariable Long promptId,
            @RequestBody @Valid RollbackPromptRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        PromptVersionResponse response = promptRollbackService.rollbackToVersion(promptId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/versions/{versionId}/history")
    public ResponseEntity<List<PromptReviewHistoryResponse>> getReviewHistory(
            @PathVariable Long promptId,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(promptWorkflowService.getReviewHistory(versionId));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Authentication is required.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new SecurityException("User not found: " + authentication.getName()));
    }
}
