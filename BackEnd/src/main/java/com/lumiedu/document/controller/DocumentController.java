package com.lumiedu.document.controller;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.request.TagRequest;
import com.lumiedu.document.dto.request.DocumentShareRequest;
import com.lumiedu.document.dto.response.ApiResponse;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.dto.response.SubjectStatsResponse;
import com.lumiedu.document.dto.response.DocumentShareResponse;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    // ------------------------------------------------------------------
    // POST /api/documents/upload
    // ------------------------------------------------------------------
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "visibility", defaultValue = "PRIVATE") String visibility,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "tags", required = false) List<String> tags
    ) {
        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title(title)
                .description(description)
                .subject(subject)
                .visibility(visibility)
                .userId(userId)
                .tags(tags)
                .build();

        DocumentResponse response = documentService.uploadDocument(file, request);
        return ResponseEntity.ok(ApiResponse.ok("Your document has been uploaded and is waiting for admin approval.", response));
    }

    // ------------------------------------------------------------------
    // POST /api/documents/upload-media
    // ------------------------------------------------------------------
    @PostMapping(value = "/upload-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "visibility", defaultValue = "PRIVATE") String visibility,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "tags", required = false) List<String> tags
    ) {
        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title(title)
                .description(description)
                .subject(subject)
                .visibility(visibility)
                .userId(userId)
                .tags(tags)
                .build();

        DocumentResponse response = documentService.uploadMedia(file, request);
        return ResponseEntity.ok(ApiResponse.ok("Media uploaded successfully.", response));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/my-uploads
    // ------------------------------------------------------------------
    @GetMapping("/my-uploads")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getMyUploads(
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        if (currentUserId == null) {
            throw new SecurityException("Authentication is required to view upload history.");
        }
        List<DocumentResponse> uploads = documentService.getMyUploads(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Upload history retrieved successfully.", uploads));
    }

    // ------------------------------------------------------------------
    // POST /api/documents/{documentId}/audio
    // ------------------------------------------------------------------
    @PostMapping(value = "/{documentId}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> recordAudio(
            @PathVariable Long documentId,
            @RequestParam("file") MultipartFile file
    ) {
        DocumentResponse response = documentService.recordAudio(file, documentId);
        return ResponseEntity.ok(ApiResponse.ok("Audio recorded and linked to document.", response));
    }

    // ------------------------------------------------------------------
    // GET /api/documents
    // ------------------------------------------------------------------
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getAllDocuments(
            @RequestParam(required = false) Long userId,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        boolean isAdmin = false;
        if (authentication != null) {
            isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        }
        Long targetUserId = userId;
        if (!isAdmin && targetUserId == null) {
            targetUserId = currentUserId;
        }
        List<DocumentResponse> documents = documentService.getAllDocuments(targetUserId);
        return ResponseEntity.ok(ApiResponse.ok("Documents retrieved successfully.", documents));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}
    // ------------------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        DocumentResponse document = documentService.getDocumentById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Document retrieved successfully.", document));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}/preview
    // ------------------------------------------------------------------
    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewDocument(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        Resource resource = documentService.previewDocument(id, currentUserId);
        String mimeType = resolveMimeType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resolveFilename(id) + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(resource);
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}/download
    // ------------------------------------------------------------------
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        Resource resource = documentService.downloadDocument(id, currentUserId);
        String mimeType = resolveMimeType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resolveFilename(id) + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(resource);
    }

    // ------------------------------------------------------------------
    // PUT /api/documents/{id}
    // ------------------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentUpdateRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        DocumentResponse response = documentService.updateDocument(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Document updated successfully.", response));
    }

    // ------------------------------------------------------------------
    // DELETE /api/documents/{id}
    // ------------------------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        documentService.deleteDocument(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully.", null));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/search
    // ------------------------------------------------------------------
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> searchDocuments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long userId,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        boolean isAdmin = false;
        if (authentication != null) {
            isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
        }
        Long targetUserId = userId;
        if (!isAdmin && targetUserId == null) {
            targetUserId = currentUserId;
        }
        List<DocumentResponse> results = documentService.searchDocuments(keyword, subject, fileType, tag, targetUserId);
        return ResponseEntity.ok(ApiResponse.ok("Search completed.", results));
    }

    // ------------------------------------------------------------------
    // POST /api/documents/{id}/tags
    // ------------------------------------------------------------------
    @PostMapping("/{id}/tags")
    public ResponseEntity<ApiResponse<Void>> addTag(
            @PathVariable Long id,
            @RequestBody TagRequest tagRequest
    ) {
        documentService.addTag(id, tagRequest.getName());
        return ResponseEntity.ok(ApiResponse.ok("Tag added successfully.", null));
    }

    // ------------------------------------------------------------------
    // DELETE /api/documents/{id}/tags/{tagName}
    // ------------------------------------------------------------------
    @DeleteMapping("/{id}/tags/{tagName}")
    public ResponseEntity<ApiResponse<Void>> removeTag(
            @PathVariable Long id,
            @PathVariable String tagName
    ) {
        documentService.removeTag(id, tagName);
        return ResponseEntity.ok(ApiResponse.ok("Tag removed successfully.", null));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/subject/{subjectId}/stats
    // ------------------------------------------------------------------
    @GetMapping("/subject/{subjectId}/stats")
    public ResponseEntity<ApiResponse<SubjectStatsResponse>> getSubjectStats(
            @PathVariable String subjectId,
            @RequestParam Long userId
    ) {
        SubjectStatsResponse stats = documentService.getSubjectStats(subjectId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Subject statistics retrieved successfully.", stats));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @GetMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<List<DocumentShareResponse>>> getDocumentShares(
            @PathVariable Long id,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        List<DocumentShareResponse> response = documentService.getDocumentShares(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Document shares retrieved successfully.", response));
    }

    // ------------------------------------------------------------------
    // POST /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @PostMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<DocumentShareResponse>> addOrUpdateDocumentShare(
            @PathVariable Long id,
            @RequestBody DocumentShareRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        DocumentShareResponse response = documentService.addOrUpdateDocumentShare(
                id, request.getEmail(), request.getRole(), currentUserId
        );
        return ResponseEntity.ok(ApiResponse.ok("Document share saved successfully.", response));
    }

    // ------------------------------------------------------------------
    // DELETE /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @DeleteMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<Void>> deleteDocumentShare(
            @PathVariable Long id,
            @RequestParam("email") String email,
            org.springframework.security.core.Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        documentService.deleteDocumentShare(id, email, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Document share deleted successfully.", null));
    }

    // ------------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------------
    private String resolveFilename(Long documentId) {
        return documentRepository.findByIdAndDeletedFalse(documentId)
                .map(d -> d.getOriginalFileName() != null ? d.getOriginalFileName() : d.getFileName())
                .orElse("document.pdf");
    }

    private String resolveMimeType(Long documentId) {
        return documentRepository.findByIdAndDeletedFalse(documentId)
                .map(d -> d.getMimeType() != null ? d.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
    }

    private Long getCurrentUserId(org.springframework.security.core.Authentication authentication) {
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
