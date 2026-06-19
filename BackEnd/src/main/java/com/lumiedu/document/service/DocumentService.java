package com.lumiedu.document.service;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.entity.DocumentShare;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {

    DocumentResponse uploadDocument(MultipartFile file, DocumentCreateRequest request);

    DocumentResponse uploadMedia(MultipartFile file, DocumentCreateRequest request);

    DocumentResponse recordAudio(MultipartFile file, Long documentId);

    List<DocumentResponse> getAllDocuments(Long userId);

    DocumentResponse getDocumentById(Long id);

    DocumentResponse updateDocument(Long id, DocumentUpdateRequest request);

    void deleteDocument(Long id);

    Resource downloadDocument(Long id, Long userId);

    Resource previewDocument(Long id);

    List<DocumentResponse> searchDocuments(
            String keyword,
            String subject,
            String fileType,
            String tag,
            Long userId
    );

    void addTag(Long documentId, String tagName);

    void removeTag(Long documentId, String tagName);

    List<DocumentShare> getDocumentShares(Long documentId);

    DocumentShare addOrUpdateDocumentShare(Long documentId, String email, String role);

    void deleteDocumentShare(Long documentId, String email);
}
