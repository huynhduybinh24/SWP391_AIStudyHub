package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminDocumentModerationRequest;
import com.lumiedu.admin.dto.request.BulkDocumentRequest;
import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import com.lumiedu.admin.service.AdminDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;

    @GetMapping
    public ResponseEntity<List<AdminDocumentResponse>> getDocuments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminDocumentService.getDocuments(keyword, course, type, status, userId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminDocumentResponse> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(adminDocumentService.getDocumentById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        adminDocumentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/moderate")
    public ResponseEntity<AdminDocumentResponse> moderateDocument(
            @PathVariable Long id,
            @RequestBody @Valid AdminDocumentModerationRequest request) {
        return ResponseEntity.ok(adminDocumentService.moderateDocument(id, request));
    }

    @PostMapping("/bulk-approve")
    public ResponseEntity<?> bulkApprove(@RequestBody BulkDocumentRequest request) {
        int count = adminDocumentService.bulkApprove(request);
        return ResponseEntity.ok(java.util.Map.of("approved", count));
    }

    @PostMapping("/bulk-reject")
    public ResponseEntity<?> bulkReject(@RequestBody BulkDocumentRequest request) {
        int count = adminDocumentService.bulkReject(request);
        return ResponseEntity.ok(java.util.Map.of("rejected", count));
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<?> bulkDelete(@RequestBody BulkDocumentRequest request) {
        int count = adminDocumentService.bulkDelete(request);
        return ResponseEntity.ok(java.util.Map.of("deleted", count));
    }

    @GetMapping("/export-report")
    public ResponseEntity<String> exportReport(@RequestParam(required = false) List<Long> ids) {
        String csv = adminDocumentService.exportModerationReport(ids);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=moderation_report.csv")
                .body(csv);
    }
}
