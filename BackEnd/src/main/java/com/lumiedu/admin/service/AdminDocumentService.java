package com.lumiedu.admin.service;

import com.lumiedu.admin.dto.request.AdminDocumentModerationRequest;
import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import java.util.List;

public interface AdminDocumentService {
    List<AdminDocumentResponse> getDocuments(String keyword, String course, String type, String status, Long userId, int page, int size);
    AdminDocumentResponse getDocumentById(Long id);
    void deleteDocument(Long id);
    AdminDocumentResponse moderateDocument(Long id, AdminDocumentModerationRequest request);
}
