package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminDocumentModerationRequest;
import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import com.lumiedu.admin.mapper.AdminDocumentMapper;
import com.lumiedu.admin.service.AdminDocumentService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminDocumentServiceImpl implements AdminDocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminDocumentResponse> getDocuments(String keyword, String course, String type, String status, Long userId, int page, int size) {
        // Lấy tất cả documents chưa xoá
        List<Document> docs = documentRepository.findAllByDeletedFalse();

        // Lọc theo keyword (tiêu đề hoặc mô tả)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            docs = docs.stream()
                    .filter(d -> (d.getTitle() != null && d.getTitle().toLowerCase().contains(lowerKeyword))
                            || (d.getDescription() != null && d.getDescription().toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
        }

        // Lọc theo userId
        if (userId != null) {
            docs = docs.stream()
                    .filter(d -> d.getUserId() != null && d.getUserId().equals(userId))
                    .collect(Collectors.toList());
        }

        // Lọc theo type (fileType)
        if (type != null && !type.trim().isEmpty()) {
            docs = docs.stream()
                    .filter(d -> d.getFileType() != null && d.getFileType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
        }

        // Lọc theo course (subject)
        if (course != null && !course.trim().isEmpty()) {
            docs = docs.stream()
                    .filter(d -> d.getSubject() != null && d.getSubject().equalsIgnoreCase(course))
                    .collect(Collectors.toList());
        }

        // Sắp xếp theo ID giảm dần (tài liệu mới nhất lên đầu)
        docs.sort(Comparator.comparing(Document::getId).reversed());

        // Phân trang thủ công
        int total = docs.size();
        int start = page * size;
        if (start >= total) {
            docs = Collections.emptyList();
        } else {
            int end = Math.min(start + size, total);
            docs = docs.subList(start, end);
        }

        // Tìm tất cả users để tránh n+1 queries
        List<Long> userIds = docs.stream()
                .map(Document::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return docs.stream()
                .map(d -> {
                    User owner = d.getUserId() != null ? userMap.get(d.getUserId()) : null;
                    return AdminDocumentMapper.toResponse(d, owner);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDocumentResponse getDocumentById(Long id) {
        Document doc = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Document not found or has been deleted. ID: " + id));
        User owner = doc.getUserId() != null ? userRepository.findById(doc.getUserId()).orElse(null) : null;
        return AdminDocumentMapper.toResponse(doc, owner);
    }

    @Override
    public void deleteDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        doc.setDeleted(true);
        documentRepository.save(doc);
    }

    @Override
    public AdminDocumentResponse moderateDocument(Long id, AdminDocumentModerationRequest request) {
        // TODO: Map status and moderationReason once columns are configured in Document.java
        throw new RuntimeException("Document moderation fields are not configured yet.");
    }
}
