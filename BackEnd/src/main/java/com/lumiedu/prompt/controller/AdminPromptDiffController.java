package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.response.PromptDiffResponse;
import com.lumiedu.prompt.service.PromptDiffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/prompts/{promptId}/diff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromptDiffController {

    private final PromptDiffService promptDiffService;

    @GetMapping
    public ResponseEntity<PromptDiffResponse> compareVersions(
            @PathVariable Long promptId,
            @RequestParam Long fromVersionId,
            @RequestParam Long toVersionId
    ) {
        return ResponseEntity.ok(promptDiffService.compareVersions(fromVersionId, toVersionId));
    }
}
