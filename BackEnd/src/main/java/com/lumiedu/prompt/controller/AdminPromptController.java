package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.request.CreatePromptRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptRequest;
import com.lumiedu.prompt.dto.response.PromptResponse;
import com.lumiedu.prompt.service.PromptService;
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
@RequestMapping("/api/admin/prompts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromptController {

    private final PromptService promptService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<PromptResponse>> getAllPrompts() {
        return ResponseEntity.ok(promptService.getAllPrompts());
    }

    @GetMapping("/{promptId}")
    public ResponseEntity<PromptResponse> getPromptById(@PathVariable Long promptId) {
        return ResponseEntity.ok(promptService.getPromptById(promptId));
    }

    @PostMapping
    public ResponseEntity<PromptResponse> createPrompt(
            @RequestBody @Valid CreatePromptRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        PromptResponse response = promptService.createPrompt(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{promptId}")
    public ResponseEntity<PromptResponse> updatePrompt(
            @PathVariable Long promptId,
            @RequestBody @Valid UpdatePromptRequest request,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptService.updatePrompt(promptId, request, currentUser));
    }

    @PatchMapping("/{promptId}/status")
    public ResponseEntity<PromptResponse> togglePromptStatus(
            @PathVariable Long promptId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        return ResponseEntity.ok(promptService.togglePromptStatus(promptId, currentUser));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Authentication is required.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new SecurityException("User not found: " + authentication.getName()));
    }
}
