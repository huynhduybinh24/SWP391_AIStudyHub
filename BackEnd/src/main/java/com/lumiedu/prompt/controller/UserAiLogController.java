package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.request.ReportAiLogRequest;
import com.lumiedu.prompt.dto.response.AiExecutionLogResponse;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-execution-logs")
@RequiredArgsConstructor
public class UserAiLogController {

    private final AiExecutionLogService aiExecutionLogService;
    private final UserRepository userRepository;

    @PostMapping("/{logId}/report")
    public ResponseEntity<AiExecutionLogResponse> reportLog(
            @PathVariable Long logId,
            @Valid @RequestBody ReportAiLogRequest request,
            Authentication authentication
    ) {
        User currentUser = null;
        if (authentication != null && authentication.getName() != null) {
            currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        }
        return ResponseEntity.ok(aiExecutionLogService.reportLog(logId, request.getReason(), currentUser));
    }
}
