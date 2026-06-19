package com.lumiedu.document.controller;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.request.TagRequest;
import com.lumiedu.document.dto.request.DocumentShareRequest;
import com.lumiedu.document.dto.response.ApiResponse;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.entity.DocumentShare;
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
        return ResponseEntity.ok(ApiResponse.ok("Document uploaded successfully.", response));
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
            @RequestParam(required = false) Long userId
    ) {
        List<DocumentResponse> documents = documentService.getAllDocuments(userId);
        return ResponseEntity.ok(ApiResponse.ok("Documents retrieved successfully.", documents));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}
    // ------------------------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(@PathVariable Long id) {
        DocumentResponse document = documentService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok("Document retrieved successfully.", document));
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}/preview
    // ------------------------------------------------------------------
    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> previewDocument(@PathVariable Long id) {
        Resource resource = documentService.previewDocument(id);
        String mimeType = resolveMimeType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(resource);
    }

    // ------------------------------------------------------------------
    // GET /api/documents/{id}/download
    // ------------------------------------------------------------------
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId
    ) {
        Resource resource = documentService.downloadDocument(id, userId);
        String mimeType = resolveMimeType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(resource);
    }

    // ------------------------------------------------------------------
    // PUT /api/documents/{id}
    // ------------------------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentUpdateRequest request
    ) {
        DocumentResponse response = documentService.updateDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Document updated successfully.", response));
    }

    // ------------------------------------------------------------------
    // DELETE /api/documents/{id}
    // ------------------------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
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
            @RequestParam(required = false) Long userId
    ) {
        List<DocumentResponse> results = documentService.searchDocuments(keyword, subject, fileType, tag, userId);
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
    // GET /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @GetMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<List<DocumentShare>>> getDocumentShares(
            @PathVariable Long id
    ) {
        List<DocumentShare> shares = documentService.getDocumentShares(id);
        return ResponseEntity.ok(ApiResponse.ok("Shares retrieved successfully.", shares));
    }

    // ------------------------------------------------------------------
    // POST /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @PostMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<DocumentShare>> addOrUpdateDocumentShare(
            @PathVariable Long id,
            @RequestBody DocumentShareRequest request
    ) {
        DocumentShare response = documentService.addOrUpdateDocumentShare(
                id, request.getEmail(), request.getRole()
        );
        return ResponseEntity.ok(ApiResponse.ok("Share added or updated successfully.", response));
    }

    // ------------------------------------------------------------------
    // DELETE /api/documents/{id}/shares
    // ------------------------------------------------------------------
    @DeleteMapping("/{id}/shares")
    public ResponseEntity<ApiResponse<Void>> deleteDocumentShare(
            @PathVariable Long id,
            @RequestParam String email
    ) {
        documentService.deleteDocumentShare(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Share deleted successfully.", null));
    }

    // ------------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------------
    private String resolveMimeType(Long documentId) {
        return documentRepository.findByIdAndDeletedFalse(documentId)
                .map(d -> d.getMimeType() != null ? d.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
    }
}
