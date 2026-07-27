package com.lumiedu.prompt.controller;

import com.lumiedu.prompt.dto.response.AiExecutionLogResponse;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.prompt.service.AiExecutionLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/ai-execution-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiExecutionLogController {

    private final AiExecutionLogService aiExecutionLogService;

    @GetMapping
    public ResponseEntity<Page<AiExecutionLogResponse>> getLogs(
            @RequestParam(required = false) String studentCode,
            @RequestParam(required = false) String featureType,
            @RequestParam(required = false) String promptCode,
            @RequestParam(required = false) String promptVersion,
            @RequestParam(required = false) String knowledgeVersion,
            @RequestParam(required = false) String llmModel,
            @RequestParam(required = false) ExecutionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Boolean flaggedOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(aiExecutionLogService.getLogs(
                studentCode, featureType, promptCode, promptVersion,
                knowledgeVersion, llmModel, status, fromDate, toDate, flaggedOnly, pageable
        ));
    }

    @GetMapping("/{logId}")
    public ResponseEntity<AiExecutionLogResponse> getLogById(@PathVariable Long logId) {
        return ResponseEntity.ok(aiExecutionLogService.getLogById(logId));
    }

    @PatchMapping("/{logId}/dismiss-report")
    public ResponseEntity<AiExecutionLogResponse> dismissReport(@PathVariable Long logId) {
        return ResponseEntity.ok(aiExecutionLogService.resolveReport(logId));
    }
}
