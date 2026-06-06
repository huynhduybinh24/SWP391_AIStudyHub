package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminDocumentModerationRequest;
import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import com.lumiedu.admin.service.AdminDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
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

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/{id}")
    public ResponseEntity<AdminDocumentResponse> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(adminDocumentService.getDocumentById(id));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        adminDocumentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PatchMapping("/{id}/moderate")
    public ResponseEntity<AdminDocumentResponse> moderateDocument(
            @PathVariable Long id,
            @RequestBody @Valid AdminDocumentModerationRequest request) {
        return ResponseEntity.ok(adminDocumentService.moderateDocument(id, request));
    }
}
