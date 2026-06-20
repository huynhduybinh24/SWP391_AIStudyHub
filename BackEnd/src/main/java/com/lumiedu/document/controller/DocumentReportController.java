package com.lumiedu.document.controller;

import com.lumiedu.document.dto.request.DocumentReportRequest;
import com.lumiedu.document.dto.response.ApiResponse;
import com.lumiedu.document.entity.DocumentReport;
import com.lumiedu.document.repository.DocumentReportRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class DocumentReportController {

    private final DocumentReportRepository documentReportRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> reportDocument(
            @RequestBody DocumentReportRequest request,
            Authentication authentication
    ) {
        log.info("Received request to report document ID: {}", request.getDocumentId());
        
        Long reporterId = getCurrentUserId(authentication);
        if (reporterId == null && request.getReporterEmail() != null) {
            // Fallback: lookup user by reporterEmail
            Optional<User> userOpt = userRepository.findByEmail(request.getReporterEmail());
            if (userOpt.isPresent()) {
                reporterId = userOpt.get().getId();
            }
        }
        
        // If still null, default to 1L to avoid DB null constraint error
        if (reporterId == null) {
            reporterId = 1L;
        }

        Long parsedDocId = null;
        String reportedFile = request.getReportedFile() != null ? request.getReportedFile() : "Mock Document";
        try {
            if (request.getDocumentId() != null) {
                parsedDocId = Long.parseLong(request.getDocumentId());
            }
        } catch (NumberFormatException e) {
            log.info("Document ID {} is not a valid Long, treating as mock file. Filename: {}", request.getDocumentId(), reportedFile);
            parsedDocId = 0L;
        }

        if (parsedDocId == null) {
            parsedDocId = 0L;
        }

        // Use details from payload as reason if available, otherwise fallback to reason
        String reportReasonText = request.getDetails() != null ? request.getDetails() : request.getReason();
        if (reportReasonText == null || reportReasonText.trim().isEmpty()) {
            reportReasonText = "No reason provided.";
        }

        if (parsedDocId == 0L) {
            reportReasonText = "[Tên tệp: " + reportedFile + "] " + reportReasonText;
        }

        DocumentReport report = DocumentReport.builder()
                .documentId(parsedDocId)
                .reporterId(reporterId)
                .reason(reportReasonText)
                .status("PENDING")
                .build();

        documentReportRepository.save(report);
        log.info("Document report saved successfully with ID: {}, parsedDocId: {}", report.getId(), parsedDocId);

        return ResponseEntity.ok(ApiResponse.ok("Report submitted successfully.", null));
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object details = authentication.getDetails();
        if (details instanceof Long) {
            return (Long) details;
        }
        return null;
    }
}
