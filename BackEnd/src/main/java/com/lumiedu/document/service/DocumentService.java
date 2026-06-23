package com.lumiedu.document.service;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.dto.response.SubjectStatsResponse;
import com.lumiedu.document.dto.response.DocumentShareResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {

    DocumentResponse uploadDocument(MultipartFile file, DocumentCreateRequest request);

    DocumentResponse uploadMedia(MultipartFile file, DocumentCreateRequest request);

    DocumentResponse recordAudio(MultipartFile file, Long documentId);

    List<DocumentResponse> getAllDocuments(Long userId);

    DocumentResponse getDocumentById(Long id, Long currentUserId);

    DocumentResponse updateDocument(Long id, DocumentUpdateRequest request, Long currentUserId);

    void deleteDocument(Long id, Long currentUserId);

    Resource downloadDocument(Long id, Long currentUserId);

    Resource previewDocument(Long id, Long currentUserId);

    List<DocumentResponse> searchDocuments(
            String keyword,
            String subject,
            String fileType,
            String tag,
            Long userId
    );

    void addTag(Long documentId, String tagName);

    void removeTag(Long documentId, String tagName);

    SubjectStatsResponse getSubjectStats(String subjectId, Long userId);

    List<DocumentShareResponse> getDocumentShares(Long documentId, Long currentUserId);

    DocumentShareResponse addOrUpdateDocumentShare(Long documentId, String email, String role, Long currentUserId);

    void deleteDocumentShare(Long documentId, String email, Long currentUserId);
}
