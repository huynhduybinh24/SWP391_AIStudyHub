package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.request.CreatePromptVersionRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptVersionRequest;
import com.lumiedu.prompt.dto.response.PromptVersionResponse;
import com.lumiedu.prompt.service.PromptVersionService;
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
@RequestMapping("/api/admin/prompts/{promptId}/versions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromptVersionController {

    private final PromptVersionService promptVersionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<PromptVersionResponse>> getVersionsByPromptId(@PathVariable Long promptId) {
        return ResponseEntity.ok(promptVersionService.getVersionsByPromptId(promptId));
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<PromptVersionResponse> getVersionById(
            @PathVariable Long promptId,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(promptVersionService.getVersionById(versionId));
    }

    @PostMapping
    public ResponseEntity<PromptVersionResponse> createVersion(
            @PathVariable Long promptId,
            @RequestBody @Valid CreatePromptVersionRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        PromptVersionResponse response = promptVersionService.createVersion(promptId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{versionId}")
    public ResponseEntity<PromptVersionResponse> updateDraftVersion(
            @PathVariable Long promptId,
            @PathVariable Long versionId,
            @RequestBody @Valid UpdatePromptVersionRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptVersionService.updateDraftVersion(versionId, request, currentUser));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Authentication is required.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new SecurityException("User not found: " + authentication.getName()));
    }
}
