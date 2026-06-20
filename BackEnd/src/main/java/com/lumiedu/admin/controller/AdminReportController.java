package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.response.DocumentReportResponse;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentReport;
import com.lumiedu.document.repository.DocumentReportRepository;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final DocumentReportRepository documentReportRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<DocumentReportResponse>> getReports() {
        List<DocumentReport> reports = documentReportRepository.findAllByOrderByCreatedAtDesc();
        List<DocumentReportResponse> responses = reports.stream().map(r -> {
            String reportedFile = "Deleted Document";
            Optional<Document> docOpt = documentRepository.findById(r.getDocumentId());
            if (docOpt.isPresent()) {
                reportedFile = docOpt.get().getTitle();
            } else if (r.getReason() != null && r.getReason().startsWith("[Tên tệp: ")) {
                int endIndex = r.getReason().indexOf("] ");
                if (endIndex > 0) {
                    reportedFile = r.getReason().substring(10, endIndex);
                }
            }

            String displayReason = r.getReason();
            if (displayReason != null && displayReason.startsWith("[Tên tệp: ")) {
                int endIndex = displayReason.indexOf("] ");
                if (endIndex > 0) {
                    displayReason = displayReason.substring(endIndex + 2);
                }
            }

            String reporterName = "Anonymous Student";
            String reporterEmail = "unknown@lumiedu.com";
            Optional<User> userOpt = userRepository.findById(r.getReporterId());
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                reporterName = u.getFullName() != null ? u.getFullName() : u.getEmail();
                reporterEmail = u.getEmail();
            }

            return DocumentReportResponse.builder()
                    .id(r.getId())
                    .documentId(r.getDocumentId())
                    .reportedFile(reportedFile)
                    .reporterId(r.getReporterId())
                    .reporterName(reporterName)
                    .reporterEmail(reporterEmail)
                    .reason(displayReason)
                    .status(r.getStatus().toLowerCase())
                    .createdAt(r.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DocumentReportResponse> updateReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        
        String status = body.getOrDefault("status", "pending").toUpperCase();
        
        Optional<DocumentReport> reportOpt = documentReportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DocumentReport report = reportOpt.get();
        report.setStatus(status);
        documentReportRepository.save(report);

        // Fetch details again for mapping
        String reportedFile = "Deleted Document";
        Optional<Document> docOpt = documentRepository.findById(report.getDocumentId());
        if (docOpt.isPresent()) {
            reportedFile = docOpt.get().getTitle();
        } else if (report.getReason() != null && report.getReason().startsWith("[Tên tệp: ")) {
            int endIndex = report.getReason().indexOf("] ");
            if (endIndex > 0) {
                reportedFile = report.getReason().substring(10, endIndex);
            }
        }

        String displayReason = report.getReason();
        if (displayReason != null && displayReason.startsWith("[Tên tệp: ")) {
            int endIndex = displayReason.indexOf("] ");
            if (endIndex > 0) {
                displayReason = displayReason.substring(endIndex + 2);
            }
        }

        String reporterName = "Anonymous Student";
        String reporterEmail = "unknown@lumiedu.com";
        Optional<User> userOpt = userRepository.findById(report.getReporterId());
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            reporterName = u.getFullName() != null ? u.getFullName() : u.getEmail();
            reporterEmail = u.getEmail();
        }

        DocumentReportResponse response = DocumentReportResponse.builder()
                .id(report.getId())
                .documentId(report.getDocumentId())
                .reportedFile(reportedFile)
                .reporterId(report.getReporterId())
                .reporterName(reporterName)
                .reporterEmail(reporterEmail)
                .reason(displayReason)
                .status(report.getStatus().toLowerCase())
                .createdAt(report.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }
}
